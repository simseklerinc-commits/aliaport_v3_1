"""
TCMB XML Debug Script
XML parse sorununu debug et
"""

import requests
import xml.etree.ElementTree as ET
import re

url = "https://www.tcmb.gov.tr/kurlar/today.xml"

print("Fetching TCMB XML...")
response = requests.get(url, timeout=10)
response.raise_for_status()

xml_content = response.text

print("=" * 60)
print("RAW XML (first 1000 chars):")
print("=" * 60)
print(xml_content[:1000])
print("=" * 60)

# Stylesheet kaldır
if "<?xml-stylesheet" in xml_content:
    xml_content = re.sub(r'<\?xml-stylesheet[^?]*\?>', '', xml_content)
    print("\n✅ Stylesheet directive removed")

print("\n" + "=" * 60)
print("CLEANED XML (first 1000 chars):")
print("=" * 60)
print(xml_content[:1000])
print("=" * 60)

# Parse dene
try:
    root = ET.fromstring(xml_content.encode('utf-8'))
    print("\n✅ XML parse başarılı!")
    print(f"Root tag: {root.tag}")
    print(f"Root attribs: {root.attrib}")
    
    # Currency elementlerini say
    currencies = root.findall("Currency")
    print(f"\n{len(currencies)} Currency element bulundu")
    
    # İlk currency'yi göster
    if currencies:
        first = currencies[0]
        print(f"\nİlk Currency: {first.get('Kod')}")
        for child in first:
            print(f"  {child.tag}: {child.text}")
except ET.ParseError as e:
    print(f"\n❌ XML Parse Error: {e}")
    print(f"Error line: {e.position[0]}, column: {e.position[1]}")
    
    # Hatalı satırı göster
    lines = xml_content.split('\n')
    if e.position[0] <= len(lines):
        print(f"\nHatalı satır ({e.position[0]}):")
        print(lines[e.position[0] - 1])
