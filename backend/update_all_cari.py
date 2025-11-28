import sqlite3

conn = sqlite3.connect('aliaport.db')
cur = conn.cursor()

# Tüm portal userları göster
print("=== ÖNCEDEN ===")
users = cur.execute("SELECT id, email, cari_id FROM portal_user").fetchall()
for u in users:
    print(f"  id={u[0]}, email={u[1]}, cari_id={u[2]}")

# Hepsini cari_id=1 yap
cur.execute("UPDATE portal_user SET cari_id=1")
conn.commit()

print("\n=== SONRA ===")
users = cur.execute("SELECT id, email, cari_id FROM portal_user").fetchall()
for u in users:
    print(f"  id={u[0]}, email={u[1]}, cari_id={u[2]}")

print("\n✅ Tüm portal userların cari_id'si 1 yapıldı!")
conn.close()
