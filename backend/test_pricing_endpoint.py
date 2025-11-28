"""
Pricing endpoint test scripti
POST /api/work-order/calculate-price endpoint'ini test eder
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'aliaport_api')))

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal, engine
from aliaport_api.modules.hizmet.models import Hizmet, CalculationType
from decimal import Decimal
import json

def create_test_hizmet():
    """Test için örnek hizmetler oluştur"""
    db = SessionLocal()
    
    try:
        # Önce mevcut test hizmetlerini sil
        db.query(Hizmet).filter(Hizmet.Kod.like("TEST_%")).delete()
        db.commit()
        
        print("\n" + "="*60)
        print("🔧 TEST HİZMETLERİ OLUŞTURULUYOR")
        print("="*60)
        
        # Test Hizmeti 1: FIXED
        h1 = Hizmet(
            Kod="TEST_FIXED",
            Ad="Test Sabit Ücret",
            Aciklama="Sabit ücret testi",
            Fiyat=Decimal("100.00"),
            ParaBirimi="TRY",
            KdvOrani=Decimal("20.00"),
            CalculationType=CalculationType.FIXED,
            FormulaParams=None,
            AktifMi=True
        )
        db.add(h1)
        print("✅ TEST_FIXED: 100 TRY (Sabit)")
        
        # Test Hizmeti 2: PER_UNIT
        h2 = Hizmet(
            Kod="TEST_PER_UNIT",
            Ad="Test Birim Başı",
            Aciklama="Birim başı fiyat testi",
            Fiyat=Decimal("25.50"),
            ParaBirimi="USD",
            KdvOrani=Decimal("20.00"),
            CalculationType=CalculationType.PER_UNIT,
            FormulaParams=json.dumps({"unit": "ADET"}),
            AktifMi=True
        )
        db.add(h2)
        print("✅ TEST_PER_UNIT: 25.50 USD × miktar")
        
        # Test Hizmeti 3: PER_BLOCK
        h3 = Hizmet(
            Kod="TEST_FORKLIFT",
            Ad="Test Forklift",
            Aciklama="Forklift blok hesaplama",
            Fiyat=Decimal("80.00"),
            ParaBirimi="USD",
            KdvOrani=Decimal("20.00"),
            CalculationType=CalculationType.PER_BLOCK,
            FormulaParams=json.dumps({"base_weight_ton": 3, "base_time_min": 30}),
            AktifMi=True
        )
        db.add(h3)
        print("✅ TEST_FORKLIFT: 80 USD × (ton/3) × ceil(dk/30)")
        
        # Test Hizmeti 4: VEHICLE_4H_RULE
        h4 = Hizmet(
            Kod="TEST_VEHICLE",
            Ad="Test Araç Giriş",
            Aciklama="4 saat kuralı",
            Fiyat=Decimal("15.00"),
            ParaBirimi="USD",
            KdvOrani=Decimal("20.00"),
            CalculationType=CalculationType.VEHICLE_4H_RULE,
            FormulaParams=json.dumps({"base_minutes": 240}),
            AktifMi=True
        )
        db.add(h4)
        print("✅ TEST_VEHICLE: 15 USD (240 dk kesin + fazlası)")
        
        # Test Hizmeti 5: X_SECONDARY
        h5 = Hizmet(
            Kod="TEST_ARDIYE",
            Ad="Test Ardiye",
            Aciklama="Ardiye hesaplama (KG × GÜN)",
            Fiyat=Decimal("0.03"),
            ParaBirimi="USD",
            KdvOrani=Decimal("20.00"),
            CalculationType=CalculationType.X_SECONDARY,
            FormulaParams=json.dumps({
                "primary_field": "weight",
                "secondary_field": "days",
                "secondary_rounding": "ceil"
            }),
            AktifMi=True
        )
        db.add(h5)
        print("✅ TEST_ARDIYE: 0.03 USD × KG × GÜN")
        
        db.commit()
        
        print("\n" + "="*60)
        print("✅ TEST HİZMETLERİ OLUŞTURULDU!")
        print("="*60)
        
        print("\n📋 Test Senaryoları:")
        print("\n1. FIXED (Sabit Ücret):")
        print('   POST /api/work-order/calculate-price')
        print('   {"service_code": "TEST_FIXED"}')
        print('   Beklenen: 100 TRY + KDV = 120 TRY')
        
        print("\n2. PER_UNIT (Birim Başı):")
        print('   POST /api/work-order/calculate-price')
        print('   {"service_code": "TEST_PER_UNIT", "quantity": 5}')
        print('   Beklenen: (25.50 USD × 5) × 34.50 × 1.20 = 5,271 TRY')
        
        print("\n3. PER_BLOCK (Forklift):")
        print('   POST /api/work-order/calculate-price')
        print('   {"service_code": "TEST_FORKLIFT", "weight": 5000, "minutes": 45}')
        print('   Beklenen: 80 × (5/3) × ceil(45/30) × 34.50 × 1.20 = 11,040 TRY')
        
        print("\n4. VEHICLE_4H_RULE (Araç Giriş):")
        print('   POST /api/work-order/calculate-price')
        print('   {"service_code": "TEST_VEHICLE", "minutes": 450}')
        print('   Beklenen: (15 + 210×0.0625) × 34.50 × 1.20 = 1,156.50 TRY')
        
        print("\n5. X_SECONDARY (Ardiye):")
        print('   POST /api/work-order/calculate-price')
        print('   {"service_code": "TEST_ARDIYE", "weight": 500, "days": 3}')
        print('   Beklenen: 0.03 × 500 × 3 × 34.50 × 1.20 = 1,863 TRY')
        
        print("\n🚀 API server'ı başlat ve test et:")
        print("   cd backend")
        print("   uvicorn aliaport_api.main:app --reload")
        
    finally:
        db.close()


if __name__ == "__main__":
    create_test_hizmet()
