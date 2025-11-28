import sqlite3

conn = sqlite3.connect('aliaport.db')
cur = conn.cursor()

print("=== TÜM ÇALIŞANLAR ===")
emps = cur.execute("SELECT id, full_name, tc_kimlik, cari_id FROM portal_employee ORDER BY id").fetchall()
for e in emps:
    print(f"{e[0]}: {e[1]} (TC:{e[2]}, cari_id={e[3]})")

print(f"\nToplam: {len(emps)} çalışan")

print("\n=== TÜM ARAÇLAR ===")
vehs = cur.execute("SELECT id, plaka, marka, model, cari_id FROM portal_vehicle ORDER BY id").fetchall()
for v in vehs:
    print(f"{v[0]}: {v[1]} {v[2]} {v[3]} (cari_id={v[4]})")

print(f"\nToplam: {len(vehs)} araç")

print("\n=== PORTAL USER ===")
users = cur.execute("SELECT id, email, cari_id FROM portal_user").fetchall()
for u in users:
    print(f"{u[0]}: {u[1]} (cari_id={u[2]})")

conn.close()
