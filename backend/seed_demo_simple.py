"""
Basit Seed Demo Data - İş Emri + Dijital Arşiv
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))
os.chdir(backend_path)

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.auth.models import User  # User modelini import et
from aliaport_api.modules.isemri.models import (
    WorkOrder, WorkOrderPerson,
    WorkOrderType, WorkOrderStatus, WorkOrderPriority
)
from aliaport_api.modules.dijital_arsiv.models import (
    ArchiveDocument, DocumentCategory, DocumentType, DocumentStatus
)
from aliaport_api.modules.guvenlik.models import GateLog
from aliaport_api.modules.saha.models import WorkLog
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.hizmet.models import Hizmet


def main():
    print("=" * 60)
    print("🌱 ALIAPORT İŞ EMRİ DEMO DATA SEED (SIMPLE)")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Cari ve Hizmet al
        cari_list = db.query(Cari).limit(5).all()
        hizmet_list = db.query(Hizmet).limit(3).all()
        
        if not cari_list:
            print("❌ Cari kaydı yok!")
            return
        
        now = datetime.now()
        
        # 1. DRAFT - Taslak
        print("\n📝 1. DRAFT iş emri oluşturuluyor...")
        wo1 = WorkOrder(
            wo_number=f"WO-{now.year}-00001",
            cari_id=cari_list[0].Id,
            cari_code=cari_list[0].CariKod,
            cari_title=cari_list[0].Unvan,
            type=WorkOrderType.HIZMET,
            subject="M/V NEPTUNE - Römorkaj Hizmeti",
            description="105m konteyner gemisi, rıhtım 3'e yanaştırılacak",
            priority=WorkOrderPriority.MEDIUM,
            status=WorkOrderStatus.DRAFT,
            planned_start=now + timedelta(days=2),
            planned_end=now + timedelta(days=2, hours=4),
            is_cabatoge_tr_flag=True
        )
        db.add(wo1)
        
        # 2. PENDING_APPROVAL - Onay bekliyor
        print("📝 2. PENDING_APPROVAL iş emri oluşturuluyor...")
        wo2 = WorkOrder(
            wo_number=f"WO-{now.year}-00002",
            cari_id=cari_list[1].Id if len(cari_list) > 1 else cari_list[0].Id,
            cari_code=cari_list[1].CariKod if len(cari_list) > 1 else cari_list[0].CariKod,
            cari_title=cari_list[1].Unvan if len(cari_list) > 1 else cari_list[0].Unvan,
            type=WorkOrderType.HIZMET,
            subject="M/V ATLAS - Römorkaj + Hammal",
            description="Römorkaj + 10 hammal, 4 saat",
            priority=WorkOrderPriority.HIGH,
            status=WorkOrderStatus.PENDING_APPROVAL,
            planned_start=now + timedelta(days=1),
            planned_end=now + timedelta(days=1, hours=4)
        )
        db.add(wo2)
        
        # 3. APPROVED - Onaylandı
        print("📝 3. APPROVED iş emri oluşturuluyor...")
        wo3 = WorkOrder(
            wo_number=f"WO-{now.year}-00003",
            cari_id=cari_list[0].Id,
            cari_code=cari_list[0].CariKod,
            cari_title=cari_list[0].Unvan,
            type=WorkOrderType.MOTORBOT,
            subject="MAERSK LINE - Personel Transferi",
            description="Gemi adamı transferi (8 kişi)",
            priority=WorkOrderPriority.URGENT,
            status=WorkOrderStatus.APPROVED,
            planned_start=now,
            planned_end=now + timedelta(hours=2)
        )
        db.add(wo3)
        
        # 4. SAHADA - Sahada aktif
        print("📝 4. SAHADA iş emri oluşturuluyor...")
        wo4 = WorkOrder(
            wo_number=f"WO-{now.year}-00004",
            cari_id=cari_list[0].Id,
            cari_code=cari_list[0].CariKod,
            cari_title=cari_list[0].Unvan,
            type=WorkOrderType.HIZMET,
            subject="MSC - Forklift + Hammal",
            description="3 forklift, 15 hammal, yük elleçleme",
            priority=WorkOrderPriority.HIGH,
            status=WorkOrderStatus.SAHADA,
            planned_start=now - timedelta(hours=3),
            planned_end=now + timedelta(hours=1),
            actual_start=now - timedelta(hours=3)
        )
        db.add(wo4)
        
        # 5. TAMAMLANDI - Bugün tamamlandı
        print("📝 5. TAMAMLANDI iş emri oluşturuluyor...")
        wo5 = WorkOrder(
            wo_number=f"WO-{now.year}-00005",
            cari_id=cari_list[0].Id,
            cari_code=cari_list[0].CariKod,
            cari_title=cari_list[0].Unvan,
            type=WorkOrderType.HIZMET,
            subject="HAPAG LLOYD - Temiz Su Tedariki",
            description="500 ton temiz su ikmali",
            priority=WorkOrderPriority.MEDIUM,
            status=WorkOrderStatus.TAMAMLANDI,
            planned_start=now - timedelta(hours=6),
            planned_end=now - timedelta(hours=2),
            actual_start=now - timedelta(hours=6),
            actual_end=now - timedelta(hours=2),
            completed_at=now - timedelta(hours=2)
        )
        db.add(wo5)
        
        # 6. REJECTED - Reddedildi
        print("📝 6. REJECTED iş emri oluşturuluyor...")
        wo6 = WorkOrder(
            wo_number=f"WO-{now.year}-00006",
            cari_id=cari_list[0].Id,
            cari_code=cari_list[0].CariKod,
            cari_title=cari_list[0].Unvan,
            type=WorkOrderType.HIZMET,
            subject="XYZ Shipping - Gümrük Hizmeti",
            description="Evrak eksik",
            priority=WorkOrderPriority.LOW,
            status=WorkOrderStatus.REJECTED,
            planned_start=now + timedelta(days=3),
            planned_end=now + timedelta(days=3, hours=2),
            rejection_reason="Gümrük izin belgesi eksik"
        )
        db.add(wo6)
        
        db.commit()
        print("\n✅ İş emirleri oluşturuldu!")
        
        # İş emri ID'lerini al
        db.refresh(wo1)
        db.refresh(wo2)
        db.refresh(wo3)
        db.refresh(wo4)
        
        # WorkOrderPerson ekle (wo4 için 2 kişi)
        print("\n👤 WorkOrderPerson kayıtları oluşturuluyor...")
        person1 = WorkOrderPerson(
            work_order_id=wo4.id,
            full_name="Ahmet Yılmaz",
            tc_kimlik_no="12345678901",
            nationality="TUR",
            phone="+90 532 123 4567",
            gate_entry_time=now - timedelta(hours=3),
            approved_by_security=True
        )
        db.add(person1)
        
        person2 = WorkOrderPerson(
            work_order_id=wo4.id,
            full_name="Mehmet Demir",
            tc_kimlik_no="98765432109",
            nationality="TUR",
            phone="+90 532 987 6543",
            gate_entry_time=now - timedelta(hours=3),
            approved_by_security=True
        )
        db.add(person2)
        
        # Onay bekleyen (wo3 için)
        person3 = WorkOrderPerson(
            work_order_id=wo3.id,
            full_name="John Smith",
            passport_no="US1234567",
            nationality="USA",
            phone="+1 555 123 4567",
            approved_by_security=False
        )
        db.add(person3)
        
        db.commit()
        print("✅ 3 WorkOrderPerson kaydı oluşturuldu!")
        
        # ArchiveDocument ekle
        print("\n📄 ArchiveDocument kayıtları oluşturuluyor...")
        doc1 = ArchiveDocument(
            category=DocumentCategory.WORK_ORDER,
            document_type=DocumentType.GUMRUK_IZIN_BELGESI,
            work_order_id=wo2.id,
            file_name="gumruk_izin_wo2.pdf",
            file_path=f"/uploads/documents/work_order/{wo2.wo_number}/gumruk_izin.pdf",
            file_size=524288,
            file_type="application/pdf",
            file_hash="abc123hash456",
            status=DocumentStatus.UPLOADED,
            uploaded_at=now - timedelta(hours=1)
        )
        db.add(doc1)
        
        doc2 = ArchiveDocument(
            category=DocumentCategory.WORK_ORDER,
            document_type=DocumentType.MANIFESTO,
            work_order_id=wo3.id,
            file_name="manifesto_wo3.pdf",
            file_path=f"/uploads/documents/work_order/{wo3.wo_number}/manifesto.pdf",
            file_size=1048576,
            file_type="application/pdf",
            file_hash="def789hash012",
            status=DocumentStatus.APPROVED,
            uploaded_at=now - timedelta(hours=4),
            approved_at=now - timedelta(hours=2)
        )
        db.add(doc2)
        
        doc3 = ArchiveDocument(
            category=DocumentCategory.WORK_ORDER,
            document_type=DocumentType.BEYANNAME,
            work_order_id=wo6.id,
            file_name="beyanname_wo6.pdf",
            file_path=f"/uploads/documents/work_order/{wo6.wo_number}/beyanname.pdf",
            file_size=204800,
            file_type="application/pdf",
            file_hash="ghi345hash678",
            status=DocumentStatus.REJECTED,
            uploaded_at=now - timedelta(hours=5),
            rejected_at=now - timedelta(hours=3),
            rejection_reason="Evrak eksik"
        )
        db.add(doc3)
        
        db.commit()
        print("✅ 3 ArchiveDocument kaydı oluşturuldu!")
        
        # GateLog ekle
        print("\n🚪 GateLog kayıtları oluşturuluyor...")
        gate1 = GateLog(
            work_order_id=wo4.id,
            work_order_person_id=person1.id,
            entry_type="GIRIS",
            wo_number=wo4.wo_number,
            wo_status="APPROVED",
            security_personnel="Güvenlik Şefi - Hasan Demir",
            is_approved=True,
            checklist_complete=True,
            entry_time=now - timedelta(hours=3)
        )
        db.add(gate1)
        
        gate2 = GateLog(
            work_order_id=wo4.id,
            work_order_person_id=person2.id,
            entry_type="GIRIS",
            wo_number=wo4.wo_number,
            wo_status="APPROVED",
            security_personnel="Güvenlik Şefi - Hasan Demir",
            is_approved=True,
            checklist_complete=True,
            entry_time=now - timedelta(hours=3)
        )
        db.add(gate2)
        
        db.commit()
        print("✅ 2 GateLog kaydı oluşturuldu!")
        
        # WorkLog ekle
        print("\n⏱️ WorkLog kaydı oluşturuluyor...")
        worklog1 = WorkLog(
            work_order_id=wo4.id,
            personnel_name="Saha Şefi - Ali Kaya",
            time_start=now - timedelta(hours=3),
            service_type="FORKLIFT",
            quantity=3.0,
            unit="SAAT",
            description="3 forklift, 15 hammal, konteyner boşaltma"
        )
        db.add(worklog1)
        
        db.commit()
        print("✅ 1 WorkLog kaydı oluşturuldu!")
        
        print("\n" + "=" * 60)
        print("✅ SEED TAMAMLANDI!")
        print("=" * 60)
        print(f"\n📊 Özet:")
        print(f"   - 6 İş Emri")
        print(f"   - 3 WorkOrderPerson")
        print(f"   - 3 ArchiveDocument")
        print(f"   - 2 GateLog")
        print(f"   - 1 WorkLog")
        print(f"\n🎯 Durum Dağılımı:")
        print(f"   - DRAFT: 1")
        print(f"   - PENDING_APPROVAL: 1")
        print(f"   - APPROVED: 1")
        print(f"   - SAHADA: 1")
        print(f"   - TAMAMLANDI: 1")
        print(f"   - REJECTED: 1")
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
