#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from pdfminer.high_level import extract_text
import re

pdf_path = r'ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf'

try:
    with open('pdf_debug.txt', 'w', encoding='utf-8') as f:
        f.write(f"PDF PATH: {pdf_path}\n")
        f.write(f"EXISTS: {os.path.exists(pdf_path)}\n\n")
        
        if not os.path.exists(pdf_path):
            f.write("PDF BULUNAMADI!\n")
        else:
            text = extract_text(pdf_path)
            lines = text.split('\n')
            
            f.write(f"TOPLAM SATIR: {len(lines)}\n")
            f.write("=" * 80 + "\n")
            f.write("İLK 80 SATIR:\n")
            f.write("=" * 80 + "\n")
            
            for i, line in enumerate(lines[:80], 1):
                f.write(f'{i:3d}: {line}\n')
            
            f.write("\n" + "=" * 80 + "\n")
            f.write("TC NUMARALI SATIRLAR (İlk 20):\n")
            f.write("=" * 80 + "\n")
            
            TC_REGEX = re.compile(r'\b\d{11}\b')
            count = 0
            for i, line in enumerate(lines, 1):
                if TC_REGEX.search(line):
                    f.write(f'{i:4d}: {line}\n')
                    count += 1
                    if count >= 20:
                        break
    
    print("BAŞARILI! pdf_debug.txt dosyasına yazıldı")
    
except Exception as e:
    with open('pdf_error.txt', 'w', encoding='utf-8') as f:
        f.write(f"HATA: {e}\n")
        import traceback
        traceback.print_exc(file=f)
    print(f"HATA OLUŞTU! pdf_error.txt'ye bakın")
