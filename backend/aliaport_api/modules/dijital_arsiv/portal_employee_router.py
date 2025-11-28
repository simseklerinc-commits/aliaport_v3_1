"""
PORTAL EMPLOYEE & VEHICLE ROUTER
Firma çalışanları ve araç tanımlamaları için endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date
import uuid
import os
from pathlib import Path

from ...config.database import get_db
from .models import PortalEmployee, PortalVehicle, PortalUser, PortalEmployeeDocument, VehicleDocument, VehicleDocumentType
from .portal_router import get_current_portal_user
from .vehicle_documents import compute_vehicle_status, create_default_vehicle_documents
from .sgk_status import (
    EmployeeSgkStatus,
    compute_employee_sgk_status,
)
from pydantic import BaseModel, Field

router = APIRouter(prefix="/portal", tags=["Portal Employees & Vehicles"])


# ============================================
# SCHEMAS
# ============================================

class PortalEmployeeBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    tc_kimlik: Optional[str] = Field(None, min_length=11, max_length=11)
    pasaport: Optional[str] = Field(None, max_length=20)
    nationality: Optional[str] = Field("TUR", max_length=3)
    phone: Optional[str] = Field(None, max_length=20)
    position: Optional[str] = Field(None, max_length=100)
    sgk_last_check_period: Optional[str] = Field(None, min_length=6, max_length=6, description="YYYYMM formatında son kontrol dönemi")
    sgk_is_active_last_period: bool = Field(False, description="Son SGK döneminde aktif mi")


class PortalEmployeeCreate(PortalEmployeeBase):
    pass


class PortalEmployeeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    tc_kimlik: Optional[str] = Field(None, min_length=11, max_length=11)
    pasaport: Optional[str] = Field(None, max_length=20)
    nationality: Optional[str] = Field(None, max_length=3)
    phone: Optional[str] = Field(None, max_length=20)
    position: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    sgk_last_check_period: Optional[str] = Field(None, min_length=6, max_length=6)
    sgk_is_active_last_period: Optional[bool] = None


class PortalEmployeeResponse(PortalEmployeeBase):
    id: int
    cari_id: int
    identity_photo_url: Optional[str]
    is_active: bool
    created_at: datetime
    sgk_is_active_last_period: bool = Field(False, description="Son SGK döneminde aktif mi")
    sgk_last_check_period: Optional[str] = Field(None, description="YYYYMM formatında son SGK kontrol dönemi")
    sgk_status: Optional[EmployeeSgkStatus] = Field(None, description="TAM / EKSİK / ONAY_BEKLIYOR")
    documents: List['PortalEmployeeDocumentResponse'] = []
    
    class Config:
        from_attributes = True


class PortalEmployeeDocumentResponse(BaseModel):
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


# Update forward reference
PortalEmployeeResponse.model_rebuild()


class PortalVehicleBase(BaseModel):
    plaka: str = Field(..., min_length=2, max_length=20)
    marka: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    vehicle_type: Optional[str] = Field(None, max_length=50)
    ruhsat_sahibi: Optional[str] = Field(None, max_length=200)
    ruhsat_tarihi: Optional[datetime] = None


class PortalVehicleCreate(PortalVehicleBase):
    pass


class PortalVehicleUpdate(BaseModel):
    plaka: Optional[str] = Field(None, max_length=20)
    marka: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    vehicle_type: Optional[str] = Field(None, max_length=50)
    ruhsat_sahibi: Optional[str] = Field(None, max_length=200)
    ruhsat_tarihi: Optional[datetime] = None
    is_active: Optional[bool] = None


class PortalVehicleResponse(PortalVehicleBase):
    id: int
    cari_id: int
    is_active: bool
    created_at: datetime
    vehicle_status: Optional[str] = None  # "AKTİF", "EKSİK_EVRAK", "ONAY_BEKLIYOR"
    
    class Config:
        from_attributes = True


# Vehicle Document Schemas
class VehicleDocumentInfo(BaseModel):
    """Tek bir araç evrakının bilgisi"""
    id: int
    doc_type_code: str
    doc_type_name: str
    status: str  # MISSING, PENDING, APPROVED, REJECTED, EXPIRED
    expiry_date: Optional[date] = None
    has_file: bool
    uploaded_at: Optional[datetime] = None


class VehicleDocumentSummary(BaseModel):
    """Araç evraklarının özet durumu"""
    status: str  # Genel araç durumu: AKTİF, EKSİK_EVRAK, ONAY_BEKLIYOR
    missing_required: int
    pending: int
    approved: int
    rejected: int
    expired: int


class VehicleDocumentsResponse(BaseModel):
    """Araç evraklarının tam listesi"""
    vehicle_id: int
    summary: VehicleDocumentSummary
    documents: List[VehicleDocumentInfo]


# ============================================
# EMPLOYEE ENDPOINTS
# ============================================

@router.get("/employees", response_model=List[PortalEmployeeResponse])
def get_employees(
    current_user: PortalUser = Depends(get_current_portal_user),
    is_active: Optional[bool] = True,  # Varsayılan olarak sadece aktif personeller
    db: Session = Depends(get_db)
):
    """Firma çalışanları listesi"""
    query = db.query(PortalEmployee).options(
        joinedload(PortalEmployee.documents)
    ).filter(
        PortalEmployee.cari_id == current_user.cari_id
    )
    
    if is_active is not None:
        query = query.filter(PortalEmployee.is_active == is_active)
    
    employees = query.order_by(PortalEmployee.full_name).all()

    for emp in employees:
        emp.sgk_status = compute_employee_sgk_status(db, emp)
    
    return employees


@router.get("/employees/{employee_id}", response_model=PortalEmployeeResponse)
def get_employee(
    employee_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan detayı"""
    employee = db.query(PortalEmployee).options(
        joinedload(PortalEmployee.documents)
    ).filter(
        PortalEmployee.id == employee_id,
        PortalEmployee.cari_id == current_user.cari_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")
    
    employee.sgk_status = compute_employee_sgk_status(db, employee)
    return employee


@router.post("/employees", response_model=PortalEmployeeResponse)
def create_employee(
    data: PortalEmployeeCreate,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Yeni çalışan ekle"""
    # TC veya Pasaport zorunlu
    if not data.tc_kimlik and not data.pasaport:
        raise HTTPException(
            status_code=400,
            detail="TC Kimlik No veya Pasaport No zorunludur"
        )
    
    # Pozisyon zorunlu
    if not data.position:
        raise HTTPException(
            status_code=400,
            detail="Pozisyon seçimi zorunludur"
        )
    
    employee = PortalEmployee(
        cari_id=current_user.cari_id,
        full_name=data.full_name,
        tc_kimlik=data.tc_kimlik,
        pasaport=data.pasaport,
        nationality=data.nationality,
        phone=data.phone,
        position=data.position,
        sgk_last_check_period=data.sgk_last_check_period,
        sgk_is_active_last_period=data.sgk_is_active_last_period,
        created_by=current_user.id
    )
    
    db.add(employee)
    db.commit()
    db.refresh(employee)
    employee.sgk_status = compute_employee_sgk_status(db, employee)
    employee.documents = []
    
    return employee


@router.put("/employees/{employee_id}", response_model=PortalEmployeeResponse)
def update_employee(
    employee_id: int,
    data: PortalEmployeeUpdate,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan güncelle"""
    employee = db.query(PortalEmployee).filter(
        PortalEmployee.id == employee_id,
        PortalEmployee.cari_id == current_user.cari_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")
    
    update_data = data.dict(exclude_unset=True)
    
    # Pozisyon güncelleniyorsa boş olamaz
    if 'position' in update_data and not update_data['position']:
        raise HTTPException(
            status_code=400,
            detail="Pozisyon seçimi zorunludur"
        )
    
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    employee.updated_by = current_user.id
    employee.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(employee)
    employee.documents = db.query(PortalEmployeeDocument).filter(
        PortalEmployeeDocument.employee_id == employee.id
    ).all()
    employee.sgk_status = compute_employee_sgk_status(db, employee)
    
    return employee


@router.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan sil (soft delete)"""
    employee = db.query(PortalEmployee).filter(
        PortalEmployee.id == employee_id,
        PortalEmployee.cari_id == current_user.cari_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")
    
    employee.is_active = False
    employee.updated_by = current_user.id
    employee.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Çalışan silindi"}


@router.post("/employees/{employee_id}/upload-identity")
async def upload_employee_identity(
    employee_id: int,
    file: UploadFile = File(...),
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan kimlik fotoğrafı yükle"""
    employee = db.query(PortalEmployee).filter(
        PortalEmployee.id == employee_id,
        PortalEmployee.cari_id == current_user.cari_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")
    
    # File validation
    allowed_types = ["image/jpeg", "image/jpg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Sadece JPEG ve PNG dosyaları kabul edilir"
        )
    
    max_size = 5 * 1024 * 1024  # 5 MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Dosya boyutu 5 MB'ı aşamaz")
    
    # Save file
    upload_dir = Path("uploads/employee_identity")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{employee_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = upload_dir / unique_filename
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Update employee
    employee.identity_photo_url = f"/uploads/employee_identity/{unique_filename}"
    employee.updated_by = current_user.id
    employee.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Kimlik fotoğrafı yüklendi",
        "url": employee.identity_photo_url
    }


# ============================================
# VEHICLE ENDPOINTS
# ============================================

@router.get("/vehicles", response_model=List[PortalVehicleResponse])
def get_vehicles(
    current_user: PortalUser = Depends(get_current_portal_user),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Firma araçları listesi"""
    query = db.query(PortalVehicle).filter(
        PortalVehicle.cari_id == current_user.cari_id
    )
    
    if is_active is not None:
        query = query.filter(PortalVehicle.is_active == is_active)
    
    vehicles = query.order_by(PortalVehicle.plaka).all()
    
    # Her araç için vehicle_status hesapla
    result = []
    for vehicle in vehicles:
        vehicle_dict = {
            "id": vehicle.id,
            "cari_id": vehicle.cari_id,
            "plaka": vehicle.plaka,
            "marka": vehicle.marka,
            "model": vehicle.model,
            "vehicle_type": vehicle.vehicle_type,
            "ruhsat_sahibi": vehicle.ruhsat_sahibi,
            "ruhsat_tarihi": vehicle.ruhsat_tarihi,
            "is_active": vehicle.is_active,
            "created_at": vehicle.created_at,
            "vehicle_status": compute_vehicle_status(db, vehicle.id)
        }
        result.append(vehicle_dict)
    
    return result


@router.get("/vehicles/{vehicle_id}", response_model=PortalVehicleResponse)
def get_vehicle(
    vehicle_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Araç detayı"""
    vehicle = db.query(PortalVehicle).filter(
        PortalVehicle.id == vehicle_id,
        PortalVehicle.cari_id == current_user.cari_id
    ).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    # vehicle_status ekle
    vehicle_dict = {
        "id": vehicle.id,
        "cari_id": vehicle.cari_id,
        "plaka": vehicle.plaka,
        "marka": vehicle.marka,
        "model": vehicle.model,
        "vehicle_type": vehicle.vehicle_type,
        "ruhsat_sahibi": vehicle.ruhsat_sahibi,
        "ruhsat_tarihi": vehicle.ruhsat_tarihi,
        "is_active": vehicle.is_active,
        "created_at": vehicle.created_at,
        "vehicle_status": compute_vehicle_status(db, vehicle.id)
    }
    return vehicle_dict


@router.post("/vehicles", response_model=PortalVehicleResponse)
def create_vehicle(
    data: PortalVehicleCreate,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Yeni araç ekle"""
    vehicle = PortalVehicle(
        cari_id=current_user.cari_id,
        plaka=data.plaka,
        marka=data.marka,
        model=data.model,
        vehicle_type=data.vehicle_type,
        ruhsat_sahibi=data.ruhsat_sahibi,
        ruhsat_tarihi=data.ruhsat_tarihi,
        created_by=current_user.id
    )
    
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    
    # Zorunlu belgeler için otomatik MISSING kayıtları oluştur
    create_default_vehicle_documents(db, vehicle.id)
    
    # vehicle_status ile döndür
    vehicle_dict = {
        "id": vehicle.id,
        "cari_id": vehicle.cari_id,
        "plaka": vehicle.plaka,
        "marka": vehicle.marka,
        "model": vehicle.model,
        "vehicle_type": vehicle.vehicle_type,
        "ruhsat_sahibi": vehicle.ruhsat_sahibi,
        "ruhsat_tarihi": vehicle.ruhsat_tarihi,
        "is_active": vehicle.is_active,
        "created_at": vehicle.created_at,
        "vehicle_status": compute_vehicle_status(db, vehicle.id)
    }
    return vehicle_dict


@router.put("/vehicles/{vehicle_id}", response_model=PortalVehicleResponse)
def update_vehicle(
    vehicle_id: int,
    data: PortalVehicleUpdate,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Araç güncelle"""
    vehicle = db.query(PortalVehicle).filter(
        PortalVehicle.id == vehicle_id,
        PortalVehicle.cari_id == current_user.cari_id
    ).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)
    
    vehicle.updated_by = current_user.id
    vehicle.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(vehicle)
    
    # vehicle_status hesapla ve döndür
    vehicle_status = compute_vehicle_status(db, vehicle.id)
    
    return {
        **vehicle.__dict__,
        "vehicle_status": vehicle_status
    }


@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Araç sil (soft delete)"""
    vehicle = db.query(PortalVehicle).filter(
        PortalVehicle.id == vehicle_id,
        PortalVehicle.cari_id == current_user.cari_id
    ).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    vehicle.is_active = False
    vehicle.updated_by = current_user.id
    vehicle.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Araç silindi"}


# ============================================
# EMPLOYEE DOCUMENT ENDPOINTS
# ============================================

@router.post("/employees/{employee_id}/documents", response_model=PortalEmployeeDocumentResponse)
async def upload_employee_document(
    employee_id: int,
    document_type: str = Form(...),  # EHLIYET, SRC5, SGK_ISE_GIRIS
    issue_date: Optional[str] = Form(None),  # ISO format
    expires_at: Optional[str] = Form(None),  # ISO format
    file: UploadFile = File(...),
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan belgesi yükle (Ehliyet, SRC-5, SGK İşe Giriş)"""
    # Çalışanı kontrol et
    employee = db.query(PortalEmployee).filter(
        PortalEmployee.id == employee_id,
        PortalEmployee.cari_id == current_user.cari_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")
    
    normalized_doc_type = (document_type or '').strip().upper()
    if normalized_doc_type == 'SGK_GIRIS':
        normalized_doc_type = 'SGK_ISE_GIRIS'

    allowed_document_types = {'EHLIYET', 'SRC5', 'SGK_ISE_GIRIS'}
    if normalized_doc_type not in allowed_document_types:
        raise HTTPException(status_code=400, detail="Geçersiz belge tipi")
    document_type = normalized_doc_type
    
    # Dosya boyutu kontrolü (10MB)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'dan büyük olamaz")
    
    # Dosya uzantısı kontrolü
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Desteklenmeyen dosya formatı")
    
    # Dosya kaydetme dizini
    upload_dir = Path("uploads/employee_documents") / str(current_user.cari_id) / str(employee_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Dosya adı oluştur
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{document_type}_{timestamp}{file_ext}"
    file_path = upload_dir / safe_filename
    
    # Dosyayı kaydet
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Aynı tipte mevcut belge var mı kontrol et (versiyonlama için)
    existing_doc = db.query(PortalEmployeeDocument).filter(
        PortalEmployeeDocument.employee_id == employee_id,
        PortalEmployeeDocument.document_type == document_type,
        PortalEmployeeDocument.is_latest_version == True
    ).first()
    
    # Versiyonlama mantığı
    version_number = 1
    previous_version_id = None
    
    if existing_doc:
        # Eski versiyonu güncelle
        existing_doc.is_latest_version = False
        version_number = existing_doc.version + 1
        previous_version_id = existing_doc.id
        db.flush()  # ID'nin kullanılabilir olması için
    
    # Veritabanına kaydet
    doc = PortalEmployeeDocument(
        employee_id=employee_id,
        cari_id=current_user.cari_id,
        document_type=document_type,
        file_name=file.filename,
        file_path=str(file_path),
        file_size=len(file_content),
        file_type=file.content_type or 'application/octet-stream',
        issue_date=datetime.fromisoformat(issue_date) if issue_date else None,
        expires_at=datetime.fromisoformat(expires_at) if expires_at else None,
        uploaded_by=current_user.id,
        version=version_number,
        is_latest_version=True,
        previous_version_id=previous_version_id
    )
    
    db.add(doc)
    
    # SGK İŞE GİRİŞ belgesi yüklendiğinde çalışanı aktif yap
    if document_type == 'SGK_ISE_GIRIS':
        employee.sgk_is_active_last_period = True
        # Eğer period yoksa, mevcut ay/yıl olarak set et
        if not employee.sgk_last_check_period:
            from datetime import datetime
            now = datetime.utcnow()
            employee.sgk_last_check_period = f"{now.year}{now.month:02d}"
    # Güncel SGK statüsünü tekrar hesapla
    employee.sgk_status = compute_employee_sgk_status(db, employee)
    
    db.commit()
    db.refresh(doc)
    
    return doc


@router.get("/employees/{employee_id}/documents", response_model=List[PortalEmployeeDocumentResponse])
def get_employee_documents(
    employee_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan belgelerini listele"""
    # Çalışanı kontrol et
    employee = db.query(PortalEmployee).filter(
        PortalEmployee.id == employee_id,
        PortalEmployee.cari_id == current_user.cari_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")
    
    # Sadece en güncel versiyonları getir
    documents = db.query(PortalEmployeeDocument).filter(
        PortalEmployeeDocument.employee_id == employee_id,
        PortalEmployeeDocument.is_latest_version == True
    ).all()
    
    return documents


@router.get("/employees/{employee_id}/documents/{document_id}/history", response_model=List[PortalEmployeeDocumentResponse])
def get_document_history(
    employee_id: int,
    document_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Belge geçmişini getir (tüm versiyonlar)"""
    # Çalışanı kontrol et
    employee = db.query(PortalEmployee).filter(
        PortalEmployee.id == employee_id,
        PortalEmployee.cari_id == current_user.cari_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Çalışan bulunamadı")
    
    # Belgeyi kontrol et
    current_doc = db.query(PortalEmployeeDocument).filter(
        PortalEmployeeDocument.id == document_id,
        PortalEmployeeDocument.employee_id == employee_id
    ).first()
    
    if not current_doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    # Tüm versiyonları topla (zincir halinde geriye giderek)
    versions = [current_doc]
    current = current_doc
    
    while current.previous_version_id:
        previous = db.query(PortalEmployeeDocument).filter(
            PortalEmployeeDocument.id == current.previous_version_id
        ).first()
        if previous:
            versions.append(previous)
            current = previous
        else:
            break
    
    # Aynı tipte olan diğer tüm versiyonları da kontrol et (güvenlik için)
    all_versions = db.query(PortalEmployeeDocument).filter(
        PortalEmployeeDocument.employee_id == employee_id,
        PortalEmployeeDocument.document_type == current_doc.document_type
    ).order_by(PortalEmployeeDocument.version.desc()).all()
    
    return all_versions


@router.delete("/employees/{employee_id}/documents/{document_id}")
def delete_employee_document(
    employee_id: int,
    document_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Çalışan belgesini sil"""
    # Belgeyi kontrol et
    doc = db.query(PortalEmployeeDocument).filter(
        PortalEmployeeDocument.id == document_id,
        PortalEmployeeDocument.employee_id == employee_id,
        PortalEmployeeDocument.cari_id == current_user.cari_id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    # Dosyayı sil
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    # Veritabanından sil
    db.delete(doc)
    db.commit()
    
    return {"message": "Belge silindi"}


# ============================================
# VEHICLE DOCUMENT ENDPOINTS
# ============================================

@router.get("/vehicles/{vehicle_id}/documents", response_model=VehicleDocumentsResponse)
def get_vehicle_documents(
    vehicle_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Araç evraklarının tam listesi"""
    # Araç kontrolü
    vehicle = db.query(PortalVehicle).filter(
        PortalVehicle.id == vehicle_id,
        PortalVehicle.cari_id == current_user.cari_id
    ).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    # Eğer bu araç için default kayıtlar oluşturulmamışsa şimdi oluştur
    create_default_vehicle_documents(db, vehicle_id)

    # Tüm belgeleri al (join with doc_type)
    documents = db.query(VehicleDocument).join(
        VehicleDocumentType, VehicleDocument.doc_type_id == VehicleDocumentType.id
    ).filter(
        VehicleDocument.vehicle_id == vehicle_id
    ).all()
    
    # Özet hesapla
    missing_required = 0
    pending = 0
    approved = 0
    rejected = 0
    expired = 0
    
    today = date.today()
    doc_list = []
    
    for doc in documents:
        # Süre kontrolü
        current_status = doc.status
        if current_status == "APPROVED" and doc.expiry_date and doc.expiry_date < today:
            current_status = "EXPIRED"
        
        # Sayaçları artır
        if current_status == "MISSING":
            missing_required += 1
        elif current_status == "PENDING":
            pending += 1
        elif current_status == "APPROVED":
            approved += 1
        elif current_status == "REJECTED":
            rejected += 1
        elif current_status == "EXPIRED":
            expired += 1
        
        doc_list.append(VehicleDocumentInfo(
            id=doc.id,
            doc_type_code=doc.doc_type.code,
            doc_type_name=doc.doc_type.name,
            status=current_status,
            expiry_date=doc.expiry_date,
            has_file=bool(doc.file_storage_key),
            uploaded_at=doc.uploaded_at
        ))
    
    # Genel durum
    vehicle_status = compute_vehicle_status(db, vehicle_id)
    
    summary = VehicleDocumentSummary(
        status=vehicle_status,
        missing_required=missing_required,
        pending=pending,
        approved=approved,
        rejected=rejected,
        expired=expired
    )
    
    return VehicleDocumentsResponse(
        vehicle_id=vehicle_id,
        summary=summary,
        documents=doc_list
    )


@router.post("/vehicles/{vehicle_id}/documents/{doc_type_code}/upload")
def upload_vehicle_document(
    vehicle_id: int,
    doc_type_code: str,
    file: UploadFile = File(...),
    expiry_date: Optional[str] = Form(None),  # YYYY-MM-DD format
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Araç belgesi yükle"""
    # Araç kontrolü
    vehicle = db.query(PortalVehicle).filter(
        PortalVehicle.id == vehicle_id,
        PortalVehicle.cari_id == current_user.cari_id
    ).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Araç bulunamadı")
    
    # Belge tipini bul
    doc_type = db.query(VehicleDocumentType).filter(
        VehicleDocumentType.code == doc_type_code.upper()
    ).first()
    
    if not doc_type:
        raise HTTPException(status_code=404, detail=f"Belge tipi bulunamadı: {doc_type_code}")
    
    # VehicleDocument kaydını bul veya oluştur
    vehicle_doc = db.query(VehicleDocument).filter(
        VehicleDocument.vehicle_id == vehicle_id,
        VehicleDocument.doc_type_id == doc_type.id
    ).first()
    
    if not vehicle_doc:
        # Yoksa oluştur
        vehicle_doc = VehicleDocument(
            vehicle_id=vehicle_id,
            doc_type_id=doc_type.id,
            status="MISSING"
        )
        db.add(vehicle_doc)
        db.commit()
        db.refresh(vehicle_doc)
    
    # Dosyayı kaydet - Dijital Arşiv uyumlu storage_key
    # Format: vehicles/{vehicle_id}/{doc_type_code}/{timestamp}_{filename}
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_extension = Path(file.filename).suffix if file.filename else ".pdf"
    storage_key = f"vehicles/{vehicle_id}/{doc_type_code}/{timestamp}{file_extension}"
    
    # Dosya yolu - mevcut uploads dizinini kullan
    upload_dir = Path("uploads") / "vehicles" / str(vehicle_id) / doc_type_code
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / f"{timestamp}{file_extension}"
    
    # Dosyayı kaydet
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    
    # VehicleDocument'i güncelle
    vehicle_doc.file_storage_key = storage_key
    vehicle_doc.uploaded_at = datetime.utcnow()
    vehicle_doc.uploaded_by_user_id = current_user.id
    vehicle_doc.status = "PENDING"  # Yüklendi, onay bekliyor
    
    # Expiry date varsa ekle
    if expiry_date:
        try:
            vehicle_doc.expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Geçersiz tarih formatı. YYYY-MM-DD kullanın")
    
    db.commit()
    db.refresh(vehicle_doc)
    
    return {
        "id": vehicle_doc.id,
        "vehicle_id": vehicle_id,
        "doc_type_code": doc_type.code,
        "doc_type_name": doc_type.name,
        "status": vehicle_doc.status,
        "file_storage_key": vehicle_doc.file_storage_key,
        "uploaded_at": vehicle_doc.uploaded_at,
        "expiry_date": vehicle_doc.expiry_date,
        "message": "Belge başarıyla yüklendi. Onay bekleniyor."
    }
