"""
Sample Data Seed Script
Cari, Motorbot, Hizmet tablolarına örnek veriler ekler
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.motorbot.models import Motorbot, MbTrip
from aliaport_api.modules.hizmet.models import Hizmet
from datetime import datetime, date

def seed_cari_data():
    """Cari (Müşteri/Tedarikçi) örnek verileri"""
    db = SessionLocal()
    
    # Mevcut veri var mı kontrol
    if db.query(Cari).count() > 0:
        print("⚠️  Cari tablosu zaten dolu, atlanıyor...")
        db.close()
        return
    
    sample_cari = [
        Cari(
            CariKod="MST001",
            Unvan="PETROL OFİSİ A.Ş.",
            CariTip="TUZEL",
            Rol="MUSTERI",
            VergiDairesi="ANKARA VD",
            VergiNo="1234567890",
            Ulke="TÜRKİYE",
            Il="İSTANBUL",
            Ilce="KADIKÖY",
            Telefon="+90 216 XXX XXXX",
            Eposta="info@po.com.tr",
            VadeGun=30,
            AktifMi=True
        ),
        Cari(
            CariKod="MST002",
            Unvan="SHELL & TURCAS PETROL A.Ş.",
            CariTip="TUZEL",
            Rol="MUSTERI",
            VergiDairesi="İSTANBUL VD",
            VergiNo="9876543210",
            Ulke="TÜRKİYE",
            Il="İSTANBUL",
            Ilce="SİLİVRİ",
            Telefon="+90 212 XXX XXXX",
            Eposta="iletisim@shell.com.tr",
            VadeGun=45,
            AktifMi=True
        ),
        Cari(
            CariKod="MST003",
            Unvan="LUKOIL TÜRK PETROL TİC. A.Ş.",
            CariTip="TUZEL",
            Rol="MUSTERI",
            VergiDairesi="ANKARA VD",
            VergiNo="5544332211",
            Ulke="TÜRKİYE",
            Il="ANKARA",
            Ilce="ÇANKAYA",
            Telefon="+90 312 XXX XXXX",
            Eposta="info@lukoil.com.tr",
            VadeGun=30,
            AktifMi=True
        ),
        Cari(
            CariKod="TDR001",
            Unvan="AKARYAKIT TEDARİK A.Ş.",
            CariTip="TUZEL",
            Rol="TEDARIKCI",
            VergiDairesi="İZMİR VD",
            VergiNo="1122334455",
            Ulke="TÜRKİYE",
            Il="İZMİR",
            Ilce="KONAK",
            Telefon="+90 232 XXX XXXX",
            Eposta="satis@tedarik.com.tr",
            VadeGun=60,
            AktifMi=True
        ),
        Cari(
            CariKod="MST004",
            Unvan="DENİZ TAŞIMACILIK LTD.ŞTİ.",
            CariTip="TUZEL",
            Rol="MUSTERI",
            VergiDairesi="İSTANBUL VD",
            VergiNo="6677889900",
            Ulke="TÜRKİYE",
            Il="İSTANBUL",
            Ilce="KARTAL",
            Telefon="+90 216 XXX XXXX",
            Eposta="info@deniztasimacilik.com",
            VadeGun=30,
            AktifMi=True
        )
    ]
    
    db.add_all(sample_cari)
    db.commit()
    print(f"✅ {len(sample_cari)} Cari kaydı eklendi")
    db.close()


def seed_motorbot_data():
    """Motorbot ve Sefer örnek verileri"""
    db = SessionLocal()
    
    if db.query(Motorbot).count() > 0:
        print("⚠️  Motorbot tablosu zaten dolu, atlanıyor...")
        db.close()
        return
    
    sample_motorbots = [
        Motorbot(
            Kod="MB001",
            Ad="ALIAPORT-1",
            Plaka="35RR001",
            KapasiteTon=150,
            MaxHizKnot=12.5,
            Durum="AKTIF",
            Notlar="Ana römorkör"
        ),
        Motorbot(
            Kod="MB002",
            Ad="ALIAPORT-2",
            Plaka="35RR002",
            KapasiteTon=180,
            MaxHizKnot=14.0,
            Durum="AKTIF",
            Notlar="Yedek römorkör"
        ),
        Motorbot(
            Kod="MB003",
            Ad="PILOT-1",
            Plaka="35PL001",
            KapasiteTon=50,
            MaxHizKnot=20.0,
            Durum="AKTIF",
            Notlar="Pilot botu"
        ),
        Motorbot(
            Kod="MB004",
            Ad="SERVIS-1",
            Plaka="35SV001",
            KapasiteTon=30,
            MaxHizKnot=18.0,
            Durum="AKTIF",
            Notlar="Personel servisi"
        ),
        Motorbot(
            Kod="MB005",
            Ad="RÖMORKÖR-3",
            Plaka="35RR003",
            KapasiteTon=200,
            MaxHizKnot=15.0,
            Durum="BAKIM",
            Notlar="Bakımda"
        )
    ]
    
    db.add_all(sample_motorbots)
    db.commit()
    print(f"✅ {len(sample_motorbots)} Motorbot kaydı eklendi")
    
    # Sefer kayıtları - MotorbotId kullanmak için önce botları ID'leriyle alalım
    bot_mb001 = db.query(Motorbot).filter(Motorbot.Kod == "MB001").first()
    bot_mb002 = db.query(Motorbot).filter(Motorbot.Kod == "MB002").first()
    bot_mb003 = db.query(Motorbot).filter(Motorbot.Kod == "MB003").first()
    bot_mb004 = db.query(Motorbot).filter(Motorbot.Kod == "MB004").first()
    
    sample_trips = [
        MbTrip(
            MotorbotId=bot_mb001.Id,
            SeferTarihi=date(2025, 11, 20),
            CikisZamani=datetime(2025, 11, 20, 8, 0),
            DonusZamani=datetime(2025, 11, 20, 10, 30),
            YukAciklama="M/V OCEAN STAR",
            Durum="TAMAMLANDI",
            Notlar="Liman giriş römorkajı"
        ),
        MbTrip(
            MotorbotId=bot_mb001.Id,
            SeferTarihi=date(2025, 11, 21),
            CikisZamani=datetime(2025, 11, 21, 14, 0),
            DonusZamani=datetime(2025, 11, 21, 16, 15),
            YukAciklama="M/V ATLANTIC QUEEN",
            Durum="TAMAMLANDI",
            Notlar="Liman çıkış römorkajı"
        ),
        MbTrip(
            MotorbotId=bot_mb002.Id,
            SeferTarihi=date(2025, 11, 22),
            CikisZamani=datetime(2025, 11, 22, 9, 30),
            DonusZamani=datetime(2025, 11, 22, 11, 45),
            YukAciklama="M/V NORDIC PRIDE",
            Durum="TAMAMLANDI",
            Notlar="Rıhtım değişikliği"
        ),
        MbTrip(
            MotorbotId=bot_mb003.Id,
            SeferTarihi=date(2025, 11, 23),
            CikisZamani=datetime(2025, 11, 23, 7, 0),
            DonusZamani=datetime(2025, 11, 23, 7, 45),
            YukAciklama="M/V PACIFIC VOYAGER",
            Durum="TAMAMLANDI",
            Notlar="Pilot alma"
        ),
        MbTrip(
            MotorbotId=bot_mb004.Id,
            SeferTarihi=date(2025, 11, 23),
            CikisZamani=datetime(2025, 11, 23, 10, 0),
            DonusZamani=None,
            YukAciklama="M/V CARGO EXPRESS",
            Durum="DEVAM_EDIYOR",
            Notlar="Personel taşıma"
        )
    ]
    
    db.add_all(sample_trips)
    db.commit()
    print(f"✅ {len(sample_trips)} MbTrip (Sefer) kaydı eklendi")
    db.close()


def seed_hizmet_data():
    """Hizmet Tanımları örnek verileri"""
    db = SessionLocal()
    
    if db.query(Hizmet).count() > 0:
        print("⚠️  Hizmet tablosu zaten dolu, atlanıyor...")
        db.close()
        return
    
    sample_hizmetler = [
        Hizmet(
            Kod="HZM001",
            Ad="RÖMORKAJ HİZMETİ",
            GrupKod="RÖMORKAJ",
            Birim="SAAT",
            Fiyat=1500.00,
            ParaBirimi="TRY",
            KdvOrani=20.0,
            Aciklama="Römorkör ile gemi çekme/itme hizmeti"
        ),
        Hizmet(
            Kod="HZM002",
            Ad="PİLOTAJ HİZMETİ",
            GrupKod="PİLOTAJ",
            Birim="SEFER",
            Fiyat=2500.00,
            ParaBirimi="TRY",
            KdvOrani=20.0,
            Aciklama="Kılavuzluk hizmeti"
        ),
        Hizmet(
            Kod="HZM003",
            Ad="BAĞLAMA HİZMETİ",
            GrupKod="BAĞLAMA",
            Birim="ADET",
            Fiyat=500.00,
            ParaBirimi="TRY",
            KdvOrani=20.0,
            Aciklama="Gemi bağlama personel hizmeti"
        ),
        Hizmet(
            Kod="HZM004",
            Ad="YAKLAŞMA HİZMETİ",
            GrupKod="YAKLAŞMA",
            Birim="SEFER",
            Fiyat=1000.00,
            ParaBirimi="TRY",
            KdvOrani=20.0,
            Aciklama="Gemi yaklaşma hizmeti"
        ),
        Hizmet(
            Kod="HZM005",
            Ad="ATIK ALMA HİZMETİ",
            GrupKod="ATIK",
            Birim="TON",
            Fiyat=350.00,
            ParaBirimi="USD",
            KdvOrani=20.0,
            Aciklama="Gemi atık alma hizmeti"
        ),
        Hizmet(
            Kod="HZM006",
            Ad="SU TEMİNİ",
            GrupKod="TEMİN",
            Birim="M3",
            Fiyat=15.00,
            ParaBirimi="TRY",
            KdvOrani=20.0,
            Aciklama="Gemi su temini"
        ),
        Hizmet(
            Kod="HZM007",
            Ad="ELEKTRİK TEMİNİ",
            GrupKod="TEMİN",
            Birim="KWH",
            Fiyat=5.50,
            ParaBirimi="TRY",
            KdvOrani=20.0,
            Aciklama="Rıhtım elektrik temini"
        ),
        Hizmet(
            Kod="HZM008",
            Ad="BALAST ALMA",
            GrupKod="BALAST",
            Birim="TON",
            Fiyat=12.00,
            ParaBirimi="USD",
            KdvOrani=20.0,
            Aciklama="Gemi balast alma hizmeti"
        )
    ]
    
    db.add_all(sample_hizmetler)
    db.commit()
    print(f"✅ {len(sample_hizmetler)} Hizmet kaydı eklendi")
    db.close()


if __name__ == "__main__":
    print("\n" + "="*50)
    print("  ALIAPORT - SAMPLE DATA SEED")
    print("="*50 + "\n")
    
    try:
        seed_cari_data()
        seed_motorbot_data()
        seed_hizmet_data()
        
        print("\n" + "="*50)
        print("  ✅ TÜM SAMPLE DATA YÜKLENDİ")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        import traceback
        traceback.print_exc()
