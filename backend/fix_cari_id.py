import sqlite3

conn = sqlite3.connect('aliaport.db')
cur = conn.cursor()

# Mevcut durum
user = cur.execute("SELECT id, email, cari_id FROM portal_user WHERE id=2").fetchone()
print(f"Önceki: Portal User id={user[0]}, email={user[1]}, cari_id={user[2]}")

# Güncelle
cur.execute("UPDATE portal_user SET cari_id=1 WHERE id=2")
conn.commit()

# Sonrası
user = cur.execute("SELECT id, email, cari_id FROM portal_user WHERE id=2").fetchone()
print(f"Sonrası: Portal User id={user[0]}, email={user[1]}, cari_id={user[2]}")
print("\n✅ Portal user cari_id güncellendi!")

conn.close()
