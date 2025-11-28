"""
ARAÇ EVRAK YÖNETİMİ - Helper Functions
Araç belgelerinin durum hesaplama ve otomatik oluşturma fonksiyonları
"""

from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional
from .models import VehicleDocument, VehicleDocumentType, PortalVehicle


# Zorunlu evrak tipleri tek yerde tutulur ki eksikse otomatik eklensin
DEFAULT_VEHICLE_DOCUMENT_TYPES = [
    {"code": "RUHSAT", "name": "Araç Ruhsatı", "is_required": True, "validity_days": None},
    {"code": "MUAYENE", "name": "Araç Muayene Belgesi", "is_required": True, "validity_days": 365},
    {"code": "TRAFIK", "name": "Araç Trafik Sigortası", "is_required": True, "validity_days": 365},
    {"code": "KASKO", "name": "Araç Kasko Poliçesi", "is_required": False, "validity_days": 365},
]


def ensure_default_vehicle_document_types(db: Session) -> None:
    """VehicleDocumentType tablosunda zorunlu kayıtların bulunduğundan emin ol."""
    created = False

    for doc_type in DEFAULT_VEHICLE_DOCUMENT_TYPES:
        existing = db.query(VehicleDocumentType).filter(
            VehicleDocumentType.code == doc_type["code"]
        ).first()

        if not existing:
            db.add(VehicleDocumentType(
                code=doc_type["code"],
                name=doc_type["name"],
                is_required=doc_type["is_required"],
                validity_days=doc_type["validity_days"],
                created_at=datetime.utcnow()
            ))
            created = True

    if created:
        db.commit()


def create_default_vehicle_documents(db: Session, vehicle_id: int) -> None:
    """
    Yeni araç kaydı oluşturulduğunda zorunlu belgeler için MISSING kayıtları oluşturur
    
    Args:
        db: Database session
        vehicle_id: PortalVehicle ID
    """
    # Gerekli belge tipleri eksikse tamamla
    ensure_default_vehicle_document_types(db)

    # Tüm belge tiplerini al (zorunlu + opsiyonel)
    all_doc_types = db.query(VehicleDocumentType).all()
    
    # Her belge tipi için MISSING kaydı oluştur
    for doc_type in all_doc_types:
        # Bu araç için bu tip zaten var mı kontrol et
        existing = db.query(VehicleDocument).filter(
            VehicleDocument.vehicle_id == vehicle_id,
            VehicleDocument.doc_type_id == doc_type.id
        ).first()
        
        if not existing:
            new_doc = VehicleDocument(
                vehicle_id=vehicle_id,
                doc_type_id=doc_type.id,
                status="MISSING",
                created_at=datetime.utcnow()
            )
            db.add(new_doc)
    
    db.commit()


def compute_vehicle_status(db: Session, vehicle_id: int) -> str:
    """
    Aracın genel durumunu zorunlu evrakların durumuna göre hesaplar
    
    İş Kuralları:
    - Eğer ANY zorunlu evrak MISSING/EXPIRED/REJECTED → "EKSİK_EVRAK"
    - Eğer hiçbiri eksik değil ama ANY PENDING → "ONAY_BEKLIYOR"
    - Eğer hepsi APPROVED → "AKTİF"
    
    Args:
        db: Database session
        vehicle_id: PortalVehicle ID
        
    Returns:
        str: "EKSİK_EVRAK", "ONAY_BEKLIYOR", "AKTİF"
    """
    # Zorunlu belge tiplerini al
    required_doc_type_ids = db.query(VehicleDocumentType.id).filter(
        VehicleDocumentType.is_required == True
    ).all()
    required_doc_type_ids = [doc_type.id for doc_type in required_doc_type_ids]
    
    if not required_doc_type_ids:
        return "AKTİF"  # Zorunlu belge yoksa aktif kabul et
    
    # Bu araç için zorunlu belgeleri al
    vehicle_docs = db.query(VehicleDocument).filter(
        VehicleDocument.vehicle_id == vehicle_id,
        VehicleDocument.doc_type_id.in_(required_doc_type_ids)
    ).all()
    
    if not vehicle_docs:
        return "EKSİK_EVRAK"  # Hiç belge yoksa eksik
    
    # Süre dolmuş belgeleri kontrol et (APPROVED ama expiry_date geçmiş)
    today = date.today()
    statuses = []
    
    for doc in vehicle_docs:
        current_status = doc.status
        
        # Eğer APPROVED ama süre dolmuşsa EXPIRED olarak işaretle
        if current_status == "APPROVED" and doc.expiry_date and doc.expiry_date < today:
            current_status = "EXPIRED"
            # Gerçek durumu da güncelleyelim
            doc.status = "EXPIRED"
            db.commit()
        
        statuses.append(current_status)
    
    # Eksik/Reddedilmiş/Süresi dolmuş var mı?
    if any(s in ["MISSING", "EXPIRED", "REJECTED"] for s in statuses):
        return "EKSİK_EVRAK"
    
    # Onay bekleyen var mı?
    if any(s == "PENDING" for s in statuses):
        return "ONAY_BEKLIYOR"
    
    # Hepsi onaylı
    if all(s == "APPROVED" for s in statuses):
        return "AKTİF"
    
    # Varsayılan
    return "EKSİK_EVRAK"


def check_document_expiry(db: Session) -> None:
    """
    Tüm APPROVED belgeleri kontrol eder ve süresi dolmuşları EXPIRED yapar
    Bu fonksiyon scheduled job olarak çalıştırılabilir
    
    Args:
        db: Database session
    """
    today = date.today()
    
    # APPROVED ve expiry_date geçmiş belgeleri bul
    expired_docs = db.query(VehicleDocument).filter(
        VehicleDocument.status == "APPROVED",
        VehicleDocument.expiry_date.isnot(None),
        VehicleDocument.expiry_date < today
    ).all()
    
    for doc in expired_docs:
        doc.status = "EXPIRED"
        doc.updated_at = datetime.utcnow()
    
    if expired_docs:
        db.commit()
