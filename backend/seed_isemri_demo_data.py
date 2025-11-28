"""
Seed Demo Data for İş Emri, Dijital Arşiv, GateLog, WorkLog
Aliaport v3.1 - Test verileri

Kullanım:
    python seed_isemri_demo_data.py
"""
import sys
import os
from pathlib import Path
from datetime import datetime, date, timedelta
from decimal import Decimal

# Backend klasörünü PYTHONPATH'e ekle
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))
os.chdir(backend_path)

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.isemri.models import (
    WorkOrder, WorkOrderItem, WorkOrderPerson,
    WorkOrderType, WorkOrderStatus, WorkOrderPriority, WorkOrderItemType
)
from aliaport_api.modules.dijital_arsiv.models import (
    ArchiveDocument, DocumentCategory, DocumentType, DocumentStatus
)
from aliaport_api.modules.saha.models import WorkLog
from aliaport_api.modules.guvenlik.models import GateLog
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.hizmet.models import Hizmet

# User modeli opsiyonel - seed data için gerekli değil
# Sadece ID'ler kullanılacak


def seed_work_orders(db: Session):
    """İş emri demo verileri"""
    print("🔄 İş Emri verileri oluşturuluyor...")
    
    # Cari ve Hizmet'leri al
    cari_list = db.query(Cari).limit(5).all()
    hizmet_list = db.query(Hizmet).limit(3).all()
    
    if not cari_list:
        print("⚠️  Cari kaydı yok! Önce Cari seed çalıştırın.")
        return
    
    if not hizmet_list:
        print("⚠️  Hizmet kaydı yok! Önce Hizmet seed çalıştırın.")
        return
    
    # Varolan kayıtları kontrol et
    existing_count = db.query(WorkOrder).count()
    if existing_count > 10:
        print(f"⚠️  Zaten {existing_count} iş emri var. Seed atlanıyor.")
        return
    
    work_orders = []
    now = datetime.now()
    
    # 1. DRAFT - Taslak (Portal kullanıcı henüz göndermedi)
    wo1 = WorkOrder(
        wo_number=f"WO-{now.year}-{len(work_orders)+1:05d}",
        cari_id=cari_list[0].Id,
        cari_code=cari_list[0].CariKod,
        cari_title=cari_list[0].Unvan,
        type=WorkOrderType.HIZMET,
        service_code=hizmet_list[0].Kod if hizmet_list else None,
        subject="M/V NEPTUNE - Römorkaj Hizmeti",
        description="105 metre konteyner gemisi, 15.000 ton, rıhtım 3'e yanaştırılacak. Römorkör desteği gerekli.",
        priority=WorkOrderPriority.MEDIUM,
        status=WorkOrderStatus.DRAFT,
        planned_start=now + timedelta(days=2, hours=8),
        planned_end=now + timedelta(days=2, hours=12),
        is_cabatoge_tr_flag=True,  # Türk bayraklı %10 indirim
    )
    work_orders.append(wo1)
    
    # 2. PENDING_APPROVAL - Onay bekliyor (Belge yüklendi)
    wo2 = WorkOrder(
        WONumber=f"WO-{now.year}-{len(work_orders)+1:05d}",
        CariId=cari_list[1].Id,
        CariCode=cari_list[1].CariKod,
        CariTitle=cari_list[1].Unvan,
        Type=WorkOrderType.HIZMET,
        ServiceId=hizmet_list[1].Id if len(hizmet_list) > 1 else None,
        ServiceCode=hizmet_list[1].Kod if len(hizmet_list) > 1 else None,
        Subject="M/V MAERSK LINER - Konteyner Elleçleme",
        Description="40' konteyner 25 adet boşaltma, 30 adet yükleme işlemi",
        Priority=WorkOrderPriority.HIGH,
        Status=WorkOrderStatus.PENDING_APPROVAL,
        PlannedStartDate=now + timedelta(days=1, hours=14),
        PlannedEndDate=now + timedelta(days=1, hours=20),
        TotalAmount=Decimal("12500.00"),
        Currency="TRY"
    )
    work_orders.append(wo2)
    
    # 3. APPROVED - Onaylandı (İşleme hazır)
    wo3 = WorkOrder(
        WONumber=f"WO-{now.year}-{len(work_orders)+1:05d}",
        CariId=cari_list[2].Id,
        CariCode=cari_list[2].CariKod,
        CariTitle=cari_list[2].Unvan,
        Type=WorkOrderType.HIZMET,
        Subject="CMA CGM VESSEL - Gemi Yakıt İkmali",
        Description="Bunker hizmeti - 50 ton yakıt ikmali",
        Priority=WorkOrderPriority.URGENT,
        Status=WorkOrderStatus.APPROVED,
        PlannedStartDate=now + timedelta(hours=4),
        PlannedEndDate=now + timedelta(hours=8),
        TotalAmount=Decimal("42500.00"),
        Currency="USD"
    )
    work_orders.append(wo3)
    
    # 4. SAHADA - Devam ediyor
    wo4 = WorkOrder(
        WONumber=f"WO-{now.year}-{len(work_orders)+1:05d}",
        CariId=cari_list[0].Id,
        CariCode=cari_list[0].CariKod,
        CariTitle=cari_list[0].Unvan,
        Type=WorkOrderType.HIZMET,
        Subject="MSC MERAVIGLIA - Kılavuzluk Hizmeti",
        Description="Gemi giriş kılavuzluğu - pilot alma",
        Priority=WorkOrderPriority.HIGH,
        Status=WorkOrderStatus.SAHADA,
        PlannedStartDate=now - timedelta(hours=2),
        PlannedEndDate=now + timedelta(hours=2),
        ActualStartDate=now - timedelta(hours=2),
        TotalAmount=Decimal("4500.00"),
        Currency="TRY"
    )
    work_orders.append(wo4)
    
    # 5. TAMAMLANDI - Bugün biten
    wo5 = WorkOrder(
        WONumber=f"WO-{now.year}-{len(work_orders)+1:05d}",
        CariId=cari_list[1].Id,
        CariCode=cari_list[1].CariKod,
        CariTitle=cari_list[1].Unvan,
        Type=WorkOrderType.HIZMET,
        Subject="HAPAG LLOYD - Temiz Su Tedariki",
        Description="500 ton temiz su ikmali tamamlandı",
        Priority=WorkOrderPriority.MEDIUM,
        Status=WorkOrderStatus.TAMAMLANDI,
        PlannedStartDate=now - timedelta(hours=6),
        PlannedEndDate=now - timedelta(hours=2),
        ActualStartDate=now - timedelta(hours=6),
        ActualEndDate=now - timedelta(hours=2),
        CompletedDate=now - timedelta(hours=2),
        TotalAmount=Decimal("17500.00"),
        Currency="TRY"
    )
    work_orders.append(wo5)
    
    # 6. REJECTED - Reddedilmiş (Eksik belge)
    wo6 = WorkOrder(
        WONumber=f"WO-{now.year}-{len(work_orders)+1:05d}",
        CariId=cari_list[2].Id,
        CariCode=cari_list[2].CariKod,
        CariTitle=cari_list[2].Unvan,
        Type=WorkOrderType.HIZMET,
        Subject="EVERGREEN - Vinç Hizmeti",
        Description="Ağır yük vinç talebi",
        Priority=WorkOrderPriority.HIGH,
        Status=WorkOrderStatus.REJECTED,
        RejectionReason="Eksik doküman: Gemi manifestosu ve vinç ruhsatı gerekli. Lütfen belgeleri yükleyip tekrar gönderin.",
        PlannedStartDate=now + timedelta(days=3),
        PlannedEndDate=now + timedelta(days=3, hours=4),
        TotalAmount=Decimal("0"),
        Currency="TRY"
    )
    work_orders.append(wo6)
    
    # 7-10: Çeşitli durumlar
    for i in range(4):
        cari = cari_list[i % len(cari_list)]
        statuses = [WorkOrderStatus.SAHADA, WorkOrderStatus.APPROVED, WorkOrderStatus.TAMAMLANDI, WorkOrderStatus.PENDING_APPROVAL]
        
        wo = WorkOrder(
            WONumber=f"WO-{now.year}-{len(work_orders)+1:05d}",
            CariId=cari.Id,
            CariCode=cari.CariKod,
            CariTitle=cari.Unvan,
            Type=WorkOrderType.HIZMET,
            Subject=f"Genel Hizmet #{len(work_orders)+1}",
            Description=f"Test iş emri {len(work_orders)+1}",
            Priority=WorkOrderPriority.MEDIUM,
            Status=statuses[i],
            PlannedStartDate=now + timedelta(days=i+1),
            PlannedEndDate=now + timedelta(days=i+1, hours=4),
            TotalAmount=Decimal(f"{1000 * (i+1)}.00"),
            Currency="TRY"
        )
        work_orders.append(wo)
    
    # Veritabanına ekle
    for wo in work_orders:
        db.add(wo)
    
    db.commit()
    print(f"✅ {len(work_orders)} iş emri oluşturuldu")
    
    return work_orders


