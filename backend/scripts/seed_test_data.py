"""
TEST VERİSİ OLUŞTURMA - İŞ EMRİ VE DİJİTAL ARŞİV
Her durum için örnek iş emirleri, cari kartlar, hizmetler, tarifeler
WorkOrderPerson kayıtları, Dijital Arşiv belgeleri
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from datetime import datetime, timedelta, date
from decimal import Decimal
from sqlalchemy.orm import Session
import random

from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.hizmet.models import Hizmet
from aliaport_api.modules.isemri.models import (
    WorkOrder, WorkOrderItem, WorkOrderPerson, WorkOrderItemType,
    WorkOrderStatus, WorkOrderType, WorkOrderPriority
)
from aliaport_api.modules.dijital_arsiv.models import ArchiveDocument, DocumentStatus


def clear_test_data(db: Session):
    """Önceki test verilerini temizle"""
    print("🗑️  Eski test verileri temizleniyor...")
    
    # İş emri ilişkili veriler
    db.query(WorkOrderPerson).delete()
    db.query(WorkOrderItem).delete()
    db.query(WorkOrder).filter(WorkOrder.wo_number.like('WO2025%')).delete(synchronize_session=False)
    
    # Hizmetler (sadece test olanlar)
    db.query(Hizmet).filter(Hizmet.Kod.like('TEST_%')).delete(synchronize_session=False)
    
    # Cari kartlar (sadece test olanlar)
    db.query(Cari).filter(Cari.CariKod.like('TEST_%')).delete(synchronize_session=False)
    
    db.commit()
    print("✅ Temizlik tamamlandı\n")


def create_cari_test_data(db: Session) -> list:
    """Test cari kartları oluştur"""
    print("👥 Test Cari Kartları Oluşturuluyor...")
    
    cari_list = [
        {
            "CariKod": "TEST_MAERSK",
            "Unvan": "Maersk Denizcilik A.Ş.",
            "CariTip": "TUZEL",
            "Rol": "MUSTERI",
            "VergiNo": "1234567890",
            "VergiDairesi": "Konak",
            "Ulke": "TUR",
            "Il": "İzmir",
            "Ilce": "Konak",
            "Adres": "Alsancak Liman Bölgesi No:1",
            "Telefon": "+90 232 123 45 67",
            "Eposta": "info@maersk.com.tr",
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "CariKod": "TEST_MSC",
            "Unvan": "Mediterranean Shipping Company",
            "CariTip": "TUZEL",
            "Rol": "MUSTERI",
            "VergiNo": "9876543210",
            "VergiDairesi": "Karşıyaka",
            "Ulke": "TUR",
            "Il": "İzmir",
            "Ilce": "Karşıyaka",
            "Adres": "Mavişehir Liman Sok. No:45",
            "Telefon": "+90 232 987 65 43",
            "Eposta": "turkey@msc.com",
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "CariKod": "TEST_COSCO",
            "Unvan": "COSCO Shipping Lines",
            "CariTip": "TUZEL",
            "Rol": "MUSTERI",
            "VergiNo": "5555666677",
            "VergiDairesi": "Bornova",
            "Ulke": "TUR",
            "Il": "İzmir",
            "Ilce": "Bornova",
            "Adres": "Ege Liman İş Merkezi Kat:3",
            "Telefon": "+90 232 555 66 77",
            "Eposta": "izmir@cosco.com.tr",
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "CariKod": "TEST_EVERGREEN",
            "Unvan": "Evergreen Marine Corporation",
            "CariTip": "TUZEL",
            "Rol": "MUSTERI",
            "Ulke": "TUR",
            "Il": "İzmir",
            "Ilce": "Buca",
            "VergiNo": "1122334455",
            "VergiDairesi": "Buca",
            "Adres": "Liman Caddesi No:78",
            "Telefon": "+90 232 111 22 33",
            "Eposta": "turkey@evergreen-marine.com",
            "AktifMi": True,
            "CreatedBy": 1,
        },
    ]
    
    created_cari = []
    for cari_data in cari_list:
        cari = Cari(**cari_data)
        db.add(cari)
        created_cari.append(cari)
    
    db.commit()
    for c in created_cari:
        db.refresh(c)
    
    print(f"✅ {len(created_cari)} Cari Kart Oluşturuldu\n")
    return created_cari


def create_hizmet_test_data(db: Session) -> list:
    """Test hizmet kartları oluştur"""
    print("🔧 Test Hizmet Kartları Oluşturuluyor...")
    
    hizmet_list = [
        {
            "Kod": "TEST_BARINMA_001",
            "Ad": "Gemi Barınma Ücreti (24 Saat)",
            "GrupKod": "BARINMA",
            "CalculationType": "FIXED",
            "Fiyat": Decimal("5000.00"),
            "ParaBirimi": "TRY",
            "Birim": "GÜN",
            "KdvOrani": Decimal("20.00"),
            "RequiresPersonCount": False,
            "RequiresVehicleInfo": False,
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "Kod": "TEST_BARINMA_002",
            "Ad": "Rıhtım Barınma - GT Bazlı",
            "GrupKod": "BARINMA",
            "CalculationType": "PER_UNIT",
            "Fiyat": Decimal("2.50"),
            "ParaBirimi": "USD",
            "Birim": "GT/GÜN",
            "KdvOrani": Decimal("20.00"),
            "RequiresPersonCount": False,
            "RequiresVehicleInfo": False,
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "Kod": "TEST_ROMARKOY_001",
            "Ad": "Römorkaj Hizmeti - Liman İçi",
            "GrupKod": "ROMARKOY",
            "CalculationType": "PER_UNIT",
            "Fiyat": Decimal("5.00"),
            "ParaBirimi": "USD",
            "Birim": "GT",
            "KdvOrani": Decimal("20.00"),
            "RequiresPersonCount": False,
            "RequiresVehicleInfo": False,
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "Kod": "TEST_PILOTAJ_001",
            "Ad": "Pilotaj Hizmeti - Giriş",
            "GrupKod": "PILOTAJ",
            "CalculationType": "PER_UNIT",
            "Fiyat": Decimal("3.50"),
            "ParaBirimi": "USD",
            "Birim": "GT",
            "KdvOrani": Decimal("20.00"),
            "RequiresPersonCount": False,
            "RequiresVehicleInfo": False,
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "Kod": "TEST_GECIS_001",
            "Ad": "Liman Geçiş İzni",
            "GrupKod": "GECIS_HAREKET",
            "CalculationType": "PER_UNIT",
            "Fiyat": Decimal("150.00"),
            "ParaBirimi": "TRY",
            "Birim": "KİŞİ",
            "KdvOrani": Decimal("20.00"),
            "RequiresPersonCount": True,
            "RequiresVehicleInfo": False,
            "AktifMi": True,
            "CreatedBy": 1,
        },
        {
            "Kod": "TEST_GECIS_002",
            "Ad": "Araç Geçiş İzni",
            "GrupKod": "GECIS_HAREKET",
            "CalculationType": "VEHICLE_4H_RULE",
            "Fiyat": Decimal("300.00"),
            "ParaBirimi": "TRY",
            "Birim": "ADET",
            "KdvOrani": Decimal("20.00"),
            "RequiresPersonCount": False,
            "RequiresVehicleInfo": True,
            "AktifMi": True,
            "CreatedBy": 1,
        },
    ]
    
    created_hizmet = []
    for hizmet_data in hizmet_list:
        hizmet = Hizmet(**hizmet_data)
        db.add(hizmet)
        created_hizmet.append(hizmet)
    
    db.commit()
    for h in created_hizmet:
        db.refresh(h)
    
    print(f"✅ {len(created_hizmet)} Hizmet Kartı Oluşturuldu\n")
    return created_hizmet


def create_tarife_test_data(db: Session, cari_list: list, hizmet_list: list) -> list:
    """Test tarifeler - şimdilik atlandı (basitleştirme için)"""
    print("💰 Tarife test verileri atlandı (basitleştirme)\n")
    return []


def create_work_order_test_data(db: Session, cari_list: list, hizmet_list: list) -> list:
    """Her durum için test iş emirleri oluştur"""
    print("📋 Test İş Emirleri Oluşturuluyor...")
    
    today = date.today()
    created_wo = []
    
    # Her durum için örnek iş emri
    wo_scenarios = [
        {
            "status": WorkOrderStatus.DRAFT,
            "subject": "Gemi Barınma Hizmeti - Taslak",
            "description": "Maersk gemisi için barınma hizmeti - henüz onaya gönderilmedi",
            "cari": cari_list[0],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today + timedelta(days=5), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=7), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.SUBMITTED,
            "subject": "Römorkaj ve Pilotaj Hizmeti",
            "description": "MSC gemisi için römorkaj ve pilotaj - onay bekliyor",
            "cari": cari_list[1],
            "priority": WorkOrderPriority.HIGH,
            "planned_start": datetime.combine(today + timedelta(days=2), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=3), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.PENDING_APPROVAL,
            "subject": "Liman Geçiş İzinleri - Belge Onayı Bekliyor",
            "description": "COSCO personeli için geçiş izinleri - belgeler yüklendi, onay bekleniyor",
            "cari": cari_list[2],
            "priority": WorkOrderPriority.URGENT,
            "planned_start": datetime.combine(today + timedelta(days=1), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=1), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.APPROVED,
            "subject": "Gemi Barınma ve Rıhtım Hizmeti",
            "description": "Evergreen gemisi için barınma - onaylandı, başlatılmayı bekliyor",
            "cari": cari_list[3],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today, datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=2), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.SAHADA,
            "subject": "Römorkaj Hizmeti Devam Ediyor",
            "description": "Maersk gemisi için römorkaj hizmeti sahada devam ediyor",
            "cari": cari_list[0],
            "priority": WorkOrderPriority.HIGH,
            "planned_start": datetime.combine(today - timedelta(days=1), datetime.min.time()),
            "planned_end": datetime.combine(today, datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=1), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.IN_PROGRESS,
            "subject": "Pilotaj ve Geçiş İzni İşlemde",
            "description": "MSC personeli için pilotaj ve geçiş izni işlemleri devam ediyor",
            "cari": cari_list[1],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today - timedelta(days=2), datetime.min.time()),
            "planned_end": datetime.combine(today + timedelta(days=1), datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=2), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.TAMAMLANDI,
            "subject": "Barınma Hizmeti Tamamlandı",
            "description": "COSCO gemisi için barınma hizmeti tamamlandı, faturaya hazır",
            "cari": cari_list[2],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today - timedelta(days=5), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=2), datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=5), datetime.min.time()),
            "actual_end": datetime.combine(today - timedelta(days=2), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.COMPLETED,
            "subject": "Geçiş İzni Hizmeti Tamamlandı",
            "description": "Evergreen personeli geçiş izni hizmeti tamamlandı",
            "cari": cari_list[3],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today - timedelta(days=7), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=6), datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=7), datetime.min.time()),
            "actual_end": datetime.combine(today - timedelta(days=6), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.FATURALANDI,
            "subject": "Römorkaj Faturalandı",
            "description": "Maersk römorkaj hizmeti faturalandı",
            "cari": cari_list[0],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today - timedelta(days=10), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=9), datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=10), datetime.min.time()),
            "actual_end": datetime.combine(today - timedelta(days=9), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.INVOICED,
            "subject": "Pilotaj Hizmeti Faturalandı",
            "description": "MSC pilotaj hizmeti faturalandı",
            "cari": cari_list[1],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today - timedelta(days=12), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=11), datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=12), datetime.min.time()),
            "actual_end": datetime.combine(today - timedelta(days=11), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.KAPANDI,
            "subject": "Barınma Hizmeti Kapatıldı",
            "description": "COSCO barınma hizmeti tamamlandı ve kapatıldı",
            "cari": cari_list[2],
            "priority": WorkOrderPriority.LOW,
            "planned_start": datetime.combine(today - timedelta(days=20), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=18), datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=20), datetime.min.time()),
            "actual_end": datetime.combine(today - timedelta(days=18), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.CLOSED,
            "subject": "Geçiş İzni Kapatıldı",
            "description": "Evergreen geçiş izni hizmeti kapatıldı",
            "cari": cari_list[3],
            "priority": WorkOrderPriority.LOW,
            "planned_start": datetime.combine(today - timedelta(days=15), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=14), datetime.min.time()),
            "actual_start": datetime.combine(today - timedelta(days=15), datetime.min.time()),
            "actual_end": datetime.combine(today - timedelta(days=14), datetime.min.time()),
        },
        {
            "status": WorkOrderStatus.REJECTED,
            "subject": "Römorkaj Talebi Reddedildi",
            "description": "Maersk römorkaj talebi - belgeler eksik olduğu için reddedildi",
            "cari": cari_list[0],
            "priority": WorkOrderPriority.MEDIUM,
            "planned_start": datetime.combine(today - timedelta(days=3), datetime.min.time()),
            "planned_end": datetime.combine(today - timedelta(days=2), datetime.min.time()),
            "rejection_reason": "Gerekli belgeler eksik: Gemi ruhsatı, sigorta belgesi",
        },
    ]
    
    for idx, scenario in enumerate(wo_scenarios, start=1):
        wo = WorkOrder(
            wo_number=f"WO202511{idx:04d}",
            cari_id=scenario["cari"].Id,
            cari_code=scenario["cari"].CariKod,
            cari_title=scenario["cari"].Unvan,
            subject=scenario["subject"],
            description=scenario["description"],
            type=WorkOrderType.HIZMET,
            priority=scenario["priority"],
            status=scenario["status"],
            planned_start=scenario["planned_start"],
            planned_end=scenario["planned_end"],
            actual_start=scenario.get("actual_start"),
            actual_end=scenario.get("actual_end"),
            rejection_reason=scenario.get("rejection_reason"),
            gate_required=True if "Geçiş" in scenario["subject"] else False,
            saha_kayit_yetkisi=True if scenario["status"] in [WorkOrderStatus.SAHADA, WorkOrderStatus.IN_PROGRESS] else False,
            is_active=True,
            created_by=1,
        )
        db.add(wo)
        db.flush()
        
        # İş emri kalemleri ekle (ilk 3 hizmet)
        for hizmet in hizmet_list[:3]:
            quantity = Decimal(str(random.randint(1, 5)))
            unit_price = hizmet.Fiyat
            total_amount = quantity * unit_price
            vat_amount = total_amount * (hizmet.KdvOrani / 100)
            grand_total = total_amount + vat_amount
            
            item = WorkOrderItem(
                work_order_id=wo.id,
                wo_number=wo.wo_number,
                item_type=WorkOrderItemType.SERVICE,
                service_code=hizmet.Kod,
                service_name=hizmet.Ad,
                quantity=quantity,
                unit=hizmet.Birim,
                unit_price=unit_price,
                currency=hizmet.ParaBirimi,
                total_amount=total_amount,
                vat_rate=hizmet.KdvOrani,
                vat_amount=vat_amount,
                grand_total=grand_total,
                is_invoiced=scenario["status"] in [WorkOrderStatus.FATURALANDI, WorkOrderStatus.INVOICED, WorkOrderStatus.KAPANDI, WorkOrderStatus.CLOSED],
                created_by=1,
            )
            db.add(item)
        
        created_wo.append(wo)
    
    db.commit()
    for wo in created_wo:
        db.refresh(wo)
    
    print(f"✅ {len(created_wo)} İş Emri Oluşturuldu (Her Durum için)\n")
    return created_wo


def create_work_order_person_test_data(db: Session, work_orders: list) -> list:
    """WorkOrderPerson test verileri"""
    print("👤 WorkOrderPerson Test Verileri Oluşturuluyor...")
    
    created_persons = []
    
    # Test kişileri - farklı uyruklar ve kimlik tipleri
    test_persons_data = [
        # Türk vatandaşları (TC Kimlik No)
        {"full_name": "Ahmet Yılmaz", "tc_kimlik_no": "12345678901", "nationality": "TUR", "phone": "+90 532 123 4567"},
        {"full_name": "Mehmet Demir", "tc_kimlik_no": "23456789012", "nationality": "TUR", "phone": "+90 533 234 5678"},
        {"full_name": "Ayşe Kaya", "tc_kimlik_no": "34567890123", "nationality": "TUR", "phone": "+90 534 345 6789"},
        
        # Yabancı uyruklu (Pasaport No)
        {"full_name": "John Smith", "passport_no": "US123456789", "nationality": "USA", "phone": "+1 555 123 4567"},
        {"full_name": "Maria Garcia", "passport_no": "ES987654321", "nationality": "ESP", "phone": "+34 600 123 456"},
        {"full_name": "Wang Wei", "passport_no": "CN456789123", "nationality": "CHN", "phone": "+86 138 1234 5678"},
        {"full_name": "Hans Mueller", "passport_no": "DE789123456", "nationality": "DEU", "phone": "+49 170 123 4567"},
    ]
    
    # Her iş emrine 2-4 kişi ekle
    for wo in work_orders[:10]:  # İlk 10 iş emrine kişi ekle
        num_persons = random.randint(2, 4)
        selected_persons = random.sample(test_persons_data, num_persons)
        
        for person_data in selected_persons:
            person = WorkOrderPerson(
                work_order_id=wo.id,
                full_name=person_data["full_name"],
                tc_kimlik_no=person_data.get("tc_kimlik_no"),
                passport_no=person_data.get("passport_no"),
                nationality=person_data["nationality"],
                phone=person_data.get("phone"),
                security_notes=f"Test kişi - {person_data['full_name']}" if random.random() > 0.7 else None,
                created_at=datetime.utcnow()
            )
            
            db.add(person)
            created_persons.append(person)
    
    db.commit()
    print(f"✅ {len(created_persons)} WorkOrderPerson Kaydı Oluşturuldu\n")
    return created_persons


def create_archive_document_test_data(db: Session, work_orders: list) -> list:
    """Dijital Arşiv test belgeleri"""
    print("📄 Dijital Arşiv Test Belgeleri Oluşturuluyor...")
    
    created_documents = []
    
    # Test belge tipleri ve kategorileri
    document_types = [
        {"category": "WORK_ORDER", "doc_type": "GUMRUK_IZIN_BELGESI", "file_name": "gumruk_izin_belgesi.pdf"},
        {"category": "WORK_ORDER", "doc_type": "SRC5", "file_name": "src5_belgesi.pdf"},
        {"category": "WORK_ORDER", "doc_type": "MANIFESTO", "file_name": "manifesto.pdf"},
        {"category": "WORK_ORDER", "doc_type": "KONISIMENTO", "file_name": "konisimento.pdf"},
        {"category": "WORK_ORDER", "doc_type": "FATURA", "file_name": "fatura.pdf"},
    ]
    
    # Test dosya içeriği (minimal PDF)
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Document) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000262 00000 n\n0000000341 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n433\n%%EOF"
    
    # Upload klasörünü oluştur
    upload_base = Path(backend_dir) / "uploads" / "test"
    upload_base.mkdir(parents=True, exist_ok=True)
    
    # Her iş emrine 2-3 belge ekle
    for wo in work_orders[:8]:  # İlk 8 iş emrine belge ekle
        num_docs = random.randint(2, 3)
        selected_docs = random.sample(document_types, num_docs)
        
        for doc_data in selected_docs:
            # Benzersiz dosya adı
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = random.randint(1000, 9999)
            file_name = f"{timestamp}_{unique_id}_{doc_data['file_name']}"
            file_path = upload_base / file_name
            
            # Test PDF dosyası oluştur
            with open(file_path, "wb") as f:
                f.write(pdf_content)
            
            # Belge kaydı oluştur
            doc = ArchiveDocument(
                category=doc_data["category"],
                document_type=doc_data["doc_type"],
                work_order_id=wo.id,
                file_name=doc_data["file_name"],
                file_path=str(file_path),
                file_size=len(pdf_content),
                file_type="application/pdf",
                file_hash=f"hash_{unique_id}",
                version=1,
                is_latest_version=True,
                status=DocumentStatus.APPROVED if random.random() > 0.3 else DocumentStatus.UPLOADED,
                description=f"Test belgesi - {doc_data['doc_type']}",
                issue_date=date.today() - timedelta(days=random.randint(1, 30)),
                expires_at=date.today() + timedelta(days=random.randint(30, 365)),
                uploaded_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            
            db.add(doc)
            created_documents.append(doc)
    
    db.commit()
    print(f"✅ {len(created_documents)} Dijital Arşiv Belgesi Oluşturuldu\n")
    return created_documents


def main():
    """Ana fonksiyon"""
    print("=" * 60)
    print("🚀 ALIAPORT TEST VERİSİ OLUŞTURMA")
    print("=" * 60 + "\n")
    
    db = SessionLocal()
    
    try:
        # 1. Temizlik
        clear_test_data(db)
        
        # 2. Cari kartlar
        cari_list = create_cari_test_data(db)
        
        # 3. Hizmet kartları
        hizmet_list = create_hizmet_test_data(db)
        
        # 4. İş emirleri (her durum için)
        work_orders = create_work_order_test_data(db, cari_list, hizmet_list)
        
        # 5. WorkOrderPerson
        persons = create_work_order_person_test_data(db, work_orders)
        
        # 6. Dijital Arşiv belgeleri
        documents = create_archive_document_test_data(db, work_orders)
        
        print("\n" + "=" * 60)
        print("✅ TEST VERİSİ OLUŞTURMA TAMAMLANDI!")
        print("=" * 60)
        print(f"\n📊 ÖZET:")
        print(f"   - {len(cari_list)} Cari Kart")
        print(f"   - {len(hizmet_list)} Hizmet Kartı")
        print(f"   - {len(work_orders)} İş Emri (Her Durum)")
        print(f"   - {len(persons)} WorkOrderPerson Kaydı")
        print(f"   - {len(documents)} Dijital Arşiv Belgesi")
        print("\n✅ İş Emri modülünden tüm durumları test edebilirsiniz!")
        print("✅ Her durum için örnek iş emirleri oluşturuldu!")
        print("✅ WorkOrderPerson kayıtları oluşturuldu (TC/Pasaport)!")
        print("✅ Dijital Arşiv belgeleri yüklendi (PDF)!")
        print("✅ Dashboard kartlarını kontrol edin - Onay Bekleyen, Eksik Belgeler, Aktif, Bugün Biten")
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
