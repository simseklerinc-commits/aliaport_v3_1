"""TCMB XML Client Test Script"""
import os
from dotenv import load_dotenv
load_dotenv()

from aliaport_api.integrations.tcmb_client import TCMBClient
from datetime import date

print("=" * 60)
print("TCMB XML API TEST (Hafta Sonu/Tatil Desteği)")
print("=" * 60)

# TCMB client test
tcmb = TCMBClient()

try:
    # Bugünkü kurları çek (auto_fallback=True ile)
    print('\n📊 TCMB XML - Kurlar çekiliyor (auto fallback aktif)...')
    kurlar = tcmb.get_daily_rates(auto_fallback=True)
    
    print(f"\n✅ Başarılı! {len(kurlar)} kur alındı\n")
    
    for kur in kurlar:
        print(f"  {kur['doviz_kodu']}: Alış={kur.get('alis', 0):.4f}, Satış={kur.get('satis', 0):.4f}")
    
    print("\n" + "=" * 60)
    print("✅ TCMB XML API çalışıyor (hafta sonu/tatil desteği aktif)")
    print("=" * 60)
    
except Exception as e:
    print(f'\n❌ TCMB XML hatası: {e}')
    print("\n💡 Not: TCMB XML API'si hafta sonları ve resmi tatillerde")
    print("   son yayınlanan iş günü kurunu döndürür.")
    print("   Pazartesi günü Cuma kurunu kullanır.")
    print("\n" + "=" * 60)
