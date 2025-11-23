"""
TCMB Client Direct Test
TCMBClient class'ı direkt kullan
"""

import sys
import os
import logging
from datetime import date

# Logger config
logging.basicConfig(level=logging.DEBUG, format='%(levelname)s - %(message)s')

sys.path.insert(0, os.path.dirname(__file__))

from aliaport_api.integrations.tcmb_client import TCMBClient

print("Creating TCMBClient instance...")
client = TCMBClient()

print("Calling get_daily_rates()...")
try:
    rates = client.get_daily_rates(date.today())
    print(f"\n✅ Success! Got {len(rates)} rates:")
    for code, rate in rates.items():
        print(f"  {code}: {rate}")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
