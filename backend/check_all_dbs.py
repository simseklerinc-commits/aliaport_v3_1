import sqlite3
import os

# Tüm .db dosyalarını kontrol et
db_files = [
    "database/aliaport.db",
    "aliaport.db",
    "../aliaport.db"
]

print("=" * 80)
print("VERITABANI DOSYALARI VE İÇERİKLERİ")
print("=" * 80)

for db_path in db_files:
    full_path = os.path.join(os.getcwd(), db_path)
    if not os.path.exists(full_path):
        print(f"\n❌ {db_path}: YOK")
        continue
    
    size = os.path.getsize(full_path)
    print(f"\n✓ {db_path} ({size:,} bytes)")
    
    try:
        conn = sqlite3.connect(full_path)
        cursor = conn.cursor()
        
        # Tüm tabloları listele
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            if count > 0:
                print(f"  📊 {table_name}: {count} kayıt")
        
        conn.close()
    except Exception as e:
        print(f"  ❌ Hata: {e}")

print("\n" + "=" * 80)
