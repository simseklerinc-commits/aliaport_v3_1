"""
Pricing Engine Test Script
Test all 6 calculation types with real-world examples
"""

import sys
sys.path.insert(0, '.')

from aliaport_api.modules.hizmet.pricing_engine import PricingEngine
from decimal import Decimal

def test_pricing_engine():
    engine = PricingEngine()
    
    print("=" * 60)
    print("PRICING ENGINE TEST - 6 Calculation Types")
    print("=" * 60)
    
    # Test 1: FIXED
    print("\n1️⃣ FIXED (Sabit Ücret)")
    print("-" * 60)
    result = engine.calculate(
        calculation_type="FIXED",
        base_price=Decimal("100.00"),
        formula_params={},
        input_data={},
        currency="USD"
    )
    print(f"   Toplam: {result['subtotal']} {result['currency']}")
    print(f"   Detay: {result['calculation_details']}")
    
    # Test 2: PER_UNIT
    print("\n2️⃣ PER_UNIT (Birim Başı) - Transpalet 3 saat")
    print("-" * 60)
    result = engine.calculate(
        calculation_type="PER_UNIT",
        base_price=Decimal("20.00"),
        formula_params={"unit": "SAAT"},
        input_data={"quantity": 3},
        currency="USD"
    )
    print(f"   Toplam: {result['subtotal']} {result['currency']}")
    print(f"   Detay: {result['calculation_details']}")
    
    # Test 3: X_SECONDARY (Ardiye: KG × GÜN)
    print("\n3️⃣ X_SECONDARY (İki Boyutlu) - Ardiye 500 KG × 3 GÜN")
    print("-" * 60)
    result = engine.calculate(
        calculation_type="X_SECONDARY",
        base_price=Decimal("0.03"),
        formula_params={
            "primary_field": "weight",
            "secondary_field": "days",
            "secondary_rounding": "ceil"
        },
        input_data={"weight": 500, "days": 3},
        currency="USD"
    )
    print(f"   Toplam: {result['subtotal']} {result['currency']}")
    print(f"   Detay: {result['calculation_details']}")
    print(f"   Breakdown: {result['breakdown']}")
    
    # Test 4: PER_BLOCK (Forklift)
    print("\n4️⃣ PER_BLOCK (Blok Bazlı) - Forklift 5 ton, 45 dakika")
    print("-" * 60)
    result = engine.calculate(
        calculation_type="PER_BLOCK",
        base_price=Decimal("80.00"),
        formula_params={
            "base_weight_ton": 3,
            "base_time_min": 30
        },
        input_data={"weight": 5, "minutes": 45},
        currency="USD"
    )
    print(f"   Toplam: {result['subtotal']} {result['currency']}")
    print(f"   Detay: {result['calculation_details']}")
    print(f"   Breakdown:")
    for key, value in result['breakdown'].items():
        print(f"      {key}: {value}")
    
    # Test 5: BASE_PLUS_INCREMENT (Liman Kullanım)
    print("\n5️⃣ BASE_PLUS_INCREMENT (Baz + Artış) - Liman 5000 GRT")
    print("-" * 60)
    result = engine.calculate(
        calculation_type="BASE_PLUS_INCREMENT",
        base_price=Decimal("950.00"),
        formula_params={
            "increment_unit": "GRT",
            "increment_rate": 0.03
        },
        input_data={"grt": 5000},
        currency="USD"
    )
    print(f"   Toplam: {result['subtotal']} {result['currency']}")
    print(f"   Detay: {result['calculation_details']}")
    print(f"   Breakdown:")
    for key, value in result['breakdown'].items():
        print(f"      {key}: {value}")
    
    # Test 6: VEHICLE_4H_RULE (4 Saat Kuralı)
    print("\n6️⃣ VEHICLE_4H_RULE (4 Saat Kuralı) - Araç 7.5 saat (450 dk)")
    print("-" * 60)
    result = engine.calculate(
        calculation_type="VEHICLE_4H_RULE",
        base_price=Decimal("15.00"),
        formula_params={"base_minutes": 240},
        input_data={"minutes": 450},
        currency="USD"
    )
    print(f"   Toplam: {result['subtotal']} {result['currency']}")
    print(f"   Detay: {result['calculation_details']}")
    print(f"   Breakdown:")
    for key, value in result['breakdown'].items():
        print(f"      {key}: {value}")
    
    # Test 7: VEHICLE_4H_RULE (4 saat altı)
    print("\n7️⃣ VEHICLE_4H_RULE (4 Saat Altı) - Araç 3 saat (180 dk)")
    print("-" * 60)
    result = engine.calculate(
        calculation_type="VEHICLE_4H_RULE",
        base_price=Decimal("15.00"),
        formula_params={"base_minutes": 240},
        input_data={"minutes": 180},
        currency="USD"
    )
    print(f"   Toplam: {result['subtotal']} {result['currency']}")
    print(f"   Detay: {result['calculation_details']}")
    
    print("\n" + "=" * 60)
    print("✅ TÜM TESTLER TAMAMLANDI")
    print("=" * 60)

if __name__ == "__main__":
    test_pricing_engine()
