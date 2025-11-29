"""
DİJİTAL ARŞİV MODÜLÜ - Portal API Router
Dış müşteri (portal kullanıcı) için endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Set
from datetime import datetime, timedelta
import hashlib
import jwt
import os
from pathlib import Path
import re
import logging
from io import BytesIO
from pdfminer.high_level import extract_text

logger = logging.getLogger(__name__)

from ...config.database import get_db
from .models import PortalUser, ArchiveDocument, Notification, DocumentStatus, DocumentCategory, DocumentType, PortalEmployee, PortalEmployeeSgkPeriod
from ...config.storage import get_base_sgk_dir
from ...core.error_codes import ErrorCode
from ...core.responses import success_response, error_response
from ..sgk.models import SgkPeriodCheck
from ..isemri.models import WorkOrder, WorkOrderStatus
from ..hizmet.models import Hizmet
from .schemas import (
    PortalUserLogin, PortalTokenResponse,
    PortalUserPasswordChange, PortalUserForgotPassword, PortalUserResetPassword,
    ArchiveDocumentCreate, ArchiveDocumentResponse, ArchiveDocumentListResponse,
    FileUploadResponse, NotificationResponse, NotificationListResponse,
    WorkOrderDocumentStatus
)
from ..isemri.schemas import WorkOrderCreate, WorkOrderResponse

router = APIRouter(prefix="/portal", tags=["Portal"])

# JWT Configuration
SECRET_KEY = os.getenv("PORTAL_JWT_SECRET", "your-portal-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 saat

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/portal/auth/login")

SGK_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
TC_REGEX = re.compile(r"\b[1-9][0-9]{10}\b")


def _normalize_period(period_value: str) -> str:
    """Convert 'YYYY-MM' formatted period into 'YYYYMM'."""
    value = (period_value or "").strip()
    try:
        parsed = datetime.strptime(value, "%Y-%m")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response(
                code=ErrorCode.INVALID_INPUT,
                message="period değeri 'YYYY-MM' formatında olmalıdır.",
                details={"period": period_value},
            ),
        )
    return parsed.strftime("%Y%m")


def _sanitize_storage_segment(raw_value: str) -> str:
    """Normalize path segments so they are filesystem safe."""
    cleaned = (raw_value or "FIRMA").strip().upper()
    safe_value = re.sub(r"[^A-Z0-9_-]+", "_", cleaned)
    return safe_value or "FIRMA"


def _extract_tc_numbers(file_bytes: bytes) -> Set[str]:
    """Extract TC Kimlik numbers from PDF bytes."""
    try:
        text = extract_text(BytesIO(file_bytes))
    except Exception:
        return set()
    if not text:
        return set()
    return set(TC_REGEX.findall(text))


def _extract_sgk_employees(file_bytes: bytes) -> dict[str, str]:
    """
    SGK PDF'inden çalışan bilgilerini çıkar - INDEX BAZLI EŞLEŞTİRME.
    Returns: {tc_no: full_name} dict
    
    Yaklaşım:
    1. Tüm TC numaralarını topla (sırayla)
    2. TC'den 2 satır sonrasındaki tüm kelimeleri topla (AD listesi)
    3. INDEX bazlı eşleştir: TC[i] => AD[i] + SOYAD[i]
    """
    try:
        text = extract_text(BytesIO(file_bytes))
    except Exception as e:
        logger.error(f"PDF extract HATA: {e}")
        return {}
    
    if not text:
        logger.warning("PDF boş text döndü")
        return {}
    
    lines = [line.strip() for line in text.split('\n')]
    logger.info(f"SGK PDF parsing: {len(lines)} satır bulundu")
    
    # 1. ADIM: Tüm TC'leri topla ve pozisyonlarını kaydet
    tc_list = []
    tc_positions = {}  # {line_index: tc_no}
    
    for i, line in enumerate(lines):
        if not line:
            continue
        tc_match = TC_REGEX.search(line)
        if tc_match:
            tc_no = tc_match.group(0)
            tc_list.append(tc_no)
            tc_positions[i] = tc_no
    
    logger.info(f"📋 {len(tc_list)} TC numarası bulundu")
    
    # 2. ADIM: Her TC için +2 offset'teki satırı al (AD)
    ad_list = []
    for i, line in enumerate(lines):
        if i in tc_positions:
            # TC bulundu, +2 satır sonraki kelimeleri al
            ad_line = lines[i + 2] if i + 2 < len(lines) else ""
            ad_words = [w for w in ad_line.split() if w.isalpha() and len(w) >= 2]
            ad = " ".join(ad_words) if ad_words else ""
            ad_list.append(ad)
    
    # 3. ADIM: Her TC için +4 veya sonraki satırlarda soyad ara
    soyad_list = []
    tc_indices = sorted(tc_positions.keys())
    
    for idx_pos, tc_idx in enumerate(tc_indices):
        # Sonraki TC'nin pozisyonu
        next_tc_idx = tc_indices[idx_pos + 1] if idx_pos + 1 < len(tc_indices) else len(lines)
        
        # TC+4 ile NextTC arası first non-empty, non-TC kelime
        soyad = ""
        for offset in range(4, next_tc_idx - tc_idx):
            check_idx = tc_idx + offset
            if check_idx >= len(lines):
                break
            
            check_line = lines[check_idx].strip()
            if not check_line:
                continue
            
            # TC ise atla
            if TC_REGEX.search(check_line):
                break
            
            # Kelime varsa al
            words = [w for w in check_line.split() if w.isalpha() and len(w) >= 2]
            if words:
                soyad = " ".join(words)
                break
        
        soyad_list.append(soyad)
    
    # 4. ADIM: Eşleştir
    result = {}
    for i, tc_no in enumerate(tc_list):
        ad = ad_list[i] if i < len(ad_list) else ""
        soyad = soyad_list[i] if i < len(soyad_list) else ""
        
        full_name = f"{ad} {soyad}".strip().upper()
        
        # Türkçe karakter düzeltmeleri
        if full_name:
            full_name = full_name.replace('î', 'İ').replace('Î', 'İ')
            full_name = full_name.replace('û', 'Ü').replace('Û', 'Ü')
            full_name = full_name.replace('Ü', 'Ü').replace('ü', 'ü')
        
        # İlk 5 kaydı logla
        if i < 5:
            logger.info(f"🔍 TC #{i+1}: {tc_no}")
            logger.info(f"   AD: [{ad}]")
            logger.info(f"   SOYAD: [{soyad}]")
            logger.info(f"   ✅ TAM İSİM: [{full_name}]")
        
        # Kaydet
        if len(full_name) >= 3:
            result[tc_no] = full_name
        else:
            result[tc_no] = ""
    
    successful_names = sum(1 for v in result.values() if v)
    success_rate = (successful_names * 100 // len(result)) if result else 0
    logger.info(f"✅ SGK extraction: {len(result)} TC bulundu, {successful_names} tanesi isimli ({success_rate}%)")
    
    return result


def _extract_period_from_pdf(file_bytes: bytes) -> Optional[str]:
    """
    Extract period (YYYYMM format) from SGK PDF content.
    Searches for patterns like: '2017-09', '2024-11', 'KASIM 2024', etc.
    Returns normalized period in YYYYMM format or None if not found.
    """
    try:
        text = extract_text(BytesIO(file_bytes))
    except Exception:
        return None
    
    if not text:
        return None
    
    # Pattern 1: "Yıl - Ay" field in SGK documents (most reliable)
    # Look for ": YYYY-M" or ": YYYY-MM" after "Yıl" or near the field labels
    yil_ay_pattern = re.search(r':\s*(20[0-9]{2})\s*[-–]\s*([1-9]|0[1-9]|1[0-2])\b', text)
    if yil_ay_pattern:
        year = yil_ay_pattern.group(1)
        month = yil_ay_pattern.group(2).zfill(2)  # Pad single digit with zero
        return f"{year}{month}"
    
    # Pattern 2: YYYY-MM format anywhere in document (less reliable, but fallback)
    pattern2 = re.search(r'\b(20[0-9]{2})[-–]\s*(0[1-9]|1[0-2])\b', text)
    if pattern2:
        year, month = pattern2.groups()
        return f"{year}{month}"
    
    # Pattern 3: Month name + Year (Turkish months)
    # OCAK, ŞUBAT, MART, NİSAN, MAYIS, HAZİRAN, TEMMUZ, AĞUSTOS, EYLÜL, EKİM, KASIM, ARALIK
    month_map = {
        'OCAK': '01', 'ŞUBAT': '02', 'MART': '03', 'NİSAN': '04',
        'MAYIS': '05', 'HAZİRAN': '06', 'TEMMUZ': '07', 'AĞUSTOS': '08',
        'EYLÜL': '09', 'EKİM': '10', 'KASIM': '11', 'ARALIK': '12'
    }
    
    for month_name, month_num in month_map.items():
        # Look for "EYLÜL 2017", "2017 EYLÜL", "EYLÜL AYI 2017", etc.
        pattern = rf'\b(?:({month_name})\s*(?:AYI)?\s*(20[0-9]{{2}})|(20[0-9]{{2}})\s*(?:AYI)?\s*({month_name}))\b'
        match = re.search(pattern, text.upper())
        if match:
            # Check which group matched
            if match.group(1):  # Month Year format
                year = match.group(2)
            else:  # Year Month format
                year = match.group(3)
            return f"{year}{month_num}"
    
    return None


# ============================================
# AUTH HELPERS
# ============================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT token oluştur"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_portal_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> PortalUser:
    """Mevcut portal kullanıcıyı getir"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik bilgileri",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_claim = payload.get("sub")
        if user_id_claim is None:
            raise credentials_exception
        try:
            user_id = int(user_id_claim)
        except (ValueError, TypeError):
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(PortalUser).filter(PortalUser.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


# ============================================
# AUTH ENDPOINTS
# ============================================

@router.post("/auth/login", response_model=PortalTokenResponse)
def portal_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Portal kullanıcı girişi
    
    - Email ve şifre ile giriş
    - JWT token döner
    - must_change_password kontrolü
    """
    user = db.query(PortalUser).options(
        joinedload(PortalUser.cari)
    ).filter(PortalUser.email == form_data.username).first()
    
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakıldı"
        )
    
    # Login kaydı
    user.record_login(ip_address=None)  # TODO: Request IP al
    db.commit()
    
    # JWT token oluştur
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "type": "portal"}
    )
    
    return PortalTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        must_change_password=user.must_change_password,
        cari_id=user.cari_id,
        cari_code=user.cari.CariKod if user.cari else "",
        is_admin=user.is_admin,
        created_at=user.created_at.isoformat() if user.created_at else None
    )


@router.get("/auth/me")
def get_current_user_profile(
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """
    Mevcut kullanıcının profil bilgilerini getir
    Cari bilgileri dahil
    """
    # Cari bilgilerini eager load et
    user = db.query(PortalUser).options(
        joinedload(PortalUser.cari)
    ).filter(PortalUser.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # Response oluştur
    response = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "position": user.position,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "must_change_password": user.must_change_password,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "login_count": user.login_count,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "cari_id": user.cari_id,
        "cari_code": user.cari.CariKod if user.cari else None,
        "cari_unvan": user.cari.Unvan if user.cari else None,
        "cari_telefon": user.cari.Telefon if user.cari else None,
        "cari_email": user.cari.Eposta if user.cari else None,
    }
    
    return response


@router.post("/auth/change-password")
def change_password(
    request: PortalUserPasswordChange,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Şifre değiştirme"""
    if not current_user.verify_password(request.old_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifre hatalı"
        )
    
    current_user.set_password(request.new_password)
    db.commit()
    
    return {"message": "Şifreniz başarıyla değiştirildi"}


@router.post("/auth/forgot-password")
def forgot_password(
    request: PortalUserForgotPassword,
    db: Session = Depends(get_db)
):
    """Şifre unutma (email gönder)"""
    user = db.query(PortalUser).filter(PortalUser.email == request.email).first()
    
    if not user:
        # Güvenlik: Email yoksa da başarılı mesajı dön
        return {"message": "Şifre sıfırlama bağlantısı email adresinize gönderildi"}
    
    # Reset token oluştur
    import secrets
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    # TODO: Email gönder
    # EmailService.send_password_reset_email(user.email, token)
    
    return {"message": "Şifre sıfırlama bağlantısı email adresinize gönderildi"}


@router.post("/auth/reset-password")
def reset_password(
    request: PortalUserResetPassword,
    db: Session = Depends(get_db)
):
    """Şifre sıfırlama (token ile)"""
    user = db.query(PortalUser).filter(
        PortalUser.password_reset_token == request.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz veya süresi dolmuş token"
        )
    
    if user.password_reset_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token süresi dolmuş"
        )
    
    user.set_password(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    return {"message": "Şifreniz başarıyla sıfırlandı"}


# ============================================
# WORK ORDER ENDPOINTS
# ============================================

@router.post("/work-orders", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
def create_work_order(
    request: WorkOrderCreate,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """
    İş emri talebi oluştur
    
    - Portal kullanıcı kendi carisine göre talep oluşturur
    - Durum: DRAFT
    - Belge yüklenene kadar SUBMITTED olmaz
    - Employee/Vehicle ilişkilendirmesi yapılır
    """
    # Cari kontrolü
    if request.CariId != current_user.cari_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece kendi firmanız için talep oluşturabilirsiniz"
        )
    
    # WO number oluştur
    from datetime import datetime
    # microsecond ekleyerek aynı saniyede gelen taleplerde çakışmayı önle
    wo_number = f"WO{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    
    # WorkOrder oluştur
    work_order = WorkOrder(
        wo_number=wo_number,
        cari_id=request.CariId,
        cari_code=request.CariCode,
        cari_title=request.CariTitle,
        portal_user_id=current_user.id,
        requester_user_id=None,  # Portal user
        requester_user_name=current_user.full_name,
        type=request.Type,
        service_code=request.ServiceCode,
        action=request.Action,
        subject=request.Subject,
        description=request.Description,
        priority=request.Priority,
        status=WorkOrderStatus.DRAFT,
        approval_status="PENDING_APPROVAL",
        gate_required=request.GateRequired,
        saha_kayit_yetkisi=request.SahaKayitYetkisi,
        created_by_name=current_user.full_name
    )
    
    db.add(work_order)
    db.flush()  # Get work_order.id without commit
    
    # Çoklu hizmet seçimi (ServiceCodes array olarak gelirse)
    # Frontend'den gelebilecek ServiceCodes field'ını handle et
    service_codes = getattr(request, 'ServiceCodes', None) or []
    if service_codes and isinstance(service_codes, list):
        from ..isemri.models import WorkOrderItem, WorkOrderItemType
        
        for service_code in service_codes:
            hizmet = db.query(Hizmet).filter(Hizmet.Kod == service_code).first()
            if not hizmet:
                continue
            unit = (hizmet.Birim or "ADET").upper()
            unit_price = float(hizmet.Fiyat or 0)
            vat_rate = float(hizmet.KdvOrani or 0)
            quantity = 1.0
            currency = (hizmet.ParaBirimi or "TRY").upper()[:3]
            total_amount = quantity * unit_price
            vat_amount = round(total_amount * (vat_rate / 100), 2) if vat_rate else 0.0
            grand_total = total_amount + vat_amount
            
            wo_item = WorkOrderItem(
                work_order_id=work_order.id,
                wo_number=work_order.wo_number,
                item_type=WorkOrderItemType.SERVICE,
                service_code=service_code,
                service_name=hizmet.Ad,
                quantity=quantity,
                unit=unit,
                unit_price=unit_price,
                currency=currency,
                total_amount=total_amount,
                vat_rate=vat_rate,
                vat_amount=vat_amount,
                grand_total=grand_total,
                notes=hizmet.Aciklama or "",
                created_by_name=current_user.full_name
            )
            db.add(wo_item)
    
    # Firma çalışanları seçimi (PortalEmployee master data'dan)
    if request.EmployeeIds:
        from ..isemri.models import WorkOrderEmployee
        for emp_id in request.EmployeeIds:
            wo_emp = WorkOrderEmployee(work_order_id=work_order.id, employee_id=emp_id)
            db.add(wo_emp)
    
    # Firma araçları seçimi (PortalVehicle master data'dan)
    if request.VehicleIds:
        from ..isemri.models import WorkOrderVehicle
        for veh_id in request.VehicleIds:
            wo_veh = WorkOrderVehicle(work_order_id=work_order.id, vehicle_id=veh_id)
            db.add(wo_veh)
    
    # Personel listesi (Personel Transfer hizmeti için - dinamik form)
    if request.PersonelList:
        from ..isemri.models import WorkOrderPerson
        for person in request.PersonelList:
            wo_person = WorkOrderPerson(
                work_order_id=work_order.id,
                full_name=person.get('full_name'),
                tc_kimlik_no=person.get('tc_kimlik'),
                passport_no=person.get('pasaport'),
                nationality=person.get('nationality', 'TUR'),
                phone=person.get('phone')
            )
            db.add(wo_person)
    
    db.commit()
    db.refresh(work_order)
    
    # Bildirim oluştur (internal user'lara)
    # TODO: Notification oluştur
    
    return WorkOrderResponse.from_orm(work_order)


@router.get("/work-orders", response_model=List[WorkOrderResponse])
def list_work_orders(
    status: Optional[str] = None,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    İş emirlerini listele
    
    - is_admin=True: Tüm cariye ait talepler
    - is_admin=False: Sadece kendi oluşturduğu talepler
    """
    query = db.query(WorkOrder)
    
    if current_user.is_admin:
        # Tüm cariye ait talepler
        query = query.filter(WorkOrder.cari_id == current_user.cari_id)
    else:
        # Sadece kendi talepleri
        query = query.filter(WorkOrder.portal_user_id == current_user.id)
    
    if status:
        query = query.filter(WorkOrder.status == status)
    
    work_orders = query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()
    
    return [WorkOrderResponse.from_orm(wo) for wo in work_orders]


@router.get("/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(
    work_order_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """İş emri detayı"""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    # Yetki kontrolü
    if not current_user.is_admin and work_order.portal_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu işleme yetkiniz yok")
    
    if work_order.cari_id != current_user.cari_id:
        raise HTTPException(status_code=403, detail="Bu işleme yetkiniz yok")
    
    return WorkOrderResponse.from_orm(work_order)


@router.get("/work-orders/{work_order_id}/document-status", response_model=WorkOrderDocumentStatus)
def get_work_order_document_status(
    work_order_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """İş emri belge durumu"""
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    # Yetki kontrolü
    if not current_user.is_admin and work_order.portal_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu işleme yetkiniz yok")
    
    # Belge sayıları
    total = db.query(ArchiveDocument).filter(
        ArchiveDocument.work_order_id == work_order_id,
        ArchiveDocument.is_latest_version == True
    ).count()
    
    approved = db.query(ArchiveDocument).filter(
        ArchiveDocument.work_order_id == work_order_id,
        ArchiveDocument.is_latest_version == True,
        ArchiveDocument.status == DocumentStatus.APPROVED
    ).count()
    
    pending = db.query(ArchiveDocument).filter(
        ArchiveDocument.work_order_id == work_order_id,
        ArchiveDocument.is_latest_version == True,
        ArchiveDocument.status == DocumentStatus.UPLOADED
    ).count()
    
    rejected = db.query(ArchiveDocument).filter(
        ArchiveDocument.work_order_id == work_order_id,
        ArchiveDocument.is_latest_version == True,
        ArchiveDocument.status == DocumentStatus.REJECTED
    ).count()
    
    # Zorunlu belge kontrolü
    required_approved = db.query(ArchiveDocument).filter(
        ArchiveDocument.work_order_id == work_order_id,
        ArchiveDocument.document_type == DocumentType.GUMRUK_IZIN_BELGESI,
        ArchiveDocument.status == DocumentStatus.APPROVED,
        ArchiveDocument.is_latest_version == True
    ).count() > 0
    
    completion = (approved / 1) * 100 if required_approved else 0  # Sadece GUMRUK_IZIN_BELGESI zorunlu
    
    return WorkOrderDocumentStatus(
        work_order_id=work_order.id,
        work_order_no=work_order.wo_number,
        required_documents_complete=required_approved,
        total_documents=total,
        approved_documents=approved,
        pending_documents=pending,
        rejected_documents=rejected,
        completion_percentage=completion
    )


# ============================================
# SGK DOCUMENT ENDPOINT
# ============================================

@router.post("/documents/sgk-hizmet-yukle")
async def upload_sgk_service_document(
    period: str = Form(...),
    file: UploadFile = File(...),
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db),
):
    """Upload SGK hizmet listesi PDF and sync employee statuses."""
    normalized_period = _normalize_period(period)

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response(
                code=ErrorCode.INVALID_INPUT,
                message="SGK hizmet dökümü PDF formatında olmalıdır.",
            ),
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response(
                code=ErrorCode.INVALID_INPUT,
                message="SGK hizmet dökümü boş olamaz.",
            ),
        )

    if len(file_bytes) > SGK_MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response(
                code=ErrorCode.ARCHIVE_FILE_TOO_LARGE,
                message="SGK hizmet dökümü en fazla 10 MB olabilir.",
            ),
        )

    # DÖNEM KONTROLÜ: PDF içindeki dönem ile seçilen dönem uyumlu olmalı
    pdf_period = _extract_period_from_pdf(file_bytes)
    if pdf_period and pdf_period != normalized_period:
        # PDF'de dönem bulundu ama eşleşmiyor
        # PDF'deki dönemi kullanıcı dostu formata çevir (YYYY-MM)
        pdf_period_display = f"{pdf_period[:4]}-{pdf_period[4:]}"
        user_period_display = f"{normalized_period[:4]}-{normalized_period[4:]}"
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response(
                code=ErrorCode.INVALID_INPUT,
                message=f"Yüklenen belge dönem uyumsuzluğu nedeniyle reddedildi. PDF'deki dönem: {pdf_period_display}, seçilen dönem: {user_period_display}",
                details={
                    "pdf_period": pdf_period_display,
                    "selected_period": user_period_display
                }
            ),
        )

    portal_user = (
        db.query(PortalUser)
        .options(joinedload(PortalUser.cari))
        .filter(PortalUser.id == current_user.id)
        .first()
    )
    if not portal_user or not portal_user.cari:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response(
                code=ErrorCode.CARI_NOT_FOUND,
                message="Kullanıcı için bağlı firma bulunamadı.",
            ),
        )

    base_dir = get_base_sgk_dir()
    firma_segment = _sanitize_storage_segment(portal_user.cari.CariKod or f"FIRMA_{portal_user.cari_id}")
    year_segment = normalized_period[:4]
    storage_dir = base_dir / year_segment / firma_segment / normalized_period
    storage_dir.mkdir(parents=True, exist_ok=True)

    timestamp_str = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
    filename = f"sgk_{firma_segment}_{normalized_period}_{timestamp_str}.pdf"
    file_path = storage_dir / filename

    with open(file_path, "wb") as output_file:
        output_file.write(file_bytes)

    storage_key = "/".join([year_segment, firma_segment, normalized_period, filename])
    file_size = len(file_bytes)
    checksum = hashlib.sha256(file_bytes).hexdigest()
    sgk_employees = _extract_sgk_employees(file_bytes)  # {tc_no: full_name}
    sgk_tc_set = set(sgk_employees.keys())

    if len(sgk_tc_set) < 3:
        failure_record = SgkPeriodCheck(
            firma_id=portal_user.cari_id,
            period=normalized_period,
            storage_key=storage_key,
            file_size=file_size,
            checksum=checksum,
            uploaded_by_user_id=current_user.id,
            status="FAILED_PARSE",
            matched_employee_count=0,
            missing_employee_count=0,
            extra_in_sgk_count=0,
        )
        db.add(failure_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response(
                code=ErrorCode.INVALID_INPUT,
                message="SGK hizmet dökümü okunamadı. Lütfen SGK sisteminden alınmış, okunabilir PDF yükleyin.",
            ),
        )

    employees = db.query(PortalEmployee).filter(PortalEmployee.cari_id == portal_user.cari_id).all()
    employee_tc_map = {}
    for employee in employees:
        tc_value = (employee.tc_kimlik or "").strip()
        if tc_value:
            employee_tc_map[tc_value] = employee

    matched_tcs = sgk_tc_set.intersection(employee_tc_map.keys())
    
    # YENİ PERSONELLER: SGK'da olup sistemde olmayan TC'ler (yeni işe girenler)
    new_employee_tcs = sgk_tc_set - set(employee_tc_map.keys())
    new_employees_added = 0

    # Not: SGK hizmet dökümünde genellikle sadece TC listesi bulunuyor.
    # İsim bilgisi çözülebilirse burada full_name alanını gerçek ad/soyad ile
    # dolduracak şekilde güncellenebilir. Şimdilik kullanıcıya portal
    # arayüzünden bu kayıtları güncelletiyoruz; isim alanını boş bırakıyoruz
    # ve sadece TC üzerinden yeni çalışan ekliyoruz.

    if new_employee_tcs:
        # Yeni personelleri otomatik olarak ekle
        for tc_no in new_employee_tcs:
            full_name = sgk_employees.get(tc_no, "").strip()
            new_employee = PortalEmployee(
                cari_id=portal_user.cari_id,
                full_name=full_name or "",  # SGK listesinden okunan ad soyad (varsa)
                tc_kimlik=tc_no,
                nationality="TUR",
                is_active=True,
                sgk_last_check_period=normalized_period,
                sgk_is_active_last_period=True,  # SGK'da olduğu için aktif
                created_at=datetime.utcnow()
            )
            db.add(new_employee)
            employee_tc_map[tc_no] = new_employee  # Map'e ekle
            new_employees_added += 1
        
        db.flush()  # Yeni personelleri flush et (id almak için)
        
        # Matched count'u güncelle
        matched_tcs = matched_tcs.union(new_employee_tcs)
    
    # Dönem kodunu tire ile formatla (YYYY-MM)
    period_code_with_dash = f"{normalized_period[:4]}-{normalized_period[4:]}"
    
    # TÜM matched personeller için SGK period kaydı oluştur/güncelle
    for tc_no in matched_tcs:
        employee = employee_tc_map.get(tc_no)
        if not employee:
            continue
            
        # Bu çalışan için bu dönem kaydı var mı kontrol et
        period_record = db.query(PortalEmployeeSgkPeriod).filter(
            PortalEmployeeSgkPeriod.employee_id == employee.id,
            PortalEmployeeSgkPeriod.period_code == period_code_with_dash
        ).first()
        
        if not period_record:
            # Yeni kayıt oluştur
            period_record = PortalEmployeeSgkPeriod(
                employee_id=employee.id,
                period_code=period_code_with_dash,
                is_active=True,
                source="HIZMET_LISTESI",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(period_record)
        else:
            # Mevcut kaydı güncelle
            period_record.is_active = True
            period_record.source = "HIZMET_LISTESI"
            period_record.updated_at = datetime.utcnow()
    
    # Mevcut personellerin eski alanlarını da güncelle (geriye dönük uyumluluk)
    for employee in employees:
        employee.sgk_last_check_period = normalized_period
        tc_value = (employee.tc_kimlik or "").strip()
        employee.sgk_is_active_last_period = tc_value in matched_tcs

    employee_count = len(employees) + new_employees_added
    matched_employee_count = len(matched_tcs)
    missing_employee_count = max(employee_count - matched_employee_count, 0)
    extra_in_sgk_count = max(len(sgk_tc_set - set(employee_tc_map.keys())) - new_employees_added, 0)  # Yeni eklenenleri çıkar

    success_record = SgkPeriodCheck(
        firma_id=portal_user.cari_id,
        period=normalized_period,
        storage_key=storage_key,
        file_size=file_size,
        checksum=checksum,
        uploaded_by_user_id=current_user.id,
        status="OK",
        matched_employee_count=matched_employee_count,
        missing_employee_count=missing_employee_count,
        extra_in_sgk_count=extra_in_sgk_count,
    )
    db.add(success_record)
    db.commit()

    return success_response(
        data={
            "period": normalized_period,
            "matched_employee_count": matched_employee_count,
            "missing_employee_count": missing_employee_count,
            "extra_in_sgk_count": extra_in_sgk_count,
            "new_employees_added": new_employees_added,  # Yeni eklenen personel sayısı
            "status": "OK",
        },
        message=f"SGK hizmet dökümü başarıyla işlendi{f' ({new_employees_added} yeni personel eklendi)' if new_employees_added > 0 else ''}",
    )


# ============================================
# DOCUMENT UPLOAD ENDPOINTS
# ============================================

@router.post("/documents/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    work_order_id: int = Form(...),
    category: DocumentCategory = Form(...),
    document_type: DocumentType = Form(...),
    description: Optional[str] = Form(None),
    issue_date: Optional[datetime] = Form(None),
    file: UploadFile = File(...),
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """
    Belge yükle
    
    - work_order_id: İş emri ID
    - category: Belge kategorisi
    - document_type: Belge tipi
    - file: PDF/JPEG/PNG dosyası
    """
    # WorkOrder kontrolü
    work_order = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    
    if not work_order:
        raise HTTPException(status_code=404, detail="İş emri bulunamadı")
    
    # Yetki kontrolü
    if not current_user.is_admin and work_order.portal_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu işleme yetkiniz yok")
    
    if work_order.cari_id != current_user.cari_id:
        raise HTTPException(status_code=403, detail="Bu işleme yetkiniz yok")
    
    # Dosya tipi kontrolü
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya tipi: {file.content_type}. Sadece PDF, JPEG, PNG yükleyebilirsiniz"
        )
    
    # Dosya boyutu kontrolü (10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'dan büyük olamaz")
    
    # Dosya kaydet
    upload_dir = Path("uploads/documents") / category.value / work_order.wo_number
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = f"{timestamp}_{file.filename}"
    file_path = upload_dir / file_name
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Hash hesapla
    file_hash = ArchiveDocument.calculate_file_hash(str(file_path))
    
    # Duplicate kontrolü
    existing = db.query(ArchiveDocument).filter(
        ArchiveDocument.file_hash == file_hash,
        ArchiveDocument.is_latest_version == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Bu dosya zaten yüklenmiş")
    
    # Süre hesapla (eğer süreli belge ise)
    expires_at = None
    if issue_date and document_type in [DocumentType.SRC5, DocumentType.ARAC_MUAYENE, DocumentType.ARAC_SIGORTA]:
        from ..dijital_arsiv.expiry import DocumentExpiryManager
        expiry_manager = DocumentExpiryManager()
        expires_at = expiry_manager.calculate_expiry_date(document_type, issue_date)
    
    # ArchiveDocument oluştur
    document = ArchiveDocument(
        category=category,
        document_type=document_type,
        work_order_id=work_order_id,
        cari_id=current_user.cari_id,
        file_name=file.filename,
        file_path=str(file_path),
        file_size=len(content),
        file_type=file.content_type,
        file_hash=file_hash,
        status=DocumentStatus.UPLOADED,
        uploaded_by_portal_user_id=current_user.id,
        description=description,
        issue_date=issue_date,
        expires_at=expires_at
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # İş emri durumunu güncelle (DRAFT → SUBMITTED)
    if work_order.status == WorkOrderStatus.DRAFT:
        work_order.status = WorkOrderStatus.SUBMITTED
        db.commit()
    
    # Bildirim oluştur (internal user'lara)
    # TODO: Notification oluştur
    
    return FileUploadResponse(
        file_name=document.file_name,
        file_path=document.file_path,
        file_size=document.file_size,
        file_size_mb=document.file_size_mb,
        file_type=document.file_type,
        file_hash=document.file_hash,
        document_id=document.id
    )


@router.get("/documents", response_model=ArchiveDocumentListResponse)
def list_documents(
    work_order_id: Optional[int] = None,
    status: Optional[DocumentStatus] = None,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Belgeler listele"""
    query = db.query(ArchiveDocument).filter(
        ArchiveDocument.is_latest_version == True
    )
    
    # Cari filtresi
    if current_user.is_admin:
        query = query.filter(ArchiveDocument.cari_id == current_user.cari_id)
    else:
        # Sadece kendi yüklediği belgeler
        query = query.filter(ArchiveDocument.uploaded_by_portal_user_id == current_user.id)
    
    if work_order_id:
        query = query.filter(ArchiveDocument.work_order_id == work_order_id)
    
    if status:
        query = query.filter(ArchiveDocument.status == status)
    
    total = query.count()
    documents = query.order_by(ArchiveDocument.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return ArchiveDocumentListResponse(
        total=total,
        items=[ArchiveDocumentResponse.from_orm(doc) for doc in documents]
    )


# ============================================
# NOTIFICATION ENDPOINTS
# ============================================

@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    unread_only: bool = False,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Bildirimler listele"""
    query = db.query(Notification).filter(
        Notification.portal_user_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    total = query.count()
    unread_count = db.query(Notification).filter(
        Notification.portal_user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return NotificationListResponse(
        total=total,
        unread_count=unread_count,
        items=[NotificationResponse.from_orm(n) for n in notifications]
    )


@router.post("/notifications/{notification_id}/mark-read")
def mark_notification_read(
    notification_id: int,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """Bildirimi okundu işaretle"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.portal_user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Bildirim okundu olarak işaretlendi"}


# ============================================
# HİZMET KARTLARI ENDPOINTS
# ============================================

@router.get("/hizmet-kartlari")
def list_hizmet_kartlari(
    search: Optional[str] = None,
    current_user: PortalUser = Depends(get_current_portal_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Hizmet kartları listesi
    
    - Tüm aktif hizmet kartlarını döner
    - search parametresi ile Kod veya Ad'a göre arama
    """
    query = db.query(Hizmet).filter(Hizmet.AktifMi == True)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Hizmet.Kod.ilike(search_pattern)) |
            (Hizmet.Ad.ilike(search_pattern))
        )
    
    total = query.count()
    hizmetler = query.order_by(Hizmet.Ad).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": h.Id,
                "kod": h.Kod,
                "ad": h.Ad,
                "aciklama": h.Aciklama,
                "birim": h.Birim,
                "fiyat": float(h.Fiyat) if h.Fiyat else None,
                "para_birimi": h.ParaBirimi,
                "grup_kod": h.GrupKod,
            }
            for h in hizmetler
        ]
    }

