"""
Seed Demo Data Script
Aliaport v3.1 - Demo verilerini oluşturur

Kullanım:
    python seed_demo_data.py
"""
import sys
import os
from pathlib import Path

# Backend klasörünü PYTHONPATH'e ekle
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

os.chdir(backend_path)

from sqlalchemy.orm import Session
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.hizmet.models import Hizmet
from aliaport_api.modules.tarife.models import PriceList
from datetime import datetime, date

def seed_cari_data(db: Session):
    """Cari demo verilerini oluştur"""
    print("🔄 Cari verileri oluşturuluyor...")
    
    # Önce mevcut dataları kontrol et
    existing_count = db.query(Cari).count()
    if existing_count > 0:
        print(f"⚠️  Zaten {existing_count} cari kaydı var. Seed atlanıyor.")
        return
    
    cari_list = [
        {
            "CariKod": "C001",
            "Unvan": "Örnek Gemi İşletmeleri A.Ş.",
            "CariTip": "MUSTERI",
            "Rol": "KURUMSAL",
            "VergiDairesi": "Konak Vergi Dairesi",
            "VergiNo": "1234567890",
            "Adres": "Alsancak Mah. Liman Cad. No:45 Konak/İzmir",
            "Telefon": "+90 232 123 45 67",
            "Email": "info@ornekgemi.com.tr",
            "YetkiliKisi": "Ahmet Yılmaz",
            "AktifMi": True,
        },
        {
            "CariKod": "C002",
            "Unvan": "Deniz Ürünleri Nakliyat Ltd.",
            "CariTip": "HER_IKISI",
            "Rol": "VIP",
            "VergiDairesi": "Karşıyaka Vergi Dairesi",
            "VergiNo": "9876543210",
            "Adres": "Karşıyaka Liman Bölgesi No:12",
            "Telefon": "+90 232 987 65 43",
            "Email": "deniz@deniznakli.com",
            "YetkiliKisi": "Mehmet Deniz",
            "AktifMi": True,
        },
        {
            "CariKod": "C003",
            "Unvan": "Ege Konteyner Taşımacılık",
            "CariTip": "MUSTERI",
            "Rol": "NORMAL",
            "VergiDairesi": "Buca Vergi Dairesi",
            "VergiNo": "5555666777",
            "Adres": "Buca OSB 5. Cadde No:78",
            "Telefon": "+90 232 555 66 77",
            "Email": "bilgi@egekonteyner.com",
            "YetkiliKisi": "Ayşe Kaya",
            "AktifMi": True,
        },
        {
            "CariKod": "C004",
            "Unvan": "Petrol Tankerleri A.Ş.",
            "CariTip": "MUSTERI",
            "Rol": "KURUMSAL",
            "VergiDairesi": "Alsancak Vergi Dairesi",
            "VergiNo": "1112223334",
            "Adres": "Alsancak Liman Cd. No:100",
            "Telefon": "+90 232 111 22 33",
            "Email": "iletisim@petroltanker.com",
            "YetkiliKisi": "Fatma Öztürk",
            "AktifMi": True,
        },
        {
            "CariKod": "C005",
            "Unvan": "Yat Marina İşletmeleri",
            "CariTip": "TEDARIKCI",
            "Rol": "VIP",
            "VergiDairesi": "Çeşme Vergi Dairesi",
            "VergiNo": "4443332221",
            "Adres": "Çeşme Marina Bölgesi",
            "Telefon": "+90 232 444 33 22",
            "Email": "marina@yatmarina.com.tr",
            "YetkiliKisi": "Hasan Demir",
            "AktifMi": True,
        },
    ]
    
    for cari_data in cari_list:
        cari = Cari(**cari_data)
        db.add(cari)
    
    db.commit()
    print(f"✅ {len(cari_list)} cari kaydı oluşturuldu")


