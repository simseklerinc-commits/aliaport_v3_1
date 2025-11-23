"""
İŞ EMRİ MODÜLÜ - Örnek Veri Ekleme Script
Test için örnek iş emirleri ve kalemleri oluşturur
"""

import sys
import os

# Python path'e app klasörünü ekle
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.isemri.models import WorkOrder, WorkOrderItem, WorkOrderType, WorkOrderPriority, WorkOrderStatus, WorkOrderItemType
from datetime import datetime, timedelta

def create_sample_work_orders():
    """Örnek iş emirleri oluştur"""
    db = SessionLocal()
    
    try:
        # Örnek İş Emri 1 - HIZMET (Forklift)
        wo1 = WorkOrder(
            wo_number="WO202411A1B2C3",
            cari_id=1,
            cari_code="01.001",
            cari_title="ARKAS HOLDİNG A.Ş.",
            requester_user_id=1,
            requester_user_name="Ali Operasyon",
            type=WorkOrderType.HIZMET,
            service_code="FORKLIFT",
            action="FORKLIFT_KULLANIM",
            subject="3 Ton Forklift Hizmeti",
            description="Konteyner yükleme operasyonu için forklift talep edilmiştir.",
            priority=WorkOrderPriority.HIGH,
            planned_start=datetime.now() - timedelta(days=2),
            planned_end=datetime.now() + timedelta(days=1),
            actual_start=datetime.now() - timedelta(days=2),
            status=WorkOrderStatus.SAHADA,
            gate_required=True,
            saha_kayit_yetkisi=True,
            attachments_count=2,
            has_signature=False,
            is_cabatoge_tr_flag=False,
            apply_rule_addons=True,
            attached_letter_approved=False,
            notes="Konteyner yükleme için acil talep",
            is_active=True,
            created_by=1,
            created_by_name="Ali Operasyon"
        )
        
        # Örnek İş Emri 2 - MOTORBOT (Pilot Hizmeti)
        wo2 = WorkOrder(
            wo_number="WO202411D4E5F6",
            cari_id=2,
            cari_code="01.002",
            cari_title="MSC MEDİTERRANEAN SHIPPING",
            requester_user_id=2,
            requester_user_name="Mehmet Cari",
            type=WorkOrderType.MOTORBOT,
            service_code="PILOT",
            action="PILOT_HIZMET",
            subject="Gemi Pilotluk Hizmeti",
            description="Yük gemisi için pilot ve römorkör hizmeti talep edildi.",
            priority=WorkOrderPriority.URGENT,
            planned_start=datetime.now(),
            planned_end=datetime.now() + timedelta(hours=6),
            status=WorkOrderStatus.APPROVED,
            gate_required=False,
            saha_kayit_yetkisi=True,
            attachments_count=3,
            has_signature=True,
            is_cabatoge_tr_flag=True,
            apply_rule_addons=True,
            attached_letter_approved=True,
            notes="Kabotaj indirimli hizmet",
            is_active=True,
            created_by=2,
            created_by_name="Mehmet Cari"
        )
        
        # Örnek İş Emri 3 - BARINMA
        wo3 = WorkOrder(
            wo_number="WO202411G7H8I9",
            cari_id=1,
            cari_code="01.001",
            cari_title="ARKAS HOLDİNG A.Ş.",
            requester_user_id=1,
            requester_user_name="Ali Operasyon",
            type=WorkOrderType.BARINMA,
            action="ARAÇ_GİRİŞ",
            subject="Araç Barınma Talebi",
            description="2 adet kamyon için 30 gün barınma talebi",
            priority=WorkOrderPriority.LOW,
            planned_start=datetime.now() + timedelta(days=1),
            status=WorkOrderStatus.SUBMITTED,
            gate_required=True,
            saha_kayit_yetkisi=False,
            attachments_count=3,
            has_signature=False,
            is_cabatoge_tr_flag=False,
            apply_rule_addons=False,
            attached_letter_approved=True,
            notes="Araç ruhsatları eklendi",
            is_active=True,
            created_by=1,
            created_by_name="Ali Operasyon"
        )
        
        # Veritabanına ekle
        db.add(wo1)
        db.add(wo2)
        db.add(wo3)
        db.commit()
        db.refresh(wo1)
        db.refresh(wo2)
        db.refresh(wo3)
        
        print(f"✅ 3 adet örnek iş emri oluşturuldu:")
        print(f"   - {wo1.wo_number}: {wo1.subject}")
        print(f"   - {wo2.wo_number}: {wo2.subject}")
        print(f"   - {wo3.wo_number}: {wo3.subject}")
        
        # Örnek Kalemler ekle (WO1 için)
        item1 = WorkOrderItem(
            work_order_id=wo1.id,
            wo_number=wo1.wo_number,
            item_type=WorkOrderItemType.WORKLOG,
            resource_code="FORKLIFT-01",
            resource_name="Forklift 3 Ton",
            start_time=datetime.now() - timedelta(hours=2),
            end_time=datetime.now() - timedelta(minutes=40),
            duration_minutes=80,
            quantity=1.33,  # 80 dakika = 1.33 saat
            unit="SAAT",
            unit_price=450.0,
            currency="TRY",
            total_amount=598.5,  # 1.33 * 450
            vat_rate=20.0,
            vat_amount=119.7,  # 598.5 * 0.20
            grand_total=718.2,  # 598.5 + 119.7
            is_invoiced=False,
            created_by=3,
            created_by_name="Saha Operatör"
        )
        
        item2 = WorkOrderItem(
            work_order_id=wo1.id,
            wo_number=wo1.wo_number,
            item_type=WorkOrderItemType.RESOURCE,
            resource_code="TRANSPALET",
            resource_name="Transpalet",
            quantity=1,
            unit="ADET",
            unit_price=200.0,
            currency="TRY",
            total_amount=200.0,
            vat_rate=20.0,
            vat_amount=40.0,
            grand_total=240.0,
            notes="Ek ekipman",
            is_invoiced=False,
            created_by=3,
            created_by_name="Saha Operatör"
        )
        
        # WO2 için kalem
        item3 = WorkOrderItem(
            work_order_id=wo2.id,
            wo_number=wo2.wo_number,
            item_type=WorkOrderItemType.SERVICE,
            service_code="PILOT",
            service_name="Pilot Hizmeti",
            quantity=1,
            unit="ADET",
            unit_price=2500.0,
            currency="USD",
            total_amount=2500.0,
            vat_rate=20.0,
            vat_amount=500.0,
            grand_total=3000.0,
            notes="Kabotaj indirimli",
            is_invoiced=False,
            created_by=2,
            created_by_name="Mehmet Cari"
        )
        
        db.add(item1)
        db.add(item2)
        db.add(item3)
        db.commit()
        
        print(f"✅ 3 adet örnek iş emri kalemi oluşturuldu")
        print(f"\n🎉 İş emri modülü örnek verileri başarıyla eklendi!")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_sample_work_orders()