def seed_work_order_persons(db: Session, work_orders):
    """WorkOrderPerson demo verileri"""
    print("🔄 WorkOrderPerson verileri oluşturuluyor...")
    
    if not work_orders:
        print("⚠️  İş emri yok! Önce İş Emri seed çalıştırın.")
        return
    
    persons = []
    
    # İş emri 2 (PENDING_APPROVAL) için 3 kişi
    wo = work_orders[1]
    persons.extend([
        WorkOrderPerson(
            WorkOrderId=wo.Id,
            FullName="Ahmet Yılmaz",
            TcKimlikNo="12345678901",
            Nationality="TR",
            Phone="+90 532 123 4567",
            SecurityApproved=False
        ),
        WorkOrderPerson(
            WorkOrderId=wo.Id,
            FullName="John Smith",
            PassportNo="US1234567",
            Nationality="US",
            Phone="+1 555 123 4567",
            SecurityApproved=False
        ),
        WorkOrderPerson(
            WorkOrderId=wo.Id,
            FullName="Maria Garcia",
            PassportNo="ES7654321",
            Nationality="ES",
            Phone="+34 555 789 0123",
            SecurityApproved=False
        ),
    ])
    
    # İş emri 4 (SAHADA) için 2 kişi (onaylanmış, giriş yapmış)
    wo = work_orders[3]
    now = datetime.now()
    persons.extend([
        WorkOrderPerson(
            WorkOrderId=wo.Id,
            FullName="Mehmet Demir",
            TcKimlikNo="98765432109",
            Nationality="TR",
            Phone="+90 533 987 6543",
            SecurityApproved=True,
            ApprovedBySecurityUserId=1,  # Admin user
            GateEntryTime=now - timedelta(hours=2),
            SecurityNotes="Kimlik kontrolü yapıldı, giriş onaylandı"
        ),
        WorkOrderPerson(
            WorkOrderId=wo.Id,
            FullName="Hans Mueller",
            PassportNo="DE9876543",
            Nationality="DE",
            Phone="+49 170 123 4567",
            SecurityApproved=True,
            ApprovedBySecurityUserId=1,
            GateEntryTime=now - timedelta(hours=2),
            SecurityNotes="Passport kontrolü yapıldı"
        ),
    ])
    
    for person in persons:
        db.add(person)
    
    db.commit()
    print(f"✅ {len(persons)} WorkOrderPerson kaydı oluşturuldu")