def seed_hizmet_data(db: Session):
    """Hizmet demo verilerini oluştur"""
    print("🔄 Hizmet verileri oluşturuluyor...")
    
    # Önce mevcut dataları kontrol et
    existing_count = db.query(Hizmet).count()
    if existing_count > 0:
        print(f"⚠️  Zaten {existing_count} hizmet kaydı var. Seed atlanıyor.")
        return
    
    hizmet_list = [
        {
            "Kod": "H001",
            "Ad": "Gemi Yanaşma Hizmeti",
            "Aciklama": "Geminin limana yanaşması ve bağlanması hizmeti",
            "GrupKod": "LIMAN",
            "MuhasebeKodu": "600.01.001",
            "Birim": "SAAT",
            "Fiyat": 2500.00,
            "ParaBirimi": "TRY",
            "KdvOrani": 20,
            "AktifMi": True,
        },
        {
            "Kod": "H002",
            "Ad": "Konteyner Elleçleme",
            "Aciklama": "20' ve 40' konteyner yükleme/boşaltma",
            "GrupKod": "YÜKLEME",
            "MuhasebeKodu": "600.02.001",
            "Birim": "ADET",
            "Fiyat": 450.00,
            "ParaBirimi": "USD",
            "KdvOrani": 20,
            "AktifMi": True,
        },
        {
            "Kod": "H003",
            "Ad": "Römorkör Hizmeti",
            "Aciklama": "Gemi manevra römorkör hizmeti",
            "GrupKod": "DESTEK",
            "MuhasebeKodu": "600.03.001",
            "Birim": "SAAT",
            "Fiyat": 3500.00,
            "ParaBirimi": "EUR",
            "KdvOrani": 20,
            "AktifMi": True,
        },
        {
            "Kod": "H004",
            "Ad": "Gemi Yakıt İkmali",
            "Aciklama": "Gemiye yakıt ikmali hizmeti (bunker)",
            "GrupKod": "IKMAL",
            "MuhasebeKodu": "600.04.001",
            "Birim": "TON",
            "Fiyat": 850.00,
            "ParaBirimi": "USD",
            "KdvOrani": 20,
            "AktifMi": True,
        },
        {
            "Kod": "H005",
            "Ad": "Temiz Su Tedariki",
            "Aciklama": "Gemiye temiz su temini",
            "GrupKod": "IKMAL",
            "MuhasebeKodu": "600.05.001",
            "Birim": "M3",
            "Fiyat": 35.00,
            "ParaBirimi": "TRY",
            "KdvOrani": 20,
            "AktifMi": True,
        },
        {
            "Kod": "H006",
            "Ad": "Liman Güvenlik Hizmeti",
            "Aciklama": "Gemi ve yük güvenliği sağlama",
            "GrupKod": "GUVENLIK",
            "MuhasebeKodu": "600.06.001",
            "Birim": "GÜN",
            "Fiyat": 1200.00,
            "ParaBirimi": "TRY",
            "KdvOrani": 20,
            "AktifMi": True,
        },
        {
            "Kod": "H007",
            "Ad": "Kılavuzluk Hizmeti",
            "Aciklama": "Gemi giriş/çıkış kılavuzluk",
            "GrupKod": "DESTEK",
            "MuhasebeKodu": "600.07.001",
            "Birim": "SEFER",
            "Fiyat": 4500.00,
            "ParaBirimi": "TRY",
            "KdvOrani": 20,
            "AktifMi": True,
        },
        {
            "Kod": "H008",
            "Ad": "Atık Toplama Hizmeti",
            "Aciklama": "Gemi katı ve sıvı atık toplama",
            "GrupKod": "CEVRE",
            "MuhasebeKodu": "600.08.001",
            "Birim": "M3",
            "Fiyat": 250.00,
            "ParaBirimi": "TRY",
            "KdvOrani": 20,
            "AktifMi": True,
        },
    ]
    
    for hizmet_data in hizmet_list:
        hizmet = Hizmet(**hizmet_data)
        db.add(hizmet)
    
    db.commit()
    print(f"✅ {len(hizmet_list)} hizmet kaydı oluşturuldu")


def seed_tarife_data(db: Session):
    """Tarife demo verilerini oluştur"""
    print("🔄 Tarife verileri oluşturuluyor...")
    
    # Önce mevcut dataları kontrol et
    existing_count = db.query(PriceList).count()
    if existing_count > 0:
        print(f"⚠️  Zaten {existing_count} tarife kaydı var. Seed atlanıyor.")
        return
    
    tarife_list = [
        {
            "Kod": "T2025-01",
            "Ad": "2025 Standart Tarife - TRY",
            "ParaBirimi": "TRY",
            "Versiyon": "1.0",
            "GecerlilikBaslangic": date(2025, 1, 1),
            "GecerlilikBitis": date(2025, 12, 31),
            "Durum": "AKTIF",
            "Aciklama": "2025 yılı standart liman hizmetleri tarifesi (TL bazlı)",
        },
        {
            "Kod": "T2025-02",
            "Ad": "2025 Standart Tarife - USD",
            "ParaBirimi": "USD",
            "Versiyon": "1.0",
            "GecerlilikBaslangic": date(2025, 1, 1),
            "GecerlilikBitis": date(2025, 12, 31),
            "Durum": "AKTIF",
            "Aciklama": "2025 yılı standart liman hizmetleri tarifesi (USD bazlı)",
        },
        {
            "Kod": "T2025-03",
            "Ad": "2025 VIP Müşteri Tarifesi",
            "ParaBirimi": "EUR",
            "Versiyon": "1.0",
            "GecerlilikBaslangic": date(2025, 1, 1),
            "GecerlilikBitis": date(2025, 12, 31),
            "Durum": "AKTIF",
            "Aciklama": "VIP müşteriler için özel indirimli tarife (EUR bazlı)",
        },
        {
            "Kod": "T2024-ARSIV",
            "Ad": "2024 Arşiv Tarife",
            "ParaBirimi": "TRY",
            "Versiyon": "2.0",
            "GecerlilikBaslangic": date(2024, 1, 1),
            "GecerlilikBitis": date(2024, 12, 31),
            "Durum": "PASIF",
            "Aciklama": "2024 yılı tarifesi (arşiv)",
        },
    ]
    
    for tarife_data in tarife_list:
        tarife = PriceList(**tarife_data)
        db.add(tarife)
    
    db.commit()
    print(f"✅ {len(tarife_list)} tarife kaydı oluşturuldu")


def main():
    """Ana seed fonksiyonu"""
    print("\n" + "="*60)
    print("🌱 ALIAPORT v3.1 - DEMO DATA SEED")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        # Sırayla seed et
        seed_cari_data(db)
        seed_hizmet_data(db)
        seed_tarife_data(db)
        
        print("\n" + "="*60)
        print("✅ TÜM DEMO VERİLER BAŞARIYLA OLUŞTURULDU!")
        print("="*60 + "\n")
        
        # Özet
        print("📊 ÖZET:")
        print(f"   - Cari Kayıtları: {db.query(Cari).count()}")
        print(f"   - Hizmet Kayıtları: {db.query(Hizmet).count()}")
        print(f"   - Tarife Kayıtları: {db.query(PriceList).count()}")
        print()
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
