#!/usr/bin/env python3
"""
Barınma Sözleşmeleri - Örnek Veri İmport Script
ZIP dosyasında barınma verisi olmadığı için test amaçlı örnek kontratlar oluşturur
"""

import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models_barinma import BarinmaContract
from datetime import date, timedelta
from decimal import Decimal

def import_sample_contracts():
    """Örnek barınma sözleşmeleri ekle"""
    db = SessionLocal()
    
    try:
        # Mevcut kayıt sayısını kontrol et
        existing_count = db.query(BarinmaContract).count()
        print(f"📊 Mevcut sözleşme sayısı: {existing_count}")
        
        if existing_count > 0:
            print("⚠️ Veritabanında zaten sözleşme kayıtları var.")
            response = input("Yeni örnek veriler eklemek istiyor musunuz? (e/h): ")
            if response.lower() != 'e':
                print("❌ İşlem iptal edildi.")
                return
        
        # Örnek barınma sözleşmeleri
        sample_contracts = [
            {
                "ContractNumber": "BAR-2025-001",
                "MotorbotId": 1,  # M/Y BLUE SEA
                "CariId": 1,      # İlk cari
                "ServiceCardId": 1,  # Barınma hizmeti
                "PriceListId": 1,    # 2025 Tarife
                "StartDate": date(2025, 1, 1),
                "EndDate": date(2025, 12, 31),
                "UnitPrice": Decimal("45000.00"),
                "Currency": "TRY",
                "VatRate": Decimal("20.00"),
                "BillingPeriod": "YEARLY",
                "IsActive": True,
                "Notes": "2025 yılı yıllık barınma sözleşmesi - Ödeme 12 taksit",
                "CreatedBy": 1
            },
            {
                "ContractNumber": "BAR-2025-002",
                "MotorbotId": 2,
                "CariId": 2,
                "ServiceCardId": 1,
                "PriceListId": 1,
                "StartDate": date(2024, 11, 1),
                "EndDate": date(2025, 1, 31),
                "UnitPrice": Decimal("8500.00"),
                "Currency": "TRY",
                "VatRate": Decimal("20.00"),
                "BillingPeriod": "MONTHLY",
                "IsActive": True,
                "Notes": "3 aylık sözleşme - Ocak sonunda yenilenecek",
                "CreatedBy": 1
            },
            {
                "ContractNumber": "BAR-2024-015",
                "MotorbotId": 3,
                "CariId": 3,
                "ServiceCardId": 1,
                "PriceListId": 1,
                "StartDate": date(2024, 6, 15),
                "EndDate": date(2024, 12, 31),
                "UnitPrice": Decimal("6200.00"),
                "Currency": "TRY",
                "VatRate": Decimal("20.00"),
                "BillingPeriod": "MONTHLY",
                "IsActive": False,
                "Notes": "Süresi dolmuş sözleşme - 2025'te yenilenmedi",
                "CreatedBy": 1
            },
            {
                "ContractNumber": "BAR-2025-003",
                "MotorbotId": 4,
                "CariId": 4,
                "ServiceCardId": 1,
                "PriceListId": 1,
                "StartDate": date(2025, 1, 15),
                "EndDate": date(2025, 4, 15),
                "UnitPrice": Decimal("7800.00"),
                "Currency": "TRY",
                "VatRate": Decimal("20.00"),
                "BillingPeriod": "QUARTERLY",
                "IsActive": True,
                "Notes": "3 aylık deneme sözleşmesi - Mart ayında değerlendirme",
                "CreatedBy": 1
            },
            {
                "ContractNumber": "BAR-2025-004",
                "MotorbotId": 5,
                "CariId": 5,
                "ServiceCardId": 1,
                "PriceListId": 1,
                "StartDate": date(2025, 2, 1),
                "EndDate": None,  # Süresiz
                "UnitPrice": Decimal("12500.00"),
                "Currency": "EUR",
                "VatRate": Decimal("20.00"),
                "BillingPeriod": "MONTHLY",
                "IsActive": True,
                "Notes": "Süresiz sözleşme - EURO üzerinden ödeme",
                "CreatedBy": 1
            }
        ]
        
        added_count = 0
        
        for contract_data in sample_contracts:
            # Aynı sözleşme numarasına sahip kayıt var mı kontrol et
            existing = db.query(BarinmaContract).filter(
                BarinmaContract.ContractNumber == contract_data["ContractNumber"]
            ).first()
            
            if existing:
                print(f"⏭️  {contract_data['ContractNumber']} zaten mevcut, atlanıyor...")
                continue
            
            contract = BarinmaContract(**contract_data)
            db.add(contract)
            added_count += 1
            print(f"✅ {contract_data['ContractNumber']} eklendi")
        
        db.commit()
        
        total_count = db.query(BarinmaContract).count()
        print(f"\n🎉 İşlem tamamlandı!")
        print(f"📊 Yeni eklenen: {added_count}")
        print(f"📊 Toplam sözleşme: {total_count}")
        
        # Özet bilgi
        active_count = db.query(BarinmaContract).filter(BarinmaContract.IsActive == True).count()
        inactive_count = db.query(BarinmaContract).filter(BarinmaContract.IsActive == False).count()
        print(f"\n📈 Aktif sözleşmeler: {active_count}")
        print(f"📉 Pasif sözleşmeler: {inactive_count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata oluştu: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Barınma Sözleşmeleri Örnek Veri İmport\n")
    import_sample_contracts()
