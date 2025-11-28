import sqlite3

conn = sqlite3.connect('database/aliaport.db')
c = conn.cursor()

print("=" * 80)
print("CARİ KONTROL")
print("=" * 80)

# Cari 238 ve benzer kartları kontrol et
c.execute("""
SELECT Id, Unvan FROM Cari 
WHERE Id IN (1, 238) 
   OR Unvan LIKE '%Test%'
   OR Unvan LIKE '%test%'
ORDER BY Id LIMIT 10
""")
rows = c.fetchall()
print("\nCari Seçenekleri:")
for row in rows:
    print(f"  Id={row[0]}: {row[1]}")

# Portal ile bağlantılı cariyi kontrol et
print("\nPortal Employee kullanan Cari:")
c.execute('SELECT DISTINCT cari_id FROM portal_employee ORDER BY cari_id')
caris = c.fetchall()
for cari in caris:
    c.execute('SELECT Unvan FROM Cari WHERE Id = ?', (cari[0],))
    unvan = c.fetchone()
    if unvan:
        print(f"  cari_id={cari[0]}: {unvan[0]}")
    else:
        print(f"  cari_id={cari[0]}: [BULUNAMADI]")

# Portal Vehicle kullanan Cari
print("\nPortal Vehicle kullanan Cari:")
c.execute('SELECT DISTINCT cari_id FROM portal_vehicle ORDER BY cari_id')
caris = c.fetchall()
for cari in caris:
    c.execute('SELECT Unvan FROM Cari WHERE Id = ?', (cari[0],))
    unvan = c.fetchone()
    if unvan:
        print(f"  cari_id={cari[0]}: {unvan[0]}")
    else:
        print(f"  cari_id={cari[0]}: [BULUNAMADI]")

print("\n" + "=" * 80)
conn.close()
