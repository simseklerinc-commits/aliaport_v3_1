import sqlite3
conn = sqlite3.connect('database/aliaport.db')
c = conn.cursor()

print("Portal verisi Cari 1'e taşınıyor...")
c.execute('UPDATE portal_employee SET cari_id = 1 WHERE cari_id = 238')
print(f"✓ Portal Employee: {c.rowcount} güncellendi")

c.execute('UPDATE portal_vehicle SET cari_id = 1 WHERE cari_id = 238')
print(f"✓ Portal Vehicle: {c.rowcount} güncellendi")

conn.commit()

# Doğrula
c.execute('SELECT cari_id, COUNT(*) FROM portal_employee GROUP BY cari_id')
print("\nPortal Employee by cari_id:")
for row in c.fetchall():
    print(f"  cari_id={row[0]}: {row[1]} kayıt")

c.execute('SELECT cari_id, COUNT(*) FROM portal_vehicle GROUP BY cari_id')
print("Portal Vehicle by cari_id:")
for row in c.fetchall():
    print(f"  cari_id={row[0]}: {row[1]} kayıt")

conn.close()
