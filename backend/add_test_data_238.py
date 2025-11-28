import sqlite3
from datetime import datetime

conn = sqlite3.connect('aliaport.db')
cur = conn.cursor()

# Mevcut verileri göster
print("=== MEVCUT VERİLER (cari_id=238) ===")
existing_emps = cur.execute("SELECT id, full_name, tc_kimlik FROM portal_employee WHERE cari_id=238").fetchall()
print(f"Çalışanlar ({len(existing_emps)} adet):")
for emp in existing_emps:
    print(f"  - {emp[1]} (TC: {emp[2]})")

existing_vehs = cur.execute("SELECT id, plaka, marka, model FROM portal_vehicle WHERE cari_id=238").fetchall()
print(f"\nAraçlar ({len(existing_vehs)} adet):")
for veh in existing_vehs:
    print(f"  - {veh[1]} {veh[2]} {veh[3]}")

# Test verilerini ekle (cari_id=238 ile)
print("\n=== YENİ VERİLER EKLENİYOR ===")

# 10 Çalışan
employees = [
    ('Ahmet Yılmaz', '12345678901', None, 'TUR', '5551234567', 'Liman İşçisi'),
    ('Mehmet Kaya', '23456789012', None, 'TUR', '5551234568', 'Forklift Operatörü'),
    ('Ayşe Demir', '34567890123', None, 'TUR', '5551234569', 'Gümrük Uzmanı'),
    ('Fatma Şahin', '45678901234', None, 'TUR', '5551234570', 'Yük Talep Uzmanı'),
    ('Ali Çelik', '56789012345', None, 'TUR', '5551234571', 'Vinç Operatörü'),
    ('John Smith', None, 'US1234567', 'USA', '5551234572', 'Shipping Agent'),
    ('Maria Garcia', None, 'ES7654321', 'ESP', '5551234573', 'Cargo Supervisor'),
    ('Hans Mueller', None, 'DE9876543', 'DEU', '5551234574', 'Technical Advisor'),
    ('Can Özdemir', '67890123456', None, 'TUR', '5551234575', 'Güvenlik Görevlisi'),
    ('Zeynep Arslan', '78901234567', None, 'TUR', '5551234576', 'İdari Personel'),
]

added_count = 0
for emp_data in employees:
    cur.execute("""
        INSERT INTO portal_employee 
        (cari_id, full_name, tc_kimlik, pasaport, nationality, phone, position, is_active, created_at, updated_at)
        VALUES (238, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (*emp_data, datetime.now(), datetime.now()))
    added_count += 1

print(f"✅ {added_count} çalışan eklendi")

# 7 Araç
vehicles = [
    ('34 ABC 123', 'Mercedes', 'Actros', 'Çekici', 'Test Firma', '2024-01-15'),
    ('06 XYZ 456', 'Ford', 'Transit', 'Panelvan', 'Test Firma', '2023-06-20'),
    ('35 DEF 789', 'MAN', 'TGX', 'Tır', 'Test Firma', '2022-03-10'),
    ('16 GHI 321', 'Toyota', 'Hilux', 'Pickup', 'Test Firma', '2023-09-05'),
    ('01 JKL 654', 'Hyundai', 'H100', 'Kamyonet', 'Test Firma', '2024-02-28'),
    ('41 MNO 987', 'Fiat', 'Doblo', 'Hafif Ticari', 'Test Firma', '2023-11-12'),
    ('34 PQR 147', 'Renault', 'Master', 'Minibüs', 'Test Firma', '2022-08-22'),
]

added_vehs = 0
for veh_data in vehicles:
    cur.execute("""
        INSERT INTO portal_vehicle
        (cari_id, plaka, marka, model, vehicle_type, ruhsat_sahibi, ruhsat_tarihi, is_active, created_at, updated_at)
        VALUES (238, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (*veh_data, datetime.now(), datetime.now()))
    added_vehs += 1

print(f"✅ {added_vehs} araç eklendi")

conn.commit()

# Sonuç
print("\n=== GÜNCEL DURUM (cari_id=238) ===")
total_emps = cur.execute("SELECT COUNT(*) FROM portal_employee WHERE cari_id=238").fetchone()[0]
total_vehs = cur.execute("SELECT COUNT(*) FROM portal_vehicle WHERE cari_id=238").fetchone()[0]

print(f"Toplam Çalışan: {total_emps} adet")
print(f"Toplam Araç: {total_vehs} adet")

conn.close()
