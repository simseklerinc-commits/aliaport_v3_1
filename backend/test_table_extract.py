"""
PDF'i TABLO olarak oku - pdfplumber kullanarak (EN İYİ YÖNTEM)
"""
import pdfplumber
import re

PDF_PATH = r"c:\Aliaport\Aliaport_v3_1\ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf"
TC_REGEX = re.compile(r'\b\d{11}\b')

print("=" * 100)
print("PDF PLUMBER ile TABLO OKUMA")
print("=" * 100)

with pdfplumber.open(PDF_PATH) as pdf:
    print(f"\n📄 {len(pdf.pages)} sayfa bulundu\n")
    
    all_employees = []
    
    for page_num, page in enumerate(pdf.pages, 1):
        print(f"\n{'='*100}")
        print(f"SAYFA #{page_num}")
        print(f"{'='*100}")
        
        # Tabloları extract et
        tables = page.extract_tables()
        
        print(f"📊 {len(tables)} tablo bulundu")
        
        for table_num, table in enumerate(tables):
            if not table:
                continue
            
            print(f"\nTablo #{table_num+1}: {len(table)} satır, {len(table[0]) if table else 0} sütun")
            
            # Header'ı bul
            header = table[0] if table else []
            print(f"Header: {header}")
            
            # TC, Ad, Soyad sütunlarını bul
            tc_col_idx = None
            ad_col_idx = None
            soyad_col_idx = None
            
            for idx, col_name in enumerate(header):
                col_str = str(col_name).lower() if col_name else ""
                if 'güvenlik' in col_str or 'tc' in col_str or 's.g' in col_str:
                    tc_col_idx = idx
                    print(f"✅ TC sütunu bulundu: İndeks {idx} ({col_name})")
                elif 'adı' in col_str or 'ad' == col_str:
                    ad_col_idx = idx
                    print(f"✅ AD sütunu bulundu: İndeks {idx} ({col_name})")
                elif 'soyad' in col_str:
                    soyad_col_idx = idx
                    print(f"✅ SOYAD sütunu bulundu: İndeks {idx} ({col_name})")
            
            # Veri satırlarını işle (header hariç)
            for row_num, row in enumerate(table[1:], 1):
                if tc_col_idx is not None and ad_col_idx is not None and soyad_col_idx is not None:
                    if len(row) > max(tc_col_idx, ad_col_idx, soyad_col_idx):
                        tc = str(row[tc_col_idx] or "").strip()
                        ad = str(row[ad_col_idx] or "").strip()
                        soyad = str(row[soyad_col_idx] or "").strip()
                        
                        # TC kontrolü
                        if TC_REGEX.match(tc):
                            full_name = f"{ad} {soyad}".strip().upper()
                            all_employees.append((tc, full_name))
                            
                            if row_num <= 5:
                                print(f"  {row_num}. {tc} => {full_name}")

print(f"\n\n{'='*100}")
print(f"✅ TOPLAM {len(all_employees)} ÇALIŞAN BULUNDU")
print(f"{'='*100}")

# İlk 10 ve bilinen hatalı kaydı göster
print("\nİlk 10 çalışan:")
for tc, name in all_employees[:10]:
    print(f"  {tc}: {name}")

# 62293189886 kontrolü
print("\n🔍 62293189886 TC kontrolü:")
for tc, name in all_employees:
    if tc == "62293189886":
        print(f"  ✅ BULUNDU: {tc} => {name}")
        if "ADEM" in name and "MIHCI" in name:
            print("  ✅ DOĞRU: ADEM MIHCI")
        elif "ADEM" in name and "ÇOLAK" in name:
            print("  ❌ HATALI: ADEM ÇOLAK (olmamalı!)")
        break

