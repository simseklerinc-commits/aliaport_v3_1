#!/usr/bin/env python3
"""
Portal API üzerinden test iş emirleri oluştur
"""

import requests
import json
from datetime import datetime, timedelta

# Portal token'ı almak için login yap
login_url = "http://localhost:8000/api/v1/portal/auth/login"
login_payload = {
    "email": "test@aliaport.com",
    "password": "Test1234!"
}

print("🔐 Portal'a login yapılıyor...")
response = requests.post(login_url, json=login_payload)

if response.status_code != 200:
    print(f"❌ Login başarısız: {response.status_code}")
    print(response.text)
    exit(1)

login_data = response.json()
access_token = login_data.get('access_token')
user_data = login_data.get('user')

print(f"✓ Login başarılı: {user_data.get('full_name')} ({user_data.get('email')})")
print(f"✓ Cari: {user_data.get('cari_unvan')}")

# Header'lar
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# İş emirleri oluştur
work_order_url = "http://localhost:8000/api/v1/portal/work-orders"

test_orders = [
    {
        "CariId": user_data.get('cari_id'),
        "CariCode": user_data.get('cari_code'),
        "CariTitle": user_data.get('cari_unvan'),
        "Type": "HIZMET",
        "Subject": "Portal Test İş Emri #1 - Gemi Tamir Hizmeti",
        "Description": "Portal API üzerinden oluşturulan test iş emri",
        "Priority": "MEDIUM",
        "PlannedStart": (datetime.now() - timedelta(days=2)).isoformat(),
        "GateRequired": False,
        "SahaKayitYetkisi": True,
        "ServiceCodes": ["H001", "H002"],  # Çoklu hizmet
        "EmployeeIds": [1, 2],
        "VehicleIds": [1],
    },
    {
        "CariId": user_data.get('cari_id'),
        "CariCode": user_data.get('cari_code'),
        "CariTitle": user_data.get('cari_unvan'),
        "Type": "HIZMET",
        "Subject": "Portal Test İş Emri #2 - Güvenlik Kontrol",
        "Description": "Portal API üzerinden oluşturulan test iş emri",
        "Priority": "HIGH",
        "PlannedStart": datetime.now().isoformat(),
        "GateRequired": True,
        "SahaKayitYetkisi": True,
        "ServiceCodes": ["H003"],
        "EmployeeIds": [3],
        "VehicleIds": [2, 3],
    },
    {
        "CariId": user_data.get('cari_id'),
        "CariCode": user_data.get('cari_code'),
        "CariTitle": user_data.get('cari_unvan'),
        "Type": "BARINMA",
        "Subject": "Portal Test İş Emri #3 - Barınma Talebi",
        "Description": "Portal API üzerinden oluşturulan test iş emri",
        "Priority": "MEDIUM",
        "PlannedStart": (datetime.now() + timedelta(days=5)).isoformat(),
        "GateRequired": False,
        "SahaKayitYetkisi": True,
        "ServiceCodes": ["H004"],
        "EmployeeIds": [],
        "VehicleIds": [],
    },
]

print(f"\n📋 {len(test_orders)} test iş emri oluşturuluyor...\n")

created_count = 0
for i, order in enumerate(test_orders, 1):
    try:
        response = requests.post(work_order_url, json=order, headers=headers)
        
        if response.status_code == 201:
            data = response.json()
            wo_number = data.get('wo_number') or data.get('id')
            print(f"  ✓ İş Emri #{i}: {order['Subject']}")
            print(f"    └─ WO: {wo_number}, Status: {data.get('status')}")
            created_count += 1
        else:
            print(f"  ❌ İş Emri #{i} başarısız: {response.status_code}")
            print(f"    └─ {response.text[:100]}")
    except Exception as e:
        print(f"  ❌ İş Emri #{i} hatası: {str(e)}")

print(f"\n✅ {created_count} iş emri başarıyla oluşturuldu!")
