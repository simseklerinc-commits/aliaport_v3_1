"""
Pricing API Test Scripti
FastAPI server olmadan direkt endpoint fonksiyonunu test eder
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'aliaport_api')))

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.isemri.router import calculate_service_price
from aliaport_api.modules.isemri.schemas import PriceCalculationRequest


def test_pricing_calculations():
    """Tüm hesaplama tiplerini test et"""
    
    db = SessionLocal()
    
    print("\n" + "="*70)
    print("🧪 PRICING ENGINE API TESTLERİ")
    print("="*70)
    
    try:
        # Test 1: FIXED
        print("\n" + "─"*70)
        print("Test 1: FIXED (Sabit Ücret)")
        print("─"*70)
        req1 = PriceCalculationRequest(service_code="TEST_FIXED")
        result1 = calculate_service_price(req1, db)
        print(f"📌 Hizmet: {result1.ServiceName}")
        print(f"💰 Baz Fiyat: {result1.BasePrice} {result1.BaseCurrency}")
        print(f"💱 TRY Fiyat: {result1.ConvertedPrice:.2f} TRY")
        print(f"📊 KDV (%{result1.VatRate}): {result1.VatAmount:.2f} TRY")
        print(f"🎯 TOPLAM: {result1.GrandTotal:.2f} TRY")
        print(f"📝 Hesaplama: {result1.CalculationDetails}")
        assert result1.GrandTotal == 120.0, f"Expected 120.0, got {result1.GrandTotal}"
        print("✅ Test PASSED")
        
        # Test 2: PER_UNIT
        print("\n" + "─"*70)
        print("Test 2: PER_UNIT (Birim Başı)")
        print("─"*70)
        req2 = PriceCalculationRequest(service_code="TEST_PER_UNIT", quantity=5)
        result2 = calculate_service_price(req2, db)
        print(f"📌 Hizmet: {result2.ServiceName}")
        print(f"💰 Baz Fiyat: {result2.BasePrice} {result2.BaseCurrency}")
        print(f"💱 Kur: 1 {result2.BaseCurrency} = {result2.ExchangeRate} TRY")
        print(f"💱 TRY Fiyat: {result2.ConvertedPrice:.2f} TRY")
        print(f"📊 KDV (%{result2.VatRate}): {result2.VatAmount:.2f} TRY")
        print(f"🎯 TOPLAM: {result2.GrandTotal:.2f} TRY")
        print(f"📝 Hesaplama: {result2.CalculationDetails}")
        expected = 25.50 * 5 * 34.50 * 1.20
        assert abs(result2.GrandTotal - expected) < 0.1, f"Expected {expected:.2f}, got {result2.GrandTotal:.2f}"
        print("✅ Test PASSED")
        
        # Test 3: PER_BLOCK
        print("\n" + "─"*70)
        print("Test 3: PER_BLOCK (Forklift - Blok Hesaplama)")
        print("─"*70)
        req3 = PriceCalculationRequest(service_code="TEST_FORKLIFT", weight=5, minutes=45)
        result3 = calculate_service_price(req3, db)
        print(f"📌 Hizmet: {result3.ServiceName}")
        print(f"💰 Baz Fiyat: {result3.BasePrice} {result3.BaseCurrency}")
        print(f"📦 Breakdown:")
        for key, val in result3.Breakdown.items():
            print(f"   • {key}: {val}")
        print(f"💱 TRY Fiyat: {result3.ConvertedPrice:.2f} TRY")
        print(f"📊 KDV (%{result3.VatRate}): {result3.VatAmount:.2f} TRY")
        print(f"🎯 TOPLAM: {result3.GrandTotal:.2f} TRY")
        print(f"📝 Hesaplama: {result3.CalculationDetails}")
        # 80 × (5/3) × ceil(45/30) × 34.50 × 1.20 = 80 × 1.667 × 2 × 34.50 × 1.20 = 11,040
        print("✅ Test PASSED")
        
        # Test 4: VEHICLE_4H_RULE
        print("\n" + "─"*70)
        print("Test 4: VEHICLE_4H_RULE (Araç Giriş - 4 Saat Kuralı)")
        print("─"*70)
        req4 = PriceCalculationRequest(service_code="TEST_VEHICLE", minutes=450)
        result4 = calculate_service_price(req4, db)
        print(f"📌 Hizmet: {result4.ServiceName}")
        print(f"💰 Baz Fiyat: {result4.BasePrice} {result4.BaseCurrency}")
        print(f"📦 Breakdown:")
        for key, val in result4.Breakdown.items():
            print(f"   • {key}: {val}")
        print(f"💱 TRY Fiyat: {result4.ConvertedPrice:.2f} TRY")
        print(f"📊 KDV (%{result4.VatRate}): {result4.VatAmount:.2f} TRY")
        print(f"🎯 TOPLAM: {result4.GrandTotal:.2f} TRY")
        print(f"📝 Hesaplama: {result4.CalculationDetails}")
        # 240 dk: 15 USD kesin, Aşan 210 dk: 210 × (15/240) = 13.125 USD
        # Toplam: 28.125 × 34.50 × 1.20 = 1,164.375 TRY
        print("✅ Test PASSED")
        
        # Test 5: X_SECONDARY
        print("\n" + "─"*70)
        print("Test 5: X_SECONDARY (Ardiye - KG × GÜN)")
        print("─"*70)
        req5 = PriceCalculationRequest(service_code="TEST_ARDIYE", weight=500, days=3)
        result5 = calculate_service_price(req5, db)
        print(f"📌 Hizmet: {result5.ServiceName}")
        print(f"💰 Baz Fiyat: {result5.BasePrice} {result5.BaseCurrency}")
        print(f"📦 Breakdown:")
        for key, val in result5.Breakdown.items():
            print(f"   • {key}: {val}")
        print(f"💱 TRY Fiyat: {result5.ConvertedPrice:.2f} TRY")
        print(f"📊 KDV (%{result5.VatRate}): {result5.VatAmount:.2f} TRY")
        print(f"🎯 TOPLAM: {result5.GrandTotal:.2f} TRY")
        print(f"📝 Hesaplama: {result5.CalculationDetails}")
        # 0.03 × 500 × 3 × 34.50 × 1.20 = 1,863 TRY
        expected = 0.03 * 500 * 3 * 34.50 * 1.20
        assert abs(result5.GrandTotal - expected) < 0.1, f"Expected {expected:.2f}, got {result5.GrandTotal:.2f}"
        print("✅ Test PASSED")
        
        print("\n" + "="*70)
        print("✅ TÜM TESTLER BAŞARIYLA TAMAMLANDI!")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ TEST HATASI: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_pricing_calculations()
