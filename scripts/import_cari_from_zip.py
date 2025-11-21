#!/usr/bin/env python3
"""
Cari Kartları Import Script
ZIP dosyasından örnek cari kartlarını mevcut sisteme aktarır
"""

import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models import Cari
from datetime import datetime

def import_cari_data():
    """Örnek cari kartlarını veritabanına ekle"""
    db = SessionLocal()
    
    try:
        # Mevcut kayıt sayısını kontrol et
        existing_count = db.query(Cari).count()
        print(f"📊 Mevcut cari sayısı: {existing_count}")
        
        # ZIP'ten örnek cari kartları (Türkiye port operations için gerçekçi veriler)
        sample_cari = [
            {
                "CariKod": "C-001",
                "Unvan": "Türk Denizcilik A.Ş.",
                "CariTip": "TUZEL",
                "Rol": "MUSTERI",
                "VergiDairesi": "Kadıköy",
                "VergiNo": "1234567890",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Kadıköy",
                "Adres": "Rasimpaşa Mah. Deniz Cad. No:45/2 Kadıköy",
                "Telefon": "+90 216 555 0101",
                "Eposta": "info@turkdenizcilik.com.tr",
                "Iban": "TR33 0006 1005 1978 6457 8413 26",
                "VadeGun": 30,
                "ParaBirimi": "TRY",
                "AktifMi": True
            },
            {
                "CariKod": "C-002",
                "Unvan": "Mavi Dalga Gemi İşletmeciliği Ltd. Şti.",
                "CariTip": "TUZEL",
                "Rol": "MUSTERI",
                "VergiDairesi": "Kartal",
                "VergiNo": "2345678901",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Kartal",
                "Adres": "Kordonboyu Mah. Sahil Yolu Cad. No:78 Kartal",
                "Telefon": "+90 216 555 0202",
                "Eposta": "bilgi@mavidalga.com.tr",
                "Iban": "TR44 0001 2009 4050 0058 0001 23",
                "VadeGun": 45,
                "ParaBirimi": "TRY",
                "AktifMi": True
            },
            {
                "CariKod": "C-003",
                "Unvan": "Ahmet Yılmaz",
                "CariTip": "GERCEK",
                "Rol": "MUSTERI",
                "VergiDairesi": None,
                "VergiNo": None,
                "Tckn": "12345678901",
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Beşiktaş",
                "Adres": "Yıldız Mah. Çırağan Cad. No:12/5 Beşiktaş",
                "Telefon": "+90 532 111 2233",
                "Eposta": "ahmet.yilmaz@gmail.com",
                "Iban": "TR55 0006 4000 0011 1234 5678 90",
                "VadeGun": 15,
                "ParaBirimi": "TRY",
                "AktifMi": True
            },
            {
                "CariKod": "C-004",
                "Unvan": "Deniz Lojistik Hizmetleri A.Ş.",
                "CariTip": "TUZEL",
                "Rol": "TEDARIKCI",
                "VergiDairesi": "Beyoğlu",
                "VergiNo": "3456789012",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Beyoğlu",
                "Adres": "Kemankeş Mah. Rıhtım Cad. No:34 Beyoğlu",
                "Telefon": "+90 212 555 0303",
                "Eposta": "satis@denizlojistik.com",
                "Iban": "TR66 0010 3000 0000 0012 3456 78",
                "VadeGun": 60,
                "ParaBirimi": "TRY",
                "AktifMi": True
            },
            {
                "CariKod": "C-005",
                "Unvan": "Yakıt Tedarik A.Ş.",
                "CariTip": "TUZEL",
                "Rol": "TEDARIKCI",
                "VergiDairesi": "Zeytinburnu",
                "VergiNo": "4567890123",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Zeytinburnu",
                "Adres": "Sanayi Mah. Petrol Cad. No:156 Zeytinburnu",
                "Telefon": "+90 212 555 0404",
                "Eposta": "info@yakittedarik.com.tr",
                "Iban": "TR77 0012 3000 1111 1234 5678 90",
                "VadeGun": 30,
                "ParaBirimi": "USD",
                "AktifMi": True
            },
            {
                "CariKod": "C-006",
                "Unvan": "Mehmet Demir Tekne İşletmeciliği",
                "CariTip": "GERCEK",
                "Rol": "MUSTERI",
                "VergiDairesi": None,
                "VergiNo": None,
                "Tckn": "98765432109",
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Maltepe",
                "Adres": "Marina Sok. No:8/A Maltepe",
                "Telefon": "+90 533 444 5566",
                "Eposta": "mehmet.demir@hotmail.com",
                "Iban": "TR88 0006 2000 1234 0000 5678 90",
                "VadeGun": 0,
                "ParaBirimi": "TRY",
                "AktifMi": True
            },
            {
                "CariKod": "C-007",
                "Unvan": "Karadeniz Taşımacılık Ltd. Şti.",
                "CariTip": "TUZEL",
                "Rol": "MUSTERI",
                "VergiDairesi": "Pendik",
                "VergiNo": "5678901234",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Pendik",
                "Adres": "Liman Bölgesi, Kurtköy Yolu No:89 Pendik",
                "Telefon": "+90 216 555 0505",
                "Eposta": "operasyon@karadeniztasimacilik.com",
                "Iban": "TR99 0004 6000 0987 6543 2100 01",
                "VadeGun": 45,
                "ParaBirimi": "EUR",
                "AktifMi": True
            },
            {
                "CariKod": "C-008",
                "Unvan": "Bakım Onarım Hizmetleri A.Ş.",
                "CariTip": "TUZEL",
                "Rol": "TEDARIKCI",
                "VergiDairesi": "Tuzla",
                "VergiNo": "6789012345",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Tuzla",
                "Adres": "Tersane Cad. No:23 Tuzla",
                "Telefon": "+90 216 555 0606",
                "Eposta": "servis@bakimonarim.com.tr",
                "Iban": "TR11 0006 7000 0011 2233 4455 66",
                "VadeGun": 30,
                "ParaBirimi": "TRY",
                "AktifMi": True
            },
            {
                "CariKod": "C-009",
                "Unvan": "Ayşe Kaya",
                "CariTip": "GERCEK",
                "Rol": "MUSTERI",
                "VergiDairesi": None,
                "VergiNo": None,
                "Tckn": "11223344556",
                "Ulke": "Türkiye",
                "Il": "İstanbul",
                "Ilce": "Sarıyer",
                "Adres": "İstinye Marina Apt. No:15/7 Sarıyer",
                "Telefon": "+90 535 777 8899",
                "Eposta": "ayse.kaya@yahoo.com",
                "Iban": "TR22 0001 5000 1234 5678 9012 34",
                "VadeGun": 0,
                "ParaBirimi": "TRY",
                "AktifMi": True
            },
            {
                "CariKod": "C-010",
                "Unvan": "Ege Deniz Ürünleri İthalat İhracat A.Ş.",
                "CariTip": "TUZEL",
                "Rol": "MUSTERI",
                "VergiDairesi": "Güzelyalı",
                "VergiNo": "7890123456",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "İzmir",
                "Ilce": "Konak",
                "Adres": "Alsancak Liman Bölgesi No:45 Konak",
                "Telefon": "+90 232 555 0707",
                "Eposta": "export@egedenizurunleri.com",
                "Iban": "TR33 0009 9000 1234 5678 9012 34",
                "VadeGun": 60,
                "ParaBirimi": "EUR",
                "AktifMi": True
            },
            {
                "CariKod": "C-011",
                "Unvan": "Can Öztürk Deniz Taşımacılığı",
                "CariTip": "GERCEK",
                "Rol": "MUSTERI",
                "VergiDairesi": None,
                "VergiNo": None,
                "Tckn": "22334455667",
                "Ulke": "Türkiye",
                "Il": "Antalya",
                "Ilce": "Muratpaşa",
                "Adres": "Kaleiçi Yat Limanı No:12 Muratpaşa",
                "Telefon": "+90 536 222 3344",
                "Eposta": "can.ozturk@outlook.com",
                "Iban": "TR44 0002 0000 5678 1234 9012 34",
                "VadeGun": 15,
                "ParaBirimi": "TRY",
                "AktifMi": False
            },
            {
                "CariKod": "C-012",
                "Unvan": "Akdeniz Lojistik Çözümleri Ltd. Şti.",
                "CariTip": "TUZEL",
                "Rol": "MUSTERI",
                "VergiDairesi": "Mersin",
                "VergiNo": "8901234567",
                "Tckn": None,
                "Ulke": "Türkiye",
                "Il": "Mersin",
                "Ilce": "Yenişehir",
                "Adres": "Liman Cad. No:67 Yenişehir",
                "Telefon": "+90 324 555 0808",
                "Eposta": "info@akdenizlojistik.com.tr",
                "Iban": "TR55 0003 4000 1111 2222 3333 44",
                "VadeGun": 45,
                "ParaBirimi": "USD",
                "AktifMi": True
            }
        ]
        
        added_count = 0
        
        for cari_data in sample_cari:
            # Aynı cari koduna sahip kayıt var mı kontrol et
            existing = db.query(Cari).filter(
                Cari.CariKod == cari_data["CariKod"]
            ).first()
            
            if existing:
                print(f"⏭️  {cari_data['CariKod']} - {cari_data['Unvan']} zaten mevcut, atlanıyor...")
                continue
            
            cari = Cari(**cari_data)
            db.add(cari)
            added_count += 1
            print(f"✅ {cari_data['CariKod']} - {cari_data['Unvan']} eklendi")
        
        db.commit()
        
        total_count = db.query(Cari).count()
        print(f"\n🎉 İşlem tamamlandı!")
        print(f"📊 Yeni eklenen: {added_count}")
        print(f"📊 Toplam cari: {total_count}")
        
        # Özet bilgi
        musteri_count = db.query(Cari).filter(Cari.Rol == "MUSTERI").count()
        tedarikci_count = db.query(Cari).filter(Cari.Rol == "TEDARIKCI").count()
        aktif_count = db.query(Cari).filter(Cari.AktifMi == True).count()
        pasif_count = db.query(Cari).filter(Cari.AktifMi == False).count()
        
        print(f"\n📊 Müşteriler: {musteri_count}")
        print(f"📦 Tedarikçiler: {tedarikci_count}")
        print(f"✅ Aktif: {aktif_count}")
        print(f"❌ Pasif: {pasif_count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Hata oluştu: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Cari Kartları İmport (ZIP → Sistem)\n")
    import_cari_data()
