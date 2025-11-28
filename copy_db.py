import sqlite3
from datetime import datetime
import shutil

# backend/aliaport.db'den database/aliaport.db'ye kopyala
src = "backend/aliaport.db"
dst = "database/aliaport.db"

print(f"Copying {src} to {dst}...")
shutil.copy2(src, dst)
print("✅ Veritabanı kopyalandı!")

# Kontrol
conn = sqlite3.connect(dst)
cur = conn.cursor()

emp_count = cur.execute("SELECT COUNT(*) FROM portal_employee WHERE cari_id=238").fetchone()[0]
veh_count = cur.execute("SELECT COUNT(*) FROM portal_vehicle WHERE cari_id=238").fetchone()[0]
user = cur.execute("SELECT id, email, cari_id FROM portal_user WHERE id=2").fetchone()

print(f"\n=== database/aliaport.db İÇERİĞİ ===")
print(f"Portal User: id={user[0]}, email={user[1]}, cari_id={user[2]}")
print(f"Employees: {emp_count} adet (cari_id=238)")
print(f"Vehicles: {veh_count} adet (cari_id=238)")

conn.close()
