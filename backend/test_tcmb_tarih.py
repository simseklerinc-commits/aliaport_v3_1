"""TCMB Test - Manuel Tarih Kontrolü"""
from datetime import date, timedelta
from aliaport_api.integrations.tcmb_client import TCMBClient

print("=" * 60)
print("TCMB Tarih Kontrolü")
print("=" * 60)

tcmb = TCMBClient()

# Bugün
today = date.today()
print(f"\n📅 Bugün: {today} ({['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][today.weekday()]})")

# Son yayınlanan tarihi bul
last_published = tcmb._find_last_published_date(today)
print(f"📅 TCMB Son Yayın Tarihi: {last_published} ({['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][last_published.weekday()]})")

# URL oluştur
url = tcmb.get_today_url()
print(f"\n🌐 TCMB URL: {url}")

# Manuel kur çekmeyi dene (auto_fallback=False ile)
print(f"\n📊 Cuma tarihli kur çekmeyi deneyelim...")
try:
    # Cuma tarihi (22 Kasım 2025)
    friday = date(2025, 11, 22)
    print(f"   Tarih: {friday}")
    
    kurlar = tcmb.get_daily_rates(target_date=friday, auto_fallback=False)
    
    if kurlar:
        print(f"\n✅ {len(kurlar)} kur alındı (Cuma günü)\n")
        for kur in kurlar[:3]:  # İlk 3 kur
            print(f"  {kur['doviz_kodu']}: Alış={kur.get('alis', 0):.4f}")
    else:
        print("\n❌ Kur alınamadı")
        
except Exception as e:
    print(f"\n❌ Hata: {e}")

print("\n" + "=" * 60)
