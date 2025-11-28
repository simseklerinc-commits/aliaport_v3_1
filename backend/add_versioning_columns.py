import sqlite3

# Veritabanına bağlan
conn = sqlite3.connect('aliaport.db')
cursor = conn.cursor()

# Employee ile ilgili tabloları listele
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%employee%'")
tables = cursor.fetchall()
print("Employee tabloları:", tables)

# Eğer portal_employee_document tablosu varsa, kolonları göster
if ('portal_employee_document',) in tables:
    cursor.execute("PRAGMA table_info(portal_employee_document)")
    columns = cursor.fetchall()
    print("\nMevcut kolonlar:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    # Versiyonlama kolonlarını ekle
    try:
        print("\nVersiyonlama kolonları ekleniyor...")
        cursor.execute('ALTER TABLE portal_employee_document ADD COLUMN version INTEGER NOT NULL DEFAULT 1')
        print("✅ version kolonu eklendi")
    except sqlite3.OperationalError as e:
        print(f"⚠️ version: {e}")
    
    try:
        cursor.execute('ALTER TABLE portal_employee_document ADD COLUMN is_latest_version BOOLEAN NOT NULL DEFAULT 1')
        print("✅ is_latest_version kolonu eklendi")
    except sqlite3.OperationalError as e:
        print(f"⚠️ is_latest_version: {e}")
    
    try:
        cursor.execute('ALTER TABLE portal_employee_document ADD COLUMN previous_version_id INTEGER')
        print("✅ previous_version_id kolonu eklendi")
    except sqlite3.OperationalError as e:
        print(f"⚠️ previous_version_id: {e}")
    
    conn.commit()
    
    # Güncellenmiş kolonları göster
    cursor.execute("PRAGMA table_info(portal_employee_document)")
    columns = cursor.fetchall()
    print("\nGüncellenmiş kolonlar:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
else:
    print("⚠️ portal_employee_document tablosu bulunamadı")

conn.close()
print("\n✅ İşlem tamamlandı")
