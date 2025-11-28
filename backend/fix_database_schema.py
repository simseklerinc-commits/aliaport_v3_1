"""
Veritabanı Şemasını Düzelt
- User tablosu oluştur
- Eksik kolonları ekle (approved_at, is_active, created_by, updated_by)
"""
import sqlite3
from pathlib import Path

db_path = Path("database/aliaport.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("🔧 VERİTABANI ŞEMASI DÜZELTİLİYOR")
print("=" * 60)

try:
    # 1. User tablosu oluştur (eğer yoksa)
    print("\n1️⃣ User tablosu kontrol ediliyor...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            full_name VARCHAR(200),
            role VARCHAR(50) DEFAULT 'user',
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME
        )
    """)
    print("   ✅ User tablosu hazır")
    
    # 2. work_order_person tablosuna eksik kolonları ekle
    print("\n2️⃣ work_order_person tablosuna kolonlar ekleniyor...")
    
    # Mevcut kolonları kontrol et
    cursor.execute("PRAGMA table_info(work_order_person)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    
    columns_to_add = [
        ("approved_at", "DATETIME"),
        ("is_active", "BOOLEAN DEFAULT 1"),
        ("created_by", "INTEGER"),
        ("updated_by", "INTEGER")
    ]
    
    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            cursor.execute(f"ALTER TABLE work_order_person ADD COLUMN {col_name} {col_type}")
            print(f"   ✅ {col_name} eklendi")
        else:
            print(f"   ⏭️  {col_name} zaten var")
    
    conn.commit()
    
    print("\n" + "=" * 60)
    print("✅ VERİTABANI ŞEMASI DÜZELTİLDİ!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ HATA: {e}")
    conn.rollback()
finally:
    conn.close()
