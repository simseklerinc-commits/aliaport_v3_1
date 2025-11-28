"""
Tarife Kuralları Test Scripti
PUT /api/work-order/{id}/apply-tariff-rules endpoint'ini test eder
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'aliaport_api')))

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.isemri.models import WorkOrder, WorkOrderItem, WorkOrderStatus, WorkOrderType, WorkOrderPriority, WorkOrderItemType
from aliaport_api.modules.isemri.router import apply_tariff_rules
from datetime import datetime
from decimal import Decimal


def create_test_work_order():
    """Tarife kuralları testi için iş emri oluştur"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*70)
        print("⚙️ TARİFE KURALLARI TEST İŞ EMRİ OLUŞTURULUYOR")
        print("="*70)
        
        # Önceki test kaydını sil
        db.query(WorkOrderItem).filter(WorkOrderItem.wo_number == "WO202511TEST002").delete()
        db.query(WorkOrder).filter(WorkOrder.wo_number == "WO202511TEST002").delete()
        db.commit()
        
        # Test iş emri oluştur
        wo = WorkOrder(
            wo_number="WO202511TEST002",
            cari_id=1,
            cari_code="C001",
            cari_title="Test Cari",
            type=WorkOrderType.HIZMET,
            subject="Tarife Kuralları Test İş Emri",
            description="Gece vardiyası + Hafta sonu + Acil işlem testi",
            priority=WorkOrderPriority.URGENT,
            status=WorkOrderStatus.APPROVED,
            apply_rule_addons=True,  # ÖNEMLI: Tarife kuralları aktif
            is_active=True,
            created_at=datetime.now()
        )
        db.add(wo)
        db.flush()
        
        print(f"✅ İş Emri Oluşturuldu: {wo.wo_number}")
        print(f"   • Tarife Kuralları: Aktif (apply_rule_addons=True)")
        
        # Kalemler ekle
        items = [
            {"code": "SVC001", "description": "Forklift Hizmeti", "unit_price": 500, "quantity": 4},
            {"code": "SVC002", "description": "Transpalet Hizmeti", "unit_price": 300, "quantity": 2},
            {"code": "SVC003", "description": "İskele Hizmeti", "unit_price": 1000, "quantity": 1}
        ]
        
        print("\n📦 Kalemler:")
        total = Decimal("0")
        
        for item_data in items:
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
                unit="SAAT",
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
        
        wo.total_amount = float(total)
        db.commit()
        
        print(f"\n💰 Toplam (Baz Tutar): {total} TRY")
        
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


def test_tariff_rules():
    """Tarife kurallarını test et"""
    
    # 1. Test iş emri oluştur
    work_order_id = create_test_work_order()
    
    if not work_order_id:
        return
    
    db = SessionLocal()
    
    try:
        print("\n" + "="*70)
        print("🧪 TARİFE KURALLARI UYGULANACAK")
        print("="*70)
        
        # 2. Senaryolar
        scenarios = [
            {
                "name": "Senaryo 1: Sadece Gece Vardiyası",
                "night_shift": True,
                "weekend": False,
                "urgent": False,
                "expected_multiplier": 1.25,
                "expected_increase": 25.0
            },
            {
                "name": "Senaryo 2: Gece + Hafta Sonu",
                "night_shift": True,
                "weekend": True,
                "urgent": False,
                "expected_multiplier": 1.875,  # 1.25 × 1.50
                "expected_increase": 87.5
            },
            {
                "name": "Senaryo 3: Tümü (Gece + Hafta Sonu + Acil)",
                "night_shift": True,
                "weekend": True,
                "urgent": True,
                "expected_multiplier": 2.4375,  # 1.25 × 1.50 × 1.30
                "expected_increase": 143.75
            }
        ]
        
        for scenario in scenarios:
            print(f"\n{'='*70}")
            print(f"📋 {scenario['name']}")
            print(f"{'='*70}")
            
            # İş emrini sıfırla (her senaryoda temiz başla)
            wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
            base_total = 3600.0  # Baz tutar (500×4 + 300×2 + 1000×1)
            wo.total_amount = base_total
            wo.completion_notes = None
            db.commit()
            
            # Endpoint'i çağır
            result = apply_tariff_rules(
                work_order_id=work_order_id,
                night_shift=scenario["night_shift"],
                weekend=scenario["weekend"],
                urgent=scenario["urgent"],
                db=db
            )
            
            print(f"\n✅ KURAL UYGULAMASI BAŞARILI!")
            print(f"{'='*70}")
            print(f"📌 İş Emri: {result['data']['wo_number']}")
            print(f"💰 Baz Tutar: {result['data']['base_total']:.2f} TRY")
            print(f"📊 Çarpan: {result['data']['multiplier']}")
            print(f"📈 Artış Oranı: %{result['data']['increase_percentage']:.2f}")
            print(f"💸 Artış Tutarı: {result['data']['increase_amount']:.2f} TRY")
            print(f"🎯 Yeni Toplam: {result['data']['new_total']:.2f} TRY")
            print(f"⚙️ Uygulanan Kurallar: {', '.join(result['data']['applied_rules'])}")
            print(f"{'='*70}")
            
            # Doğrulama
            assert result['data']['base_total'] == base_total
            assert abs(result['data']['multiplier'] - scenario['expected_multiplier']) < 0.001
            assert abs(result['data']['increase_percentage'] - scenario['expected_increase']) < 0.1
            
            expected_new_total = base_total * scenario['expected_multiplier']
            assert abs(result['data']['new_total'] - expected_new_total) < 0.1
            
            print(f"✅ Doğrulama: Tüm hesaplamalar doğru!")
            
            # completion_notes kontrol
            wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
            assert wo.completion_notes is not None
            assert "TARİFE KURALLARI" in wo.completion_notes
            
            print(f"\n📝 Completion Notes:")
            print(f"{wo.completion_notes}")
        
        print("\n" + "="*70)
        print("✅ TÜM SENARYOLAR BAŞARIYLA TEST EDİLDİ!")
        print("="*70)
        
        # Özet tablo
        print("\n📊 SENARYO ÖZETİ:")
        print(f"{'─'*70}")
        print(f"{'Senaryo':<40} {'Çarpan':<10} {'Artış %':<10}")
        print(f"{'─'*70}")
        for scenario in scenarios:
            print(f"{scenario['name']:<40} {scenario['expected_multiplier']:<10.4f} {scenario['expected_increase']:<10.2f}")
        print(f"{'─'*70}")
        
    except Exception as e:
        print(f"\n❌ TEST HATASI: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_tariff_rules()
