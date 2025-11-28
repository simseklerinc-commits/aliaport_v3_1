import requests

BASE_URL = "http://localhost:8000/api/v1/portal"
TOKEN = "test_token_here"  # Portal token'ını buraya ekle

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Test çalışanları - 10 kişi
employees = [
    {'full_name': 'Ahmet Yılmaz', 'tc_kimlik': '12345678901', 'nationality': 'TUR', 'phone': '0532 111 2233', 'position': 'Liman İşçisi'},
    {'full_name': 'Mehmet Kaya', 'tc_kimlik': '23456789012', 'nationality': 'TUR', 'phone': '0533 222 3344', 'position': 'Forklift Operatörü'},
    {'full_name': 'Ayşe Demir', 'tc_kimlik': '34567890123', 'nationality': 'TUR', 'phone': '0534 333 4455', 'position': 'Gümrük Uzmanı'},
    {'full_name': 'Fatma Şahin', 'tc_kimlik': '45678901234', 'nationality': 'TUR', 'phone': '0535 444 5566', 'position': 'Yük Talep Uzmanı'},
    {'full_name': 'Ali Çelik', 'tc_kimlik': '56789012345', 'nationality': 'TUR', 'phone': '0536 555 6677', 'position': 'Vinç Operatörü'},
    {'full_name': 'John Smith', 'pasaport': 'US1234567', 'nationality': 'USA', 'phone': '+1 555 123 4567', 'position': 'Shipping Agent'},
    {'full_name': 'Maria Garcia', 'pasaport': 'ES7654321', 'nationality': 'ESP', 'phone': '+34 600 111 222', 'position': 'Cargo Supervisor'},
    {'full_name': 'Hans Mueller', 'pasaport': 'DE9876543', 'nationality': 'DEU', 'phone': '+49 170 333 4444', 'position': 'Technical Advisor'},
    {'full_name': 'Can Özdemir', 'tc_kimlik': '67890123456', 'nationality': 'TUR', 'phone': '0537 666 7788', 'position': 'Güvenlik Görevlisi'},
    {'full_name': 'Zeynep Arslan', 'tc_kimlik': '78901234567', 'nationality': 'TUR', 'phone': '0538 777 8899', 'position': 'İdari Personel'}
]

# Test araçları - 7 farklı tip
vehicles = [
    {'plaka': '34 ABC 123', 'marka': 'Mercedes', 'model': 'Actros', 'vehicle_type': 'Çekici', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'ruhsat_tarihi': '2024-01-15'},
    {'plaka': '06 XYZ 456', 'marka': 'Ford', 'model': 'Transit', 'vehicle_type': 'Panelvan', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'ruhsat_tarihi': '2024-01-15'},
    {'plaka': '35 DEF 789', 'marka': 'MAN', 'model': 'TGX', 'vehicle_type': 'Tır', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'ruhsat_tarihi': '2024-01-15'},
    {'plaka': '16 GHI 321', 'marka': 'Toyota', 'model': 'Hilux', 'vehicle_type': 'Pickup', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'ruhsat_tarihi': '2024-01-15'},
    {'plaka': '01 JKL 654', 'marka': 'Hyundai', 'model': 'H100', 'vehicle_type': 'Kamyonet', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'ruhsat_tarihi': '2024-01-15'},
    {'plaka': '41 MNO 987', 'marka': 'Fiat', 'model': 'Doblo', 'vehicle_type': 'Hafif Ticari', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'ruhsat_tarihi': '2024-01-15'},
    {'plaka': '34 PQR 147', 'marka': 'Renault', 'model': 'Master', 'vehicle_type': 'Minibüs', 'ruhsat_sahibi': 'Aliaport Lojistik A.Ş.', 'ruhsat_tarihi': '2024-01-15'}
]

print("Önce portal'a giriş yapıp token alın:")
print("Email: test@aliaport.com")
print("Password: Test1234!")
print()

token = input("Portal token'ı buraya yapıştırın: ").strip()
headers["Authorization"] = f"Bearer {token}"

print("\n✅ Çalışanlar ekleniyor...")
for emp in employees:
    try:
        response = requests.post(f"{BASE_URL}/employees", json=emp, headers=headers)
        if response.status_code == 200:
            print(f"  ✓ {emp['full_name']}")
        else:
            print(f"  ✗ {emp['full_name']} - Hata: {response.text}")
    except Exception as e:
        print(f"  ✗ {emp['full_name']} - Hata: {e}")

print("\n✅ Araçlar ekleniyor...")
for veh in vehicles:
    try:
        response = requests.post(f"{BASE_URL}/vehicles", json=veh, headers=headers)
        if response.status_code == 200:
            print(f"  ✓ {veh['plaka']} - {veh['marka']} {veh['model']}")
        else:
            print(f"  ✗ {veh['plaka']} - Hata: {response.text}")
    except Exception as e:
        print(f"  ✗ {veh['plaka']} - Hata: {e}")

print("\n✅ Test verileri ekleme tamamlandı!")
print("   - 10 Çalışan (7 Türk, 3 Yabancı)")
print("   - 7 Araç (Çekici, Panelvan, Tır, Pickup, Kamyonet, Hafif Ticari, Minibüs)")
