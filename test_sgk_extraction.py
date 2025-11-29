#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SGK PDF Extraction Test Script
Bu script SGK PDF'inden isim çıkarma işlemini test eder.
"""

import sys
import os
import re
from io import BytesIO

# Backend path'i ekle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from pdfminer.high_level import extract_text

TC_REGEX = re.compile(r'\b\d{11}\b')

def extract_sgk_employees(file_bytes: bytes) -> dict[str, str]:
    """
    SGK PDF'inden çalışan bilgilerini çıkar - Çoklu format desteği.
    """
    try:
        text = extract_text(BytesIO(file_bytes))
    except Exception as e:
        print(f"❌ PDF extract HATA: {e}")
        return {}
    
    if not text:
        print("⚠️ PDF boş text döndü")
        return {}
    
    result = {}
    lines = text.split('\n')
    print(f"📄 SGK PDF parsing: {len(lines)} satır bulundu\n")
    
    # Debug: İlk 15 satırı göster
    print("=" * 100)
    print("İLK 15 SATIR:")
    print("=" * 100)
    for i, line in enumerate(lines[:15], 1):
        print(f"{i:3d}: {line[:120]}")
    print()
    
    tc_count = 0
    
    for line in lines:
        original_line = line
        line = line.strip()
        if not line:
            continue
        
        # TC numarası ara (11 haneli)
        tc_match = TC_REGEX.search(line)
        if not tc_match:
            continue
        
        tc_count += 1
        tc_no = tc_match.group(0)
        tc_start = tc_match.start()
        tc_end = tc_match.end()
        
        # TC'den sonraki kısmı al (Ad ve Soyad sütunları TC'den SONRA olabilir)
        after_tc = line[tc_end:].strip()
        # TC'den önceki kısmı al
        before_tc = line[:tc_start].strip()
        
        full_name = ""
        strategy = ""
        
        # STRATEJI 1: TC'den SONRA 2 kelime varsa (Adı | Soyadı formatı)
        after_parts = after_tc.split()
        if len(after_parts) >= 2:
            name_parts = after_parts[:2]
            name_parts = [p for p in name_parts if p.isalpha() or any(c.isalpha() for c in p)]
            if len(name_parts) >= 2:
                full_name = " ".join(name_parts).strip()
                strategy = "STRATEJI-1 (TC Sonrası)"
        
        # STRATEJI 2: TC öncesinde kelimeler varsa
        if not full_name:
            before_parts = before_tc.split()
            before_parts = [p for p in before_parts if not p.isdigit()]
            name_candidates = [p for p in before_parts if any(c.isalpha() for c in p)]
            
            if len(name_candidates) >= 2:
                full_name = " ".join(name_candidates[-2:]).strip()
                strategy = "STRATEJI-2 (TC Öncesi)"
            elif len(name_candidates) == 1:
                full_name = name_candidates[0].strip()
                strategy = "STRATEJI-2 (Tek Kelime)"
        
        # STRATEJI 3: Fallback
        if not full_name:
            all_parts = before_tc.split() + after_parts
            name_candidates = [
                p for p in all_parts 
                if len(p) >= 2 and any(c.isalpha() for c in p) and not p.isdigit()
            ]
            
            if len(name_candidates) >= 2:
                full_name = " ".join(name_candidates[:2]).strip()
                strategy = "STRATEJI-3 (Fallback)"
            elif len(name_candidates) == 1:
                full_name = name_candidates[0].strip()
                strategy = "STRATEJI-3 (Tek Kelime)"
        
        # Türkçe karakter düzeltmeleri
        if full_name:
            full_name = full_name.replace('î', 'İ').replace('Î', 'İ')
            full_name = full_name.replace('û', 'Ü').replace('Û', 'Ü')
            
        # İlk 10 kaydı detaylı göster
        if tc_count <= 10:
            print(f"\n📋 KAYIT #{tc_count}")
            print(f"   Satır: {original_line[:100]}")
            print(f"   TC: {tc_no}")
            print(f"   Before TC: [{before_tc[:50]}]")
            print(f"   After TC: [{after_tc[:50]}]")
            print(f"   ✅ İsim: {full_name} ({strategy})")
        
        # En az 3 karakter kontrolü
        if len(full_name) >= 3:
            result[tc_no] = full_name
        else:
            result[tc_no] = ""
    
    return result


if __name__ == "__main__":
    pdf_path = r'ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf'
    
    print("=" * 100)
    print("SGK PDF EXTRACTION TEST")
    print("=" * 100)
    print(f"PDF: {pdf_path}\n")
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF bulunamadı: {pdf_path}")
        sys.exit(1)
    
    with open(pdf_path, 'rb') as f:
        file_bytes = f.read()
    
    print(f"📦 Dosya boyutu: {len(file_bytes):,} bytes\n")
    
    employees = extract_sgk_employees(file_bytes)
    
    print("\n" + "=" * 100)
    print("SONUÇLAR")
    print("=" * 100)
    
    successful = sum(1 for v in employees.values() if v)
    total = len(employees)
    
    print(f"\n✅ Toplam TC: {total}")
    print(f"✅ İsimli kayıt: {successful} ({successful*100//total if total else 0}%)")
    print(f"⚠️  İsimsiz kayıt: {total - successful}")
    
    print("\n" + "=" * 100)
    print("TÜM KAYITLAR:")
    print("=" * 100)
    
    for i, (tc, name) in enumerate(employees.items(), 1):
        status = "✅" if name else "⚠️ "
        print(f"{i:3d}. {status} TC: {tc} => İSİM: [{name}]")
    
    print("\n" + "=" * 100)
    print("TEST TAMAMLANDI!")
    print("=" * 100)
