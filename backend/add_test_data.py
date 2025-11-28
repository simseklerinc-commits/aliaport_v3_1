from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Import all models to resolve dependencies
from aliaport_api.modules.dijital_arsiv import models

# SQLite connection
engine = create_engine('sqlite:///./aliaport.db')
Session = sessionmaker(bind=engine)
db = Session()

# Test çalışanları - 10 kişi
employees = [
    {'full_name': 'Ahmet Yılmaz', 'tc_kimlik': '12345678901', 'nationality': 'TUR', 'phone': '0532 111 2233', 'position': 'Liman İşçisi', 'cari_id': 1},
    {'full_name': 'Mehmet Kaya', 'tc_kimlik': '23456789012', 'nationality': 'TUR', 'phone': '0533 222 3344', 'position': 'Forklift Operatörü', 'cari_id': 1},
    {'full_name': 'Ayşe Demir', 'tc_kimlik': '34567890123', 'nationality': 'TUR', 'phone': '0534 333 4455', 'position': 'Gümrük Uzmanı', 'cari_id': 1},
    {'full_name': 'Fatma Şahin', 'tc_kimlik': '45678901234', 'nationality': 'TUR', 'phone': '0535 444 5566', 'position': 'Yük Talep Uzmanı', 'cari_id': 1},
    {'full_name': 'Ali Çelik', 'tc_kimlik': '56789012345', 'nationality': 'TUR', 'phone': '0536 555 6677', 'position': 'Vinç Operatörü', 'cari_id': 1},
    {'full_name': 'John Smith', 'pasaport': 'US1234567', 'nationality': 'USA', 'phone': '+1 555 123 4567', 'position': 'Shipping Agent', 'cari_id': 1},
    {'full_name': 'Maria Garcia', 'pasaport': 'ES7654321', 'nationality': 'ESP', 'phone': '+34 600 111 222', 'position': 'Cargo Supervisor', 'cari_id': 1},
    {'full_name': 'Hans Mueller', 'pasaport': 'DE9876543', 'nationality': 'DEU', 'phone': '+49 170 333 4444', 'position': 'Technical Advisor', 'cari_id': 1},
    {'full_name': 'Can Özdemir', 'tc_kimlik': '67890123456', 'nationality': 'TUR', 'phone': '0537 666 7788', 'position': 'Güvenlik Görevlisi', 'cari_id': 1},
    {'full_name': 'Zeynep Arslan', 'tc_kimlik': '78901234567', 'nationality': 'TUR', 'phone': '0538 777 8899', 'position': 'İdari Personel', 'cari_id': 1}
]

# Test araçları - 7 farklı tip
vehicles = [
    {'plaka': '34 ABC 123', 'marka': 'Mercedes', 'model': 'Actros', 'vehicle_type': 'Çekici', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'cari_id': 1},
    {'plaka': '06 XYZ 456', 'marka': 'Ford', 'model': 'Transit', 'vehicle_type': 'Panelvan', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'cari_id': 1},
    {'plaka': '35 DEF 789', 'marka': 'MAN', 'model': 'TGX', 'vehicle_type': 'Tır', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'cari_id': 1},
    {'plaka': '16 GHI 321', 'marka': 'Toyota', 'model': 'Hilux', 'vehicle_type': 'Pickup', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'cari_id': 1},
    {'plaka': '01 JKL 654', 'marka': 'Hyundai', 'model': 'H100', 'vehicle_type': 'Kamyonet', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'cari_id': 1},
    {'plaka': '41 MNO 987', 'marka': 'Fiat', 'model': 'Doblo', 'vehicle_type': 'Hafif Ticari', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'cari_id': 1},
    {'plaka': '34 PQR 147', 'marka': 'Renault', 'model': 'Master', 'vehicle_type': 'Minibüs', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'cari_id': 1}
]

# Çalışanları ekle
for emp_data in employees:
    emp = models.PortalEmployee(**emp_data, is_active=True)
    db.add(emp)

# Araçları ekle
for veh_data in vehicles:
    veh = models.PortalVehicle(**veh_data, ruhsat_tarihi=datetime(2024, 1, 15), is_active=True)
    db.add(veh)

db.commit()
print('✅ Test verileri başarıyla eklendi!')
print('   - 10 Çalışan (7 Türk, 3 Yabancı)')
print('   - 7 Araç (Çekici, Panelvan, Tır, Pickup, Kamyonet, Hafif Ticari, Minibüs)')
db.close()
