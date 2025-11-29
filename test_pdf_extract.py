from pdfminer.high_level import extract_text
import re
import sys

# Türkçe karakter desteği için encoding ayarla
sys.stdout.reconfigure(encoding='utf-8')

# PDF'yi oku
pdf_path = 'ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf'
print(f"PDF okunuyor: {pdf_path}")
text = extract_text(pdf_path)

# İlk 60 satırı göster
lines = text.split('\n')
print("=" * 80)
print(f"TOPLAM SATIR SAYISI: {len(lines)}")
print("=" * 80)
print("PDF İÇERİĞİ (İlk 60 satır):")
print("=" * 80)
for i, line in enumerate(lines[:60], 1):
    print(f'{i:3d}: {line}')

print("\n" + "=" * 80)
print("TC NUMARASI İÇEREN İLK 15 SATIR:")
print("=" * 80)

TC_REGEX = re.compile(r'\b\d{11}\b')
count = 0
for i, line in enumerate(lines, 1):
    tc_match = TC_REGEX.search(line)
    if tc_match:
        tc_no = tc_match.group(0)
        before_tc = line[:tc_match.start()]
        print(f'\nSATIR {i}:')
        print(f'  TAM SATIR: {line}')
        print(f'  TC NO: {tc_no}')
        print(f'  TC ÖNCESI: [{before_tc}]')
        count += 1
        if count >= 15:
            break

print("\n" + "=" * 80)
print("EXTRACTION TEST:")
print("=" * 80)

# Fonksiyonu simüle et
result = {}
for line in lines:
    line = line.strip()
    if not line:
        continue
    
    tc_match = TC_REGEX.search(line)
    if not tc_match:
        continue
    
    tc_no = tc_match.group(0)
    before_tc = line[:tc_match.start()].strip()
    
    parts = before_tc.split()
    if not parts:
        result[tc_no] = ""
        continue
    
    if parts[0].isdigit():
        parts = parts[1:]
    
    full_name = " ".join(parts).strip()
    
    if len(full_name) >= 3:
        result[tc_no] = full_name
    else:
        result[tc_no] = ""

print(f"\nTOPLAM {len(result)} TC BULUNDU")
print("\nİLK 20 KAYIT:")
for i, (tc, name) in enumerate(list(result.items())[:20], 1):
    print(f'{i:2d}. TC: {tc} => İSİM: [{name}]')

