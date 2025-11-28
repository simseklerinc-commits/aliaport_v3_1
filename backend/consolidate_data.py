import sqlite3

conn = sqlite3.connect('database/aliaport.db')
c = conn.cursor()

print("=" * 80)
print("VERİ KONSOLIDASYON - CARİ ID=1'E TAŞI")
print("=" * 80)

# 1. Cari 1 bilgileri
c.execute('SELECT Id, Unvan FROM Cari WHERE Id = 1')
cari1 = c.fetchone()
if cari1:
    print(f"\n✓ Test Cari: Id={cari1[0]}, Unvan={cari1[1][:50]}...")
else:
    print("\n❌ Cari 1 bulunamadı!")
    conn.close()
    exit(1)

# 2. Portal Employee'yi Cari 1'e bağla
print("\n📍 Portal Employee güncelliyor (cari_id=238 -> 1)...")
c.execute('UPDATE portal_employee SET cari_id = 1 WHERE cari_id = 238')
affected = c.rowcount
print(f"  ✓ {affected} kayıt güncellendi")

# 3. Portal Vehicle'ı Cari 1'e bağla
print("\n📍 Portal Vehicle güncelliyor (cari_id=238 -> 1)...")
c.execute('UPDATE portal_vehicle SET cari_id = 1 WHERE cari_id = 238')
affected = c.rowcount
print(f"  ✓ {affected} kayıt güncellendi")

# 4. Work Order Employee'yi kontrol et
print("\n📍 Work Order Employee kontrol ediliyor...")
c.execute('SELECT COUNT(*) FROM work_order_employee')
count = c.fetchone()[0]
print(f"  📊 Toplam: {count} kayıt (bağlantı tablosu, cari_id yok)")

# 5. Work Order Vehicle'ı kontrol et
print("\n📍 Work Order Vehicle kontrol ediliyor...")
c.execute('SELECT COUNT(*) FROM work_order_vehicle')
count = c.fetchone()[0]
print(f"  📊 Toplam: {count} kayıt (bağlantı tablosu, cari_id yok)")

# 6. Hizmet kartlarını kontrol et
print("\n📍 Hizmet tablosu kontrol ediliyor...")
c.execute('SELECT COUNT(*) as total, COUNT(DISTINCT Cari) as caris FROM Hizmet')
result = c.fetchone()
print(f"  📊 Toplam Hizmet: {result[0]}, Cari sayısı: {result[1]}")

c.execute('SELECT DISTINCT Cari FROM Hizmet ORDER BY Cari LIMIT 10')
hizmet_caris = c.fetchall()
for h_cari in hizmet_caris:
    c.execute('SELECT Unvan FROM Cari WHERE Id = ?', (h_cari[0],))
    cari_name = c.fetchone()
    if cari_name:
        print(f"    - Cari {h_cari[0]}: {cari_name[0][:40]}...")
    else:
        print(f"    - Cari {h_cari[0]}: [BULUNAMADI]")

# 7. Parametreleri kontrol et
print("\n📍 Parametre tablosu kontrol ediliyor...")
c.execute('SELECT COUNT(*) FROM Parametre')
count = c.fetchone()[0]
print(f"  📊 Toplam: {count} kayıt (sistem parametreleri, cari bağlantısı yok)")

# Commit
conn.commit()
print("\n" + "=" * 80)
print("✅ Güncelleme tamamlandı!")
print("=" * 80)

# Doğrulama
print("\n📋 Doğrulama:")
c.execute('SELECT COUNT(*) FROM portal_employee WHERE cari_id = 1')
print(f"  Portal Employee (cari_id=1): {c.fetchone()[0]}")
c.execute('SELECT COUNT(*) FROM portal_vehicle WHERE cari_id = 1')
print(f"  Portal Vehicle (cari_id=1): {c.fetchone()[0]}")

conn.close()
