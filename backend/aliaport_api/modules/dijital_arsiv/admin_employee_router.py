"""
ADMIN EMPLOYEE ROUTER
Admin kullanıcıları için tüm firmaların çalışan ve belge raporları
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
import zipfile
import io
import os

from ...config.database import get_db
from .models import PortalEmployee, PortalEmployeeDocument, PortalUser
from .portal_router import get_current_portal_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin - Employee Reports"])


# ============================================
# SCHEMAS
# ============================================

class EmployeeDocumentResponse(BaseModel):
    id: int
    employee_id: int
    document_type: str
    file_name: str
    file_size: int
    file_type: str
    issue_date: Optional[datetime]
    expires_at: Optional[datetime]
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class EmployeeReportResponse(BaseModel):
    id: int
    full_name: str
    tc_kimlik: Optional[str]
    pasaport: Optional[str]
    nationality: Optional[str]
    phone: Optional[str]
    position: Optional[str]
    is_active: bool
    sgk_last_check_period: Optional[str]
    sgk_is_active_last_period: bool
    cari_id: int
    cari_code: Optional[str]
    cari_title: Optional[str]
    documents: List[EmployeeDocumentResponse] = []
    
    class Config:
        from_attributes = True


# ============================================
# HELPER FUNCTIONS
# ============================================

def check_admin_permission(current_user: PortalUser):
    """Admin yetkisi kontrolü"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Bu işlem için admin yetkisi gereklidir"
        )


# ============================================
# ENDPOINTS
# ============================================

@router.get("/employees", response_model=List[EmployeeReportResponse])
def get_all_employees(
    current_user: PortalUser = Depends(get_current_portal_user),
    cari_id: Optional[int] = Query(None, description="Firmaya göre filtrele"),
    position: Optional[str] = Query(None, description="Pozisyona göre filtrele"),
    document_type: Optional[str] = Query(None, description="Belge tipine göre filtrele (EHLIYET, SRC5)"),
    is_active: Optional[bool] = Query(None, description="Aktiflik durumuna göre filtrele"),
    db: Session = Depends(get_db)
):
    """
    Tüm firmaların çalışanlarını listele (Admin only)
    Filtreleme seçenekleri: firma, pozisyon, belge tipi, aktiflik
    """
    check_admin_permission(current_user)
    
    # Base query
    query = db.query(PortalEmployee).options(
        joinedload(PortalEmployee.cari)
    )
    
    # Filtreler
    if cari_id is not None:
        query = query.filter(PortalEmployee.cari_id == cari_id)
    
    if position:
        query = query.filter(PortalEmployee.position == position)
    
    if is_active is not None:
        query = query.filter(PortalEmployee.is_active == is_active)
    
    employees = query.order_by(PortalEmployee.cari_id, PortalEmployee.full_name).all()
    
    # Belgeleri yükle ve filtrele
    result = []
    for emp in employees:
        # Belgeleri yükle
        docs = db.query(PortalEmployeeDocument).filter(
            PortalEmployeeDocument.employee_id == emp.id
        ).all()
        
        # Belge tipi filtrelemesi
        if document_type:
            docs = [d for d in docs if d.document_type == document_type]
            # Eğer belge tipi filtresi varsa ve çalışanda o belge yoksa, atla
            if not docs:
                continue
        
        # Response oluştur
        emp_response = EmployeeReportResponse(
            id=emp.id,
            full_name=emp.full_name,
            tc_kimlik=emp.tc_kimlik,
            pasaport=emp.pasaport,
            nationality=emp.nationality,
            phone=emp.phone,
            position=emp.position,
            is_active=emp.is_active,
            sgk_last_check_period=emp.sgk_last_check_period,
            sgk_is_active_last_period=emp.sgk_is_active_last_period,
            cari_id=emp.cari_id,
            cari_code=emp.cari.CariKod if emp.cari else None,
            cari_title=emp.cari.CariIsim if emp.cari else None,
            documents=[EmployeeDocumentResponse.from_orm(d) for d in docs]
        )
        result.append(emp_response)
    
    return result


@router.get("/employees/stats")
def get_employee_stats(
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan istatistikleri (Admin only)"""
    check_admin_permission(current_user)
    
    total_employees = db.query(PortalEmployee).count()
    active_employees = db.query(PortalEmployee).filter(PortalEmployee.is_active == True).count()
    total_documents = db.query(PortalEmployeeDocument).count()
    
    # Pozisyon dağılımı
    from sqlalchemy import func
    position_distribution = db.query(
        PortalEmployee.position,
        func.count(PortalEmployee.id)
    ).filter(
        PortalEmployee.is_active == True
    ).group_by(
        PortalEmployee.position
    ).all()
    
    # Firma başına çalışan sayısı
    employees_by_company = db.query(
        PortalEmployee.cari_id,
        func.count(PortalEmployee.id)
    ).filter(
        PortalEmployee.is_active == True
    ).group_by(
        PortalEmployee.cari_id
    ).all()
    
    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "inactive_employees": total_employees - active_employees,
        "total_documents": total_documents,
        "position_distribution": {pos: count for pos, count in position_distribution if pos},
        "companies_with_employees": len(employees_by_company)
    }


@router.get("/employees/documents/download-zip")
def download_employee_documents_zip(
    cari_id: Optional[int] = Query(None, description="Firmaya göre filtrele"),
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """
    Firma bazlı tüm çalışan belgelerini ZIP olarak indir (Admin only)
    """
    check_admin_permission(current_user)
    
    # Belgeleri filtrele
    query = db.query(PortalEmployeeDocument).options(
        joinedload(PortalEmployeeDocument.employee),
        joinedload(PortalEmployeeDocument.cari)
    )
    
    if cari_id:
        query = query.filter(PortalEmployeeDocument.cari_id == cari_id)
    
    documents = query.all()
    
    if not documents:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    # ZIP oluştur
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for doc in documents:
            if os.path.exists(doc.file_path):
                # Dosya adı: FirmaKodu_CalisanAdi_BelgeTipi_Tarih.ext
                cari_code = doc.cari.CariKod if doc.cari else 'UNKNOWN'
                employee_name = doc.employee.full_name.replace(' ', '_') if doc.employee else 'UNKNOWN'
                file_ext = os.path.splitext(doc.file_name)[1]
                timestamp = doc.uploaded_at.strftime('%Y%m%d')
                
                zip_filename = f"{cari_code}/{employee_name}/{doc.document_type}_{timestamp}{file_ext}"
                
                # Dosyayı ZIP'e ekle
                with open(doc.file_path, 'rb') as f:
                    zip_file.writestr(zip_filename, f.read())
    
    # ZIP'i döndür
    zip_buffer.seek(0)
    
    filename = f"calisanlar_belgeleri_{cari_id if cari_id else 'tum'}_{datetime.now().strftime('%Y%m%d')}.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

