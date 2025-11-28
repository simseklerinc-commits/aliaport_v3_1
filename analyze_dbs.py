import sqlite3
import os

db_files = [
    "aliaport.db",  # ROOT
    "backend/aliaport.db",
    "backend/database/aliaport.db",
    "database/aliaport.db",
    "frontend/aliaport.db"
]

print("="*80)
print("VERITABANI DOSYALARI KARŞILAŞTIRMASI")
print("="*80)

for db_path in db_files:
    full_path = f"C:\\Aliaport\\Aliaport_v3_1\\{db_path}"
    
    if not os.path.exists(full_path):
        print(f"\n❌ {db_path}: DOSYA YOK")
        continue
    
    size = os.path.getsize(full_path)
    print(f"\n📄 {db_path}")
    print(f"   Size: {size} bytes")
    
    try:
        conn = sqlite3.connect(full_path)
        cur = conn.cursor()
        
        # Portal tabloları var mı?
        tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'portal_%'").fetchall()
        
        if not tables:
            print(f"   ⚠️  Portal tabloları YOK (Ana ÜRÜN veritabanı)")
            conn.close()
            continue
        
        # Cari ID'ler
        caris = cur.execute("SELECT DISTINCT cari_id FROM portal_employee ORDER BY cari_id").fetchall()
        emp_total = cur.execute("SELECT COUNT(*) FROM portal_employee").fetchone()[0]
        veh_total = cur.execute("SELECT COUNT(*) FROM portal_vehicle").fetchone()[0]
        
        print(f"   ✅ Portal tabloları mevcut")
        print(f"   📊 Cari IDs: {[c[0] for c in caris]}")
        print(f"   👥 Employees: {emp_total}")
        print(f"   🚗 Vehicles: {veh_total}")
        
        # Cari 238'i kontrol et
        if any(c[0] == 238 for c in caris):
            emp_238 = cur.execute("SELECT COUNT(*) FROM portal_employee WHERE cari_id=238").fetchone()[0]
            veh_238 = cur.execute("SELECT COUNT(*) FROM portal_vehicle WHERE cari_id=238").fetchone()[0]
            print(f"   🎯 Cari 238: {emp_238} employees, {veh_238} vehicles")
        
        conn.close()
        
    except Exception as e:
        print(f"   ❌ Hata: {e}")

print("\n" + "="*80)
