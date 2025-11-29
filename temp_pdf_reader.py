import sys
sys.path.insert(0, "backend")
from pdfminer.high_level import extract_text
import re

pdf_path = "ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf"
text = extract_text(pdf_path)
lines = text.split("\n")

print(f"TOPLAM SATIR: {len(lines)}")
print("\n" + "="*80)
print("İLK 100 SATIR:")
print("="*80)
for i, line in enumerate(lines[:100], 1):
    print(f"{i:3d}: {line}")

print("\n" + "="*80)
print("TC NUMARALI İLK 20 SATIR:")
print("="*80)
TC_REGEX = re.compile(r"\b\d{11}\b")
count = 0
for i, line in enumerate(lines, 1):
    if TC_REGEX.search(line):
        print(f"{i:4d}: {line}")
        count += 1
        if count >= 20:
            break
