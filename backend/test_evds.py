"""EVDS Client Test Script"""
import os
from dotenv import load_dotenv
load_dotenv()

from aliaport_api.integrations.evds_client import EVDSClient
from datetime import date

print("=" * 60)
print("EVDS API TEST (Hafta Sonu/Tatil Desteği)")
print("=" * 60)

# EVDS client test
evds = EVDSClient()
print(f'🔑 EVDS API Key: {evds.api_key[:8]}...')

# Connection test
print('\n📡 EVDS bağlantı testi (auto_fallback=True)...')
if evds.test_connection():
    print('✅ EVDS API bağlantı başarılı\n')
    
    # Bugünkü kurları çek (otomatik hafta sonu/tatil kontrolü)
    print('📊 Kurlar çekiliyor (auto fallback aktif)...')
    try:
        kurlar = evds.get_daily_rates(auto_fallback=True)
        
        if kurlar:
            print(f"\n✅ {len(kurlar)} kur alındı\n")
            for kur in kurlar:
                print(f"  {kur['doviz_kodu']}: Alış={kur.get('alis', 0):.4f}, Satış={kur.get('satis', 0):.4f}")
                print(f"    → Tarih: {kur.get('tarih', 'N/A')}")
        else:
            print("\n⚠️  Kur verisi alınamadı")
    except Exception as e:
        print(f'\n❌ Kur çekme hatası: {e}')
else:
    print('❌ EVDS bağlantı başarısız')
    print('\n💡 Not: EVDS API geçici down olabilir veya hafta sonu olabilir.')
    print('   Sistem otomatik olarak TCMB XML fallback kullanacak.')

print("\n" + "=" * 60)
