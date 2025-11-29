"""
PDF'deki gerçek satır yapısını analiz et - TC bazlı
"""
from pdfminer.high_level import extract_text
from pathlib import Path
import re

PDF_PATH = r"c:\Aliaport\Aliaport_v3_1\ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf"
TC_REGEX = re.compile(r'\b\d{11}\b')

# Bilinen doğru eşleşmeler
KNOWN_MATCHES = {
    '10394395958': 'BARAN HARRY ŞİMŞEK',
    '10826544718': 'MELİKE KAYA',
    '16031796980': 'CAN DOĞAN',
    '34882827776': 'SERKAN RECEPKETHİDA'
}

with open(PDF_PATH, 'rb') as f:
    text = extract_text(f)

lines = text.split('\n')

print(f"TOPLAM SATIR: {len(lines)}\n")
print("=" * 100)

# Her TC için offset'leri test et
for tc_no, expected_name in KNOWN_MATCHES.items():
    print(f"\n{'='*100}")
    print(f"🎯 ARANAN: TC {tc_no} => {expected_name}")
    print(f"{'='*100}")
    
    # TC'yi bul
    for i, line in enumerate(lines):
        if tc_no in line.strip():
            print(f"\n✅ TC BULUNDU - Satır {i}: {repr(line.strip())}\n")
            
            # Önceki ve sonraki 10 satırı göster
            for offset in range(-5, 11):
                idx = i + offset
                if 0 <= idx < len(lines):
                    marker = "⭐ TC" if offset == 0 else ""
                    content = lines[idx].strip()
                    
                    # Beklenen kelimeleri vurgula
                    highlight = ""
                    for word in expected_name.split():
                        if word.upper() in content.upper():
                            highlight = f" 🔥 {word}"
                            break
                    
                    print(f"   [{idx:3d}] offset={offset:+2d}: {repr(content[:80]):<85} {marker}{highlight}")
            
            break
    
    print()

print(f"\n{'='*100}")
print("PATTERN ANALİZİ TAMAMLANDI")

