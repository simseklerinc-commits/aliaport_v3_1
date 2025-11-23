"""
TCMB/EVDS Client Test
Gerçek API'den kur çekmeyi test et
"""

import sys
from pathlib import Path
import asyncio
from datetime import date

# Backend path'i ekle
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from aliaport_api.integrations import TCMBClient, EVDSClient
import os


async def test_tcmb_client():
    """TCMB client test"""
    print("=" * 60)
    print("TCMB Client Test")
    print("=" * 60)
    
    client = TCMBClient()
    
    try:
        # Bugünkü kurları çek
        rates = client.get_daily_rates()
        
        print(f"\n✅ TCMB'den {len(rates)} kur alındı:\n")
        for rate in rates:
            print(f"{rate['doviz_kodu']:>4}: "
                  f"Alış={rate['alis']:>7.4f} | "
                  f"Satış={rate['satis']:>7.4f} | "
                  f"Efektif Alış={rate['efektif_alis']:>7.4f} | "
                  f"Efektif Satış={rate['efektif_satis']:>7.4f}")
        
        print("\n" + "=" * 60)
        return True
    
    except Exception as e:
        print(f"\n❌ TCMB Client hatası: {e}")
        print("=" * 60)
        return False


async def test_evds_client():
    """EVDS client test"""
    print("\n" + "=" * 60)
    print("EVDS Client Test")
    print("=" * 60)
    
    # EVDS API key kontrolü
    api_key = os.getenv("EVDS_API_KEY")
    if not api_key:
        print("\n⚠️  EVDS_API_KEY environment variable yok")
        print("EVDS test atlanıyor...")
        print("=" * 60)
        return None
    
    client = EVDSClient(api_key=api_key)
    
    try:
        # Bugünkü kurları çek
        rates = client.get_daily_rates()
        
        print(f"\n✅ EVDS'den {len(rates)} kur alındı:\n")
        for rate in rates:
            print(f"{rate['doviz_kodu']:>4}: "
                  f"Alış={rate['alis']:>7.4f} | "
                  f"Satış={rate['satis']:>7.4f} | "
                  f"Efektif Alış={rate['efektif_alis']:>7.4f} | "
                  f"Efektif Satış={rate['efektif_satis']:>7.4f}")
        
        print("\n" + "=" * 60)
        return True
    
    except Exception as e:
        print(f"\n❌ EVDS Client hatası: {e}")
        print("=" * 60)
        return False


async def test_fallback_logic():
    """TCMB → EVDS fallback logic test"""
    print("\n" + "=" * 60)
    print("Fallback Logic Test (TCMB → EVDS)")
    print("=" * 60)
    
    # TCMB dene
    print("\n1️⃣  TCMB deneniyor...")
    tcmb_success = await test_tcmb_client()
    
    if not tcmb_success:
        print("\n2️⃣  TCMB başarısız, EVDS fallback...")
        evds_success = await test_evds_client()
        
        if evds_success:
            print("\n✅ Fallback başarılı (EVDS)")
        else:
            print("\n❌ Her iki API de başarısız")
    else:
        print("\n✅ TCMB başarılı, EVDS fallback'e gerek yok")
    
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_fallback_logic())
