"""
CARİ TABLO GÜNCELLEMESİ
Eksik alanları ekle: IletisimKisi, Notlar, CreatedBy, UpdatedBy
"""

import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "database", "aliaport.db")

def add_cari_fields():
    """Cari tablosuna eksik alanları ekle"""
def add_cari_fields():
    """Cari tablosuna eksik alanları ekle"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(Cari)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        print("📊 Mevcut Cari sütunları:")
        for col in existing_columns:
            print(f"  • {col}")
        
        # Add missing columns
        columns_to_add = []
        
        if 'IletisimKisi' not in existing_columns:
            columns_to_add.append(("IletisimKisi", "VARCHAR(100)"))
        
        if 'Notlar' not in existing_columns:
            columns_to_add.append(("Notlar", "VARCHAR(1000)"))
        
        if 'CreatedBy' not in existing_columns:
            columns_to_add.append(("CreatedBy", "INTEGER"))
        
        if 'UpdatedBy' not in existing_columns:
            columns_to_add.append(("UpdatedBy", "INTEGER"))
        
        if not columns_to_add:
            print("\n✅ Tüm sütunlar zaten mevcut!")
            return
        
        print(f"\n🔧 Eklenecek {len(columns_to_add)} sütun:")
        for col_name, col_type in columns_to_add:
            print(f"  • {col_name} ({col_type})")
            cursor.execute(f"ALTER TABLE Cari ADD COLUMN {col_name} {col_type}")
        
        conn.commit()
        print("\n✅ Cari tablosu başarıyla güncellendi!")
        
        # Verify
        cursor.execute("PRAGMA table_info(Cari)")
        print("\n📊 Güncel Cari sütunları:")
        for row in cursor.fetchall():
            print(f"  • {row[1]} ({row[2]})")
    
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("CARİ TABLO GÜNCELLEMESİ")
    print("=" * 50)
    
    add_cari_fields()
    
    print("\n" + "=" * 50)
    print("İŞLEM TAMAMLANDI")
    print("=" * 50)
