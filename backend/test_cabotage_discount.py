"""
Kabotaj İndirimi Test Scripti
PUT /api/work-order/{id}/apply-cabotage-discount endpoint'ini test eder
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'aliaport_api')))

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.isemri.models import WorkOrder, WorkOrderItem, WorkOrderStatus, WorkOrderType, WorkOrderPriority, WorkOrderItemType
# from aliaport_api.modules.dijital_arsiv.models import PortalUser  # Circular dependency, not needed for test
from aliaport_api.modules.isemri.router import apply_cabotage_discount
from datetime import datetime
from decimal import Decimal


def create_test_work_order():
    """Kabotaj indirimi testi için iş emri oluştur"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*70)
        print("🚢 KABOTAJ İNDİRİMİ TEST İŞ EMRİ OLUŞTURULUYOR")
        print("="*70)
        
        # Önceki test kaydını sil
        db.query(WorkOrderItem).filter(WorkOrderItem.wo_number == "WO202511TEST001").delete()
        db.query(WorkOrder).filter(WorkOrder.wo_number == "WO202511TEST001").delete()
        db.commit()
        
        # Test iş emri oluştur
        wo = WorkOrder(
            wo_number="WO202511TEST001",
            cari_id=1,
            cari_code="C001",
            cari_title="Test Cari",
            type=WorkOrderType.HIZMET,
            subject="Kabotaj İndirim Test İş Emri",
            description="Türk bayraklı gemi için test",
            priority=WorkOrderPriority.MEDIUM,
            status=WorkOrderStatus.APPROVED,
            is_cabatoge_tr_flag=True,  # Türk bayraklı
            apply_rule_addons=True,
            gate_required=False,
            saha_kayit_yetkisi=True,
            is_active=True,
            created_at=datetime.now()
        )
        db.add(wo)
        db.flush()
        
        print(f"✅ İş Emri Oluşturuldu: {wo.wo_number}")
        print(f"   • Türk Bayraklı: {wo.is_cabatoge_tr_flag}")
        
        # İş emri kalemleri ekle
        items_data = [
            {"code": "SERVICE_001", "description": "Römorkaj Hizmeti", "unit_price": 1000.00, "quantity": 2},
            {"code": "SERVICE_002", "description": "Pilot Hizmeti", "unit_price": 500.00, "quantity": 1},
            {"code": "SERVICE_003", "description": "Sağlık Hizmeti", "unit_price": 300.00, "quantity": 1}
        ]
        
        print("\n📦 Kalemler:")
        total = Decimal("0")
        for item_data in items_data:
            unit_price = Decimal(str(item_data["unit_price"]))
            quantity = Decimal(str(item_data["quantity"]))
            total_price = unit_price * quantity
            total += total_price
            
            item = WorkOrderItem(
                work_order_id=wo.id,
                wo_number=wo.wo_number,
                item_type=WorkOrderItemType.SERVICE,
                service_code=item_data["code"],
                service_name=item_data["description"],
                quantity=float(quantity),
                unit="ADET",
                unit_price=float(unit_price),
                currency="TRY",
                total_amount=float(total_price),
                vat_rate=20.0,
                vat_amount=float(total_price) * 0.20,
                grand_total=float(total_price) * 1.20,
                created_at=datetime.now()
            )
            db.add(item)
            
            print(f"   • {item_data['description']}: {unit_price} TRY × {quantity} = {total_price} TRY")
        
        print(f"\n💰 Toplam (İndirim Öncesi): {total} TRY")
        
        wo.total_amount = float(total)
        db.commit()
        
        print("\n" + "="*70)
        print("✅ TEST İŞ EMRİ OLUŞTURULDU!")
        print("="*70)
        
        return wo.id
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ HATA: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()


def test_cabotage_discount():
    """Kabotaj indirimi uygula ve test et"""
    db = SessionLocal()
    
    try:
        # Test iş emri oluştur
        work_order_id = create_test_work_order()
        if not work_order_id:
            return
        
        print("\n" + "="*70)
        print("🧪 KABOTAJ İNDİRİMİ UYGULANACAK")
        print("="*70)
        
        # İndirim uygula
        result = apply_cabotage_discount(work_order_id, db)
        
        print("\n✅ İNDİRİM UYGULAMASI BAŞARILI!")
        print("="*70)
        print(f"📌 İş Emri: {result['data']['wo_number']}")
        print(f"💰 Orijinal Tutar: {result['data']['original_total']:.2f} TRY")
        print(f"📊 İndirim Oranı: %{result['data']['discount_rate']}")
        print(f"💸 İndirim Tutarı: {result['data']['discount_amount']:.2f} TRY")
        print(f"🎯 İndirimli Toplam: {result['data']['discounted_total']:.2f} TRY")
        print(f"🚢 Türk Bayraklı: {result['data']['is_cabatoge_tr_flag']}")
        print("="*70)
        
        # Doğrulama
        expected_original = 2800.00  # 1000×2 + 500×1 + 300×1
        expected_discount = 280.00   # %10
        expected_discounted = 2520.00  # 2800 - 280
        
        assert result['data']['original_total'] == expected_original, f"Orijinal tutar yanlış: {result['data']['original_total']} != {expected_original}"
        assert result['data']['discount_amount'] == expected_discount, f"İndirim tutarı yanlış: {result['data']['discount_amount']} != {expected_discount}"
        assert result['data']['discounted_total'] == expected_discounted, f"İndirimli toplam yanlış: {result['data']['discounted_total']} != {expected_discounted}"
        
        print("\n✅ TÜM DOĞRULAMA TESTLERİ BAŞARILI!")
        
        # İş emrini kontrol et
        wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
        print(f"\n📝 Completion Notes Güncellendi:")
        print(f"{wo.completion_notes}")
        
        print("\n" + "="*70)
        print("✅ TEST BAŞARILI! KABOTAJ İNDİRİMİ ÇALIŞIYOR!")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ TEST HATASI: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_cabotage_discount()
