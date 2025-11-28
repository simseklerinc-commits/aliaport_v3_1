import sqlite3
from datetime import datetime

conn = sqlite3.connect('aliaport.db')
cursor = conn.cursor()

# portal_employee tablosunu oluştur
cursor.execute('''
CREATE TABLE IF NOT EXISTS portal_employee (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cari_id INTEGER NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    tc_kimlik VARCHAR(11),
    pasaport VARCHAR(50),
    nationality VARCHAR(10) DEFAULT 'TUR',
    phone VARCHAR(20),
    position VARCHAR(100),
    identity_photo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cari_id) REFERENCES Cari(Id)
)
''')

print('✅ portal_employee tablosu oluşturuldu')

# portal_vehicle tablosunu oluştur
cursor.execute('''
CREATE TABLE IF NOT EXISTS portal_vehicle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cari_id INTEGER NOT NULL,
    plaka VARCHAR(20) NOT NULL,
    marka VARCHAR(100),
    model VARCHAR(100),
    vehicle_type VARCHAR(50),
    ruhsat_sahibi VARCHAR(200),
    ruhsat_tarihi DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cari_id) REFERENCES Cari(Id)
)
''')

print('✅ portal_vehicle tablosu oluşturuldu')

# work_order_employee junction tablosunu oluştur
cursor.execute('''
CREATE TABLE IF NOT EXISTS work_order_employee (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_order_id) REFERENCES work_order(id),
    FOREIGN KEY (employee_id) REFERENCES portal_employee(id)
)
''')

print('✅ work_order_employee tablosu oluşturuldu')

# work_order_vehicle junction tablosunu oluştur
cursor.execute('''
CREATE TABLE IF NOT EXISTS work_order_vehicle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_order_id) REFERENCES work_order(id),
    FOREIGN KEY (vehicle_id) REFERENCES portal_vehicle(id)
)
''')

print('✅ work_order_vehicle tablosu oluşturuldu')

conn.commit()
conn.close()

print('\n✅ Tüm tablolar başarıyla oluşturuldu!')
