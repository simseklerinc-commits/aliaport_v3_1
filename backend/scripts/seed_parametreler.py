"""
Parametre Seed Script
Sistem parametrelerini database'e yükler
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.parametre.models import Parametre
from datetime import datetime

def seed_parametreler():
    """Sistem parametrelerini yükle"""
    db = SessionLocal()
    
    # Mevcut parametreleri kontrol et
    existing_count = db.query(Parametre).count()
    if existing_count > 1:  # TEST_PARAM zaten var
        print(f"⚠️  Parametre tablosu zaten dolu ({existing_count} kayıt), atlanıyor...")
        db.close()
        return
    
    parametreler = [
        # HİZMET GRUPLARI (Yeni Kategori - Eski sistemden)
        Parametre(
            Kategori="HIZMET_GRUBU",
            Kod="BARINMA",
            Ad="Barınma Hizmetleri",
            Deger="BARINMA",
            Aciklama="Motorbot ve yelkenli barınma hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_GRUBU",
            Kod="ENERJI",
            Ad="Enerji & İkmal",
            Deger="ENERJI",
            Aciklama="Elektrik, su, yakıt gibi enerji ve ikmal hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_GRUBU",
            Kod="GRUP_BAKIM",
            Ad="Bakım & Onarım",
            Deger="BAKIM",
            Aciklama="Tekne bakım ve onarım hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_GRUBU",
            Kod="TERSANE",
            Ad="Tersane Hizmetleri",
            Deger="TERSANE",
            Aciklama="Kaldırma, depolama gibi tersane hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_GRUBU",
            Kod="GRUP_SEFER",
            Ad="Sefer Hizmetleri",
            Deger="SEFER",
            Aciklama="Yolcu ve yük taşıma seferleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_GRUBU",
            Kod="DANISMANLIK",
            Ad="Danışmanlık & Broker",
            Deger="DANISMANLIK",
            Aciklama="Broker ve danışmanlık hizmetleri",
            AktifMi=False
        ),
        
        # HİZMET KATEGORİLERİ (Genel + Detaylı birleştirildi)
        # Genel Hizmet Kategorileri
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="ROMORKAJ",
            Ad="Römorkaj Hizmeti",
            Deger="ROMORKAJ",
            Aciklama="Römorkör ile gemi çekme/itme hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="PILOTAJ",
            Ad="Pilotaj Hizmeti",
            Deger="PILOTAJ",
            Aciklama="Kılavuzluk hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="BAGLAMA",
            Ad="Bağlama Hizmeti",
            Deger="BAGLAMA",
            Aciklama="Gemi bağlama personel hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="TEMIN",
            Ad="Temin Hizmetleri",
            Deger="TEMIN",
            Aciklama="Su, elektrik vb. temin hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="ATIK",
            Ad="Atık Toplama",
            Deger="ATIK",
            Aciklama="Gemi atık toplama hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="BALAST",
            Ad="Balast Hizmeti",
            Deger="BALAST",
            Aciklama="Balast alma/verme hizmetleri",
            AktifMi=True
        ),
        # Barınma Kategorileri
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="MB-YILLIK",
            Ad="Motorbot Yıllık Barınma",
            Deger="MB-YILLIK",
            Aciklama="Motorbot yıllık barınma hizmeti",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="MB-AYLIK",
            Ad="Motorbot Aylık Barınma",
            Deger="MB-AYLIK",
            Aciklama="Motorbot aylık barınma hizmeti",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="MB-GUNLUK",
            Ad="Motorbot Günlük Barınma",
            Deger="MB-GUNLUK",
            Aciklama="Motorbot günlük barınma hizmeti",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="YL-YILLIK",
            Ad="Yelkenli Yıllık Barınma",
            Deger="YL-YILLIK",
            Aciklama="Yelkenli yıllık barınma hizmeti",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="YL-AYLIK",
            Ad="Yelkenli Aylık Barınma",
            Deger="YL-AYLIK",
            Aciklama="Yelkenli aylık barınma hizmeti",
            AktifMi=True
        ),
        # Enerji & İkmal Kategorileri
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="ELEKTRIK",
            Ad="Elektrik",
            Deger="ELEKTRIK",
            Aciklama="Elektrik ikmal hizmeti",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="SU",
            Ad="Su",
            Deger="SU",
            Aciklama="Su ikmal hizmeti",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="YAKIT",
            Ad="Yakıt",
            Deger="YAKIT",
            Aciklama="Yakıt ikmal hizmeti",
            AktifMi=True
        ),
        # Bakım Kategorileri
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="BAKIM-GENEL",
            Ad="Genel Bakım",
            Deger="BAKIM-GENEL",
            Aciklama="Genel bakım hizmetleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="BAKIM-MOTOR",
            Ad="Motor Bakım",
            Deger="BAKIM-MOTOR",
            Aciklama="Motor bakım ve onarım",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="BAKIM-BOYA",
            Ad="Boya Bakım",
            Deger="BAKIM-BOYA",
            Aciklama="Boya ve kaplama işleri",
            AktifMi=True
        ),
        # Tersane Kategorileri
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="KALDIRMA",
            Ad="Kaldırma",
            Deger="KALDIRMA",
            Aciklama="Tekne kaldırma hizmeti",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="DEPOLAMA",
            Ad="Depolama",
            Deger="DEPOLAMA",
            Aciklama="Kara depolama hizmeti",
            AktifMi=True
        ),
        # Sefer Kategorileri
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="SEFER-YOLCU",
            Ad="Yolcu Taşıma",
            Deger="SEFER-YOLCU",
            Aciklama="Yolcu taşıma seferleri",
            AktifMi=True
        ),
        Parametre(
            Kategori="HIZMET_KATEGORI",
            Kod="SEFER-YUK",
            Ad="Yük Taşıma",
            Deger="SEFER-YUK",
            Aciklama="Yük taşıma seferleri",
            AktifMi=True
        ),
        
        # FİYATLANDIRMA KURALLARI (Yeni Kategori)
        Parametre(
            Kategori="FIYATLANDIRMA_KURALI",
            Kod="STD-1",
            Ad="Standart 1 Birim",
            Deger="STANDARD",
            Aciklama="Standart 1 birim hesaplama",
            AktifMi=True
        ),
        Parametre(
            Kategori="FIYATLANDIRMA_KURALI",
            Kod="PKG-4H",
            Ad="Paket 4 Saat Minimum",
            Deger="PACKAGE_EXCESS",
            Aciklama="4 saat paket, fazlası birim fiyat",
            AktifMi=True
        ),
        Parametre(
            Kategori="FIYATLANDIRMA_KURALI",
            Kod="PKG-8H",
            Ad="Paket 8 Saat",
            Deger="PACKAGE_EXCESS",
            Aciklama="8 saat paket, fazlası birim fiyat",
            AktifMi=True
        ),
        Parametre(
            Kategori="FIYATLANDIRMA_KURALI",
            Kod="PKG-1DAY",
            Ad="Paket 1 Gün",
            Deger="PACKAGE_EXCESS",
            Aciklama="1 gün paket, fazlası birim fiyat",
            AktifMi=True
        ),
        Parametre(
            Kategori="FIYATLANDIRMA_KURALI",
            Kod="PKG-7DAY",
            Ad="Paket 7 Gün/Haftalık",
            Deger="PACKAGE_EXCESS",
            Aciklama="7 gün haftalık paket, fazlası birim fiyat",
            AktifMi=True
        ),
        
        # BİRİMLER
        Parametre(
            Kategori="BIRIM",
            Kod="SAAT",
            Ad="Saat",
            Deger="SAAT",
            Aciklama="Saatlik ücretlendirme birimi",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="BIRIM_SEFER",
            Ad="Sefer",
            Deger="SEFER",
            Aciklama="Sefer bazlı ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="ADET",
            Ad="Adet",
            Deger="ADET",
            Aciklama="Adet bazlı ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="TON",
            Ad="Ton",
            Deger="TON",
            Aciklama="Ton bazlı ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="M3",
            Ad="Metreküp",
            Deger="M3",
            Aciklama="Metreküp bazlı ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="KWH",
            Ad="Kilowatt Saat",
            Deger="KWH",
            Aciklama="Elektrik tüketimi birimi",
            AktifMi=True
        ),
        # Eski sistemden eklenenler
        Parametre(
            Kategori="BIRIM",
            Kod="GUN",
            Ad="Gün",
            Deger="GUN",
            Aciklama="Günlük ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="AY",
            Ad="Ay",
            Deger="AY",
            Aciklama="Aylık ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="YIL",
            Ad="Yıl",
            Deger="YIL",
            Aciklama="Yıllık ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="M",
            Ad="Metre",
            Deger="M",
            Aciklama="Metre bazlı ölçü",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="M2",
            Ad="Metrekare",
            Deger="M2",
            Aciklama="Metrekare bazlı ölçü",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="KG",
            Ad="Kilogram",
            Deger="KG",
            Aciklama="Kilogram bazlı ağırlık",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="LT",
            Ad="Litre",
            Deger="LT",
            Aciklama="Litre bazlı hacim",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="PAKET",
            Ad="Paket",
            Deger="PAKET",
            Aciklama="Paket bazlı ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="SET",
            Ad="Set",
            Deger="SET",
            Aciklama="Set bazlı ücretlendirme",
            AktifMi=True
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="KM",
            Ad="Kilometre",
            Deger="KM",
            Aciklama="Kilometre bazlı mesafe",
            AktifMi=False
        ),
        Parametre(
            Kategori="BIRIM",
            Kod="MIL",
            Ad="Deniz Mili",
            Deger="MIL",
            Aciklama="Deniz mili (nautical mile)",
            AktifMi=True
        ),
        
        # PARA BİRİMLERİ
        Parametre(
            Kategori="PARA_BIRIMI",
            Kod="TRY",
            Ad="Türk Lirası",
            Deger="TRY",
            Aciklama="Türkiye Cumhuriyeti para birimi",
            AktifMi=True
        ),
        Parametre(
            Kategori="PARA_BIRIMI",
            Kod="USD",
            Ad="Amerikan Doları",
            Deger="USD",
            Aciklama="ABD Doları",
            AktifMi=True
        ),
        Parametre(
            Kategori="PARA_BIRIMI",
            Kod="EUR",
            Ad="Euro",
            Deger="EUR",
            Aciklama="Avrupa Birliği para birimi",
            AktifMi=True
        ),
        Parametre(
            Kategori="PARA_BIRIMI",
            Kod="GBP",
            Ad="İngiliz Sterlini",
            Deger="GBP",
            Aciklama="Birleşik Krallık para birimi",
            AktifMi=True
        ),
        
        # CARİ TİPLERİ
        Parametre(
            Kategori="CARI_TIP",
            Kod="GERCEK",
            Ad="Gerçek Kişi",
            Deger="GERCEK",
            Aciklama="Gerçek kişi cari tipi",
            AktifMi=True
        ),
        Parametre(
            Kategori="CARI_TIP",
            Kod="TUZEL",
            Ad="Tüzel Kişi",
            Deger="TUZEL",
            Aciklama="Tüzel kişi (şirket) cari tipi",
            AktifMi=True
        ),
        
        # CARİ ROLLERİ
        Parametre(
            Kategori="CARI_ROL",
            Kod="MUSTERI",
            Ad="Müşteri",
            Deger="MUSTERI",
            Aciklama="Müşteri rolü",
            AktifMi=True
        ),
        Parametre(
            Kategori="CARI_ROL",
            Kod="TEDARIKCI",
            Ad="Tedarikçi",
            Deger="TEDARIKCI",
            Aciklama="Tedarikçi rolü",
            AktifMi=True
        ),
        Parametre(
            Kategori="CARI_ROL",
            Kod="DIGER",
            Ad="Diğer",
            Deger="DIGER",
            Aciklama="Diğer cari rolleri",
            AktifMi=True
        ),
        
        # MOTORBOT DURUMLARI
        Parametre(
            Kategori="MOTORBOT_DURUM",
            Kod="AKTIF",
            Ad="Aktif",
            Deger="AKTIF",
            Aciklama="Motorbot aktif durumda",
            AktifMi=True
        ),
        Parametre(
            Kategori="MOTORBOT_DURUM",
            Kod="DURUM_BAKIM",
            Ad="Bakımda",
            Deger="BAKIM",
            Aciklama="Motorbot bakım durumunda",
            AktifMi=True
        ),
        Parametre(
            Kategori="MOTORBOT_DURUM",
            Kod="PASIF",
            Ad="Pasif",
            Deger="PASIF",
            Aciklama="Motorbot pasif durumda",
            AktifMi=True
        ),
        
        # SEFER DURUMLARI
        Parametre(
            Kategori="SEFER_DURUM",
            Kod="PLANLANDI",
            Ad="Planlandı",
            Deger="PLANLANDI",
            Aciklama="Sefer planlandı durumunda",
            AktifMi=True
        ),
        Parametre(
            Kategori="SEFER_DURUM",
            Kod="DEVAM_EDIYOR",
            Ad="Devam Ediyor",
            Deger="DEVAM_EDIYOR",
            Aciklama="Sefer devam ediyor",
            AktifMi=True
        ),
        Parametre(
            Kategori="SEFER_DURUM",
            Kod="TAMAMLANDI",
            Ad="Tamamlandı",
            Deger="TAMAMLANDI",
            Aciklama="Sefer tamamlandı",
            AktifMi=True
        ),
        Parametre(
            Kategori="SEFER_DURUM",
            Kod="IPTAL",
            Ad="İptal Edildi",
            Deger="IPTAL",
            Aciklama="Sefer iptal edildi",
            AktifMi=True
        ),
        
        # KDV ORANLARI
        Parametre(
            Kategori="KDV_ORANI",
            Kod="KDV_1",
            Ad="KDV %1",
            Deger="1",
            Aciklama="KDV oranı %1",
            AktifMi=True
        ),
        Parametre(
            Kategori="KDV_ORANI",
            Kod="KDV_10",
            Ad="KDV %10",
            Deger="10",
            Aciklama="KDV oranı %10",
            AktifMi=True
        ),
        Parametre(
            Kategori="KDV_ORANI",
            Kod="KDV_20",
            Ad="KDV %20",
            Deger="20",
            Aciklama="KDV oranı %20",
            AktifMi=True
        ),
        # Eski sistemden eklenenler
        Parametre(
            Kategori="KDV_ORANI",
            Kod="KDV_0",
            Ad="KDV %0",
            Deger="0",
            Aciklama="Sıfır KDV oranı",
            AktifMi=True
        ),
        Parametre(
            Kategori="KDV_ORANI",
            Kod="KDV_18",
            Ad="Eski Standart KDV %18",
            Deger="18",
            Aciklama="Eski standart KDV oranı (artık kullanılmıyor)",
            AktifMi=False
        ),
        
        # KDV İSTİSNALARI (Yeni Kategori)
        Parametre(
            Kategori="KDV_ISTISNA",
            Kod="NONE",
            Ad="İstisna Yok",
            Deger="NONE",
            Aciklama="KDV istisnası yok",
            AktifMi=True
        ),
        Parametre(
            Kategori="KDV_ISTISNA",
            Kod="17_4_G",
            Ad="KDVK 17/4-G - İhracat İstisnası",
            Deger="17/4-G",
            Aciklama="İhracat teslimi ve bu teslimlere ilişkin hizmetler",
            AktifMi=True
        ),
        Parametre(
            Kategori="KDV_ISTISNA",
            Kod="17_4_C",
            Ad="KDVK 17/4-C - Deniz Taşımacılığı",
            Deger="17/4-C",
            Aciklama="Deniz, hava ve demiryolu taşıma araçlarının tamir, bakım ve tadili",
            AktifMi=True
        ),
        Parametre(
            Kategori="KDV_ISTISNA",
            Kod="13_D",
            Ad="KDVK 13/D - Diğer İstisna",
            Deger="13/D",
            Aciklama="Diğer KDV istisnaları",
            AktifMi=True
        ),
        Parametre(
            Kategori="KDV_ISTISNA",
            Kod="17_4_A",
            Ad="KDVK 17/4-A - Transit Taşıma",
            Deger="17/4-A",
            Aciklama="Transit taşıma ve bu taşımalara ilişkin hizmetler",
            AktifMi=True
        ),
        
        # İŞ EMRİ TİPLERİ
        Parametre(
            Kategori="IS_EMRI_TIP",
            Kod="IS_EMRI_BAKIM",
            Ad="Bakım",
            Deger="BAKIM",
            Aciklama="Bakım iş emri",
            AktifMi=True
        ),
        Parametre(
            Kategori="IS_EMRI_TIP",
            Kod="IS_EMRI_ONARIM",
            Ad="Onarım",
            Deger="ONARIM",
            Aciklama="Onarım iş emri",
            AktifMi=True
        ),
        Parametre(
            Kategori="IS_EMRI_TIP",
            Kod="IS_EMRI_KURULUM",
            Ad="Kurulum",
            Deger="KURULUM",
            Aciklama="Kurulum iş emri",
            AktifMi=True
        ),
        Parametre(
            Kategori="IS_EMRI_TIP",
            Kod="IS_EMRI_MUAYENE",
            Ad="Muayene",
            Deger="MUAYENE",
            Aciklama="Muayene iş emri",
            AktifMi=True
        ),
        
        # İŞ EMRİ ÖNCELİK
        Parametre(
            Kategori="IS_EMRI_ONCELIK",
            Kod="DUSUK",
            Ad="Düşük",
            Deger="DUSUK",
            Aciklama="Düşük öncelik",
            AktifMi=True
        ),
        Parametre(
            Kategori="IS_EMRI_ONCELIK",
            Kod="NORMAL",
            Ad="Normal",
            Deger="NORMAL",
            Aciklama="Normal öncelik",
            AktifMi=True
        ),
        Parametre(
            Kategori="IS_EMRI_ONCELIK",
            Kod="YUKSEK",
            Ad="Yüksek",
            Deger="YUKSEK",
            Aciklama="Yüksek öncelik",
            AktifMi=True
        ),
        Parametre(
            Kategori="IS_EMRI_ONCELIK",
            Kod="ACIL",
            Ad="Acil",
            Deger="ACIL",
            Aciklama="Acil öncelik",
            AktifMi=True
        ),
        
        # SİSTEM PARAMETRELERİ
        Parametre(
            Kategori="SISTEM",
            Kod="FIRMA_ADI",
            Ad="Firma Adı",
            Deger="ALIAPORT LİMAN İŞLETMELERİ A.Ş.",
            Aciklama="Şirket resmi unvanı",
            AktifMi=True
        ),
        Parametre(
            Kategori="SISTEM",
            Kod="LIMAN_KODU",
            Ad="Liman Kodu",
            Deger="TRALV",
            Aciklama="Uluslararası liman kodu",
            AktifMi=True
        ),
        Parametre(
            Kategori="SISTEM",
            Kod="VARSAYILAN_VADE",
            Ad="Varsayılan Vade Günü",
            Deger="30",
            Aciklama="Yeni cari için varsayılan vade günü",
            AktifMi=True
        ),
        Parametre(
            Kategori="SISTEM",
            Kod="VARSAYILAN_PARA_BIRIMI",
            Ad="Varsayılan Para Birimi",
            Deger="TRY",
            Aciklama="Sistem varsayılan para birimi",
            AktifMi=True
        ),
        Parametre(
            Kategori="SISTEM",
            Kod="MAX_DOSYA_BOYUTU_MB",
            Ad="Maksimum Dosya Boyutu (MB)",
            Deger="50",
            Aciklama="Dijital arşiv için maksimum dosya boyutu",
            AktifMi=True
        ),
    ]
    
    db.add_all(parametreler)
    db.commit()
    print(f"✅ {len(parametreler)} parametre kaydı eklendi")
    
    # Kategori özeti
    from collections import Counter
    kategori_counts = Counter(p.Kategori for p in parametreler)
    print("\nKategori Özeti:")
    for kategori, count in sorted(kategori_counts.items()):
        print(f"  {kategori:25} : {count:2} parametre")
    
    db.close()


if __name__ == "__main__":
    print("\n" + "="*50)
    print("  ALIAPORT - PARAMETRE SEED")
    print("="*50 + "\n")
    
    try:
        seed_parametreler()
        
        print("\n" + "="*50)
        print("  ✅ PARAMETRELER YÜKLENDİ")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        import traceback
        traceback.print_exc()