def seed_archive_documents(db: Session, work_orders):
    """ArchiveDocument demo verileri"""
    print("🔄 Dijital Arşiv belgeleri oluşturuluyor...")
    
    if not work_orders:
        print("⚠️  İş emri yok!")
        return
    
    documents = []
    now = datetime.now()
    
    # İş emri 2 için GÜMRÜK belgesi (UPLOADED - onay bekliyor)
    wo = work_orders[1]
    documents.append(ArchiveDocument(
        Category=DocumentCategory.WORK_ORDER,
        Type=DocumentType.GUMRUK_IZIN_BELGESI,
        FileName="gumruk_izin_wo002.pdf",
        FileSize=245678,
        FilePath="/minio/work-orders/wo002/gumruk_izin.pdf",
        MimeType="application/pdf",
        Status=DocumentStatus.UPLOADED,
        RelatedEntityType="WorkOrder",
        RelatedEntityId=wo.Id,
        UploadedByUserId=1,
        Version=1,
        IsLatestVersion=True,
        UploadedAt=now - timedelta(hours=1)
    ))
    
    # İş emri 3 için MANIFESTO (APPROVED)
    wo = work_orders[2]
    documents.append(ArchiveDocument(
        Category=DocumentCategory.WORK_ORDER,
        Type=DocumentType.MANIFESTO,
        FileName="manifesto_wo003.pdf",
        FileSize=128456,
        FilePath="/minio/work-orders/wo003/manifesto.pdf",
        MimeType="application/pdf",
        Status=DocumentStatus.APPROVED,
        RelatedEntityType="WorkOrder",
        RelatedEntityId=wo.Id,
        UploadedByUserId=1,
        ReviewedByUserId=1,
        ReviewedAt=now - timedelta(hours=12),
        Version=1,
        IsLatestVersion=True,
        UploadedAt=now - timedelta(hours=24)
    ))
    
    # İş emri 6 (REJECTED) için eski belge (REJECTED)
    wo = work_orders[5]
    documents.append(ArchiveDocument(
        Category=DocumentCategory.WORK_ORDER,
        Type=DocumentType.GUMRUK_IZIN_BELGESI,
        FileName="gumruk_wo006_old.pdf",
        FileSize=98765,
        FilePath="/minio/work-orders/wo006/gumruk_old.pdf",
        MimeType="application/pdf",
        Status=DocumentStatus.REJECTED,
        RelatedEntityType="WorkOrder",
        RelatedEntityId=wo.Id,
        UploadedByUserId=1,
        ReviewedByUserId=1,
        ReviewedAt=now - timedelta(hours=3),
        ReviewNotes="Tarih bilgisi hatalı, lütfen güncel belge yükleyin",
        Version=1,
        IsLatestVersion=True,
        UploadedAt=now - timedelta(hours=6)
    ))
    
    for doc in documents:
        db.add(doc)
    
    db.commit()
    print(f"✅ {len(documents)} Dijital Arşiv belgesi oluşturuldu")


