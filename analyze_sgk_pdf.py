#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SGK PDF formatını analiz et
"""
import sys
import os

# Backend modüllerini kullan
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from pdfminer.high_level import extract_text
import re

def main():
    pdf_path = "ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf"
    
    print(f"PDF: {pdf_path}")
    print(f"Exists: {os.path.exists(pdf_path)}\n")
    
    if not os.path.exists(pdf_path):
        print("HATA: PDF bulunamadı!")
        return
    
    # PDF'yi oku
    with open(pdf_path, 'rb') as f:
        file_bytes = f.read()
    
    from io import BytesIO
    text = extract_text(BytesIO(file_bytes))
    
    lines = text.split('\n')
    print(f"TOPLAM SATIR SAYISI: {len(lines)}\n")
    
    print("="*100)
    print("İLK 100 SATIR:")
    print("="*100)
    for i, line in enumerate(lines[:100], 1):
        # Sadece boş olmayan satırları göster
        if line.strip():
            print(f"{i:4d}: {line}")
    
    print("\n" + "="*100)
    print("TC NUMARALI SATIRLAR (İlk 25):")
    print("="*100)
    
    TC_REGEX = re.compile(r'\b\d{11}\b')
    count = 0
    
    for i, line in enumerate(lines, 1):
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        tc_match = TC_REGEX.search(line_stripped)
        if tc_match:
            tc_no = tc_match.group(0)
            before_tc = line_stripped[:tc_match.start()]
            after_tc = line_stripped[tc_match.end():]
            
            print(f"\nSATIR {i}:")
            print(f"  TAM: {line_stripped[:120]}")
            print(f"  TC ÖNCESI: [{before_tc}]")
            print(f"  TC: {tc_no}")
            print(f"  TC SONRASI: [{after_tc[:60]}]")
            
            # İsim extraction dene
            parts = before_tc.split()
            if parts and parts[0].isdigit():
                parts = parts[1:]
            full_name = " ".join(parts).strip()
            print(f"  EXTRACTED NAME: [{full_name}]")
            
            count += 1
            if count >= 25:
                break
    
    print(f"\n\nTOPLAM TC BULUNDU: {count}")

if __name__ == '__main__':
    main()
