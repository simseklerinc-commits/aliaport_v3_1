import sqlite3
from datetime import datetime

# SQLite veritabanına bağlan
conn = sqlite3.connect('aliaport.db')
cursor = conn.cursor()

# Test çalışanları - 10 kişi
employees = [
    ('Ahmet Yılmaz', '12345678901', None, 'TUR', '0532 111 2233', 'Liman İşçisi', 1),
    ('Mehmet Kaya', '23456789012', None, 'TUR', '0533 222 3344', 'Forklift Operatörü', 1),
    ('Ayşe Demir', '34567890123', None, 'TUR', '0534 333 4455', 'Gümrük Uzmanı', 1),
    ('Fatma Şahin', '45678901234', None, 'TUR', '0535 444 5566', 'Yük Talep Uzmanı', 1),
    ('Ali Çelik', '56789012345', None, 'TUR', '0536 555 6677', 'Vinç Operatörü', 1),
    ('John Smith', None, 'US1234567', 'USA', '+1 555 123 4567', 'Shipping Agent', 1),
    ('Maria Garcia', None, 'ES7654321', 'ESP', '+34 600 111 222', 'Cargo Supervisor', 1),
    ('Hans Mueller', None, 'DE9876543', 'DEU', '+49 170 333 4444', 'Technical Advisor', 1),
    ('Can Özdemir', '67890123456', None, 'TUR', '0537 666 7788', 'Güvenlik Görevlisi', 1),
    ('Zeynep Arslan', '78901234567', None, 'TUR', '0538 777 8899', 'İdari Personel', 1)
]

# Test araçları - 7 farklı tip
vehicles = [
    ('34 ABC 123', 'Mercedes', 'Actros', 'Çekici', 'Aliaport Lojistik A.Ş.', '2024-01-15', 1),
    ('06 XYZ 456', 'Ford', 'Transit', 'Panelvan', 'Aliaport Lojistik A.Ş.', '2024-01-15', 1),
    ('35 DEF 789', 'MAN', 'TGX', 'Tır', 'Aliaport Lojistik A.Ş.', '2024-01-15', 1),
    ('16 GHI 321', 'Toyota', 'Hilux', 'Pickup', 'Aliaport Lojistik A.Ş.', '2024-01-15', 1),
    ('01 JKL 654', 'Hyundai', 'H100', 'Kamyonet', 'Aliaport Lojistik A.Ş.', '2024-01-15', 1),
    ('41 MNO 987', 'Fiat', 'Doblo', 'Hafif Ticari', 'Aliaport Lojistik A.Ş.', '2024-01-15', 1),
    ('34 PQR 147', 'Renault', 'Master', 'Minibüs', 'Aliaport Lojistik A.Ş.', '2024-01-15', 1)
]

# Çalışanları ekle
cursor.executemany('''
    INSERT INTO portal_employee (full_name, tc_kimlik, pasaport, nationality, phone, position, cari_id, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
''', [(e[0], e[1], e[2], e[3], e[4], e[5], e[6], datetime.now()) for e in employees])

print(f'✅ {cursor.rowcount} çalışan eklendi')

# Araçları ekle
cursor.executemany('''
    INSERT INTO portal_vehicle (plaka, marka, model, vehicle_type, ruhsat_sahibi, ruhsat_tarihi, cari_id, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
''', [(v[0], v[1], v[2], v[3], v[4], v[5], v[6], datetime.now()) for v in vehicles])

print(f'✅ {cursor.rowcount} araç eklendi')

conn.commit()
conn.close()

print('\n✅ Test verileri başarıyla eklendi!')
print('   - 10 Çalışan (7 Türk, 3 Yabancı)')
print('   - 7 Araç (Çekici, Panelvan, Tır, Pickup, Kamyonet, Hafif Ticari, Minibüs)')