def seed_gate_logs(db: Session, work_orders):
    """GateLog demo verileri"""
    print("🔄 GateLog verileri oluşturuluyor...")
    
    if not work_orders:
        return
    
    # İş emri 4 (SAHADA) için giriş kaydı
    wo = work_orders[3]
    now = datetime.now()
    
    gate_logs = [
        GateLog(
            WorkOrderId=wo.Id,
            VehiclePlate="34 ABC 123",
            EntryTime=now - timedelta(hours=2),
            DurationMinutes=120,
            EntryNotes="Motorbot personeli giriş"
        ),
        GateLog(
            WorkOrderId=wo.Id,
            VehiclePlate="35 XYZ 789",
            EntryTime=now - timedelta(hours=3),
            ExitTime=now - timedelta(hours=1),
            DurationMinutes=120,
            EntryNotes="Ekipman transferi",
            ExitNotes="Normal çıkış"
        )
    ]
    
    for log in gate_logs:
        db.add(log)
    
    db.commit()
    print(f"✅ {len(gate_logs)} GateLog kaydı oluşturuldu")


def seed_work_logs(db: Session, work_orders):
    """WorkLog demo verileri"""
    print("🔄 WorkLog verileri oluşturuluyor...")
    
    if not work_orders:
        return
    
    # İş emri 4 için worklog
    wo = work_orders[3]
    now = datetime.now()
    
    work_logs = [
        WorkLog(
            WorkOrderId=wo.Id,
            PersonnelName="Ali Çelik",
            StartTime=now - timedelta(hours=2),
            EndTime=now,
            DurationHours=2.0,
            WorkDescription="Römorkör operasyonu",
            Notes="Normal işlem"
        )
    ]
    
    for log in work_logs:
        db.add(log)
    
    db.commit()
    print(f"✅ {len(work_logs)} WorkLog kaydı oluşturuldu")


def main():
    """Ana seed fonksiyonu"""
    print("\n" + "="*60)
    print("🌱 ALIAPORT İŞ EMRİ + DİJİTAL ARŞİV DEMO DATA SEED")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        work_orders = seed_work_orders(db)
        
        if work_orders:
            seed_work_order_persons(db, work_orders)
            seed_archive_documents(db, work_orders)
            seed_gate_logs(db, work_orders)
            seed_work_logs(db, work_orders)
        
        print("\n" + "="*60)
        print("✅ TÜM DEMO VERİLER BAŞARIYLA OLUŞTURULDU!")
        print("="*60 + "\n")
        
        # Özet
        print("📊 ÖZET:")
        print(f"   - İş Emirleri: {db.query(WorkOrder).count()}")
        print(f"   - WorkOrderPerson: {db.query(WorkOrderPerson).count()}")
        print(f"   - Dijital Arşiv Belgeleri: {db.query(ArchiveDocument).count()}")
        print(f"   - GateLog: {db.query(GateLog).count()}")
        print(f"   - WorkLog: {db.query(WorkLog).count()}")
        print()
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
