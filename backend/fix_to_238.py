import sqlite3

conn = sqlite3.connect('aliaport.db')
cur = conn.cursor()

# Portal user'ı cari_id=238 yap
cur.execute("UPDATE portal_user SET cari_id=238 WHERE id=2")

# Tüm employee ve vehicle'ları da cari_id=238 yap
cur.execute("UPDATE portal_employee SET cari_id=238")
cur.execute("UPDATE portal_vehicle SET cari_id=238")

conn.commit()

print("✅ Güncelleme tamamlandı:")
print(f"   Portal user cari_id: 238")
print(f"   Employees: {cur.execute('SELECT COUNT(*) FROM portal_employee WHERE cari_id=238').fetchone()[0]} adet (cari_id=238)")
print(f"   Vehicles: {cur.execute('SELECT COUNT(*) FROM portal_vehicle WHERE cari_id=238').fetchone()[0]} adet (cari_id=238)")

conn.close()
