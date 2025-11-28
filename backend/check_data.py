import sqlite3

conn = sqlite3.connect('aliaport.db')
cursor = conn.cursor()

# Test kullanıcısı
cursor.execute("SELECT id, email, cari_id FROM portal_user WHERE email='test@aliaport.com'")
user = cursor.fetchone()
print(f"Portal User: {user}")

# Çalışanlar
cursor.execute("SELECT id, full_name, cari_id FROM portal_employee LIMIT 3")
employees = cursor.fetchall()
print("\nÇalışanlar:")
for emp in employees:
    print(f"  {emp}")

# Araçlar
cursor.execute("SELECT id, plaka, cari_id FROM portal_vehicle LIMIT 3")
vehicles = cursor.fetchall()
print("\nAraçlar:")
for veh in vehicles:
    print(f"  {veh}")

conn.close()
