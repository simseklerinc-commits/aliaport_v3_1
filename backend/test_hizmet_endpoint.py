#!/usr/bin/env python3
"""Test hizmet-kartlari endpoint"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1/portal"

# 1. Portal'a giriş yap
print("🔐 Portal'a login yapılıyor...")
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "test@aliaport.com",
        "password": "Test1234!"
    }
)

if login_response.status_code != 200:
    print(f"❌ Login başarısız: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
print(f"✅ Login başarılı, token: {token[:20]}...")

# 2. Hizmet kartlarını al
print("\n📋 Hizmet kartları yükleniyor...")
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    f"{BASE_URL}/hizmet-kartlari",
    headers=headers
)

if response.status_code != 200:
    print(f"❌ Hizmet kartları yüklenemedi: {response.text}")
    exit(1)

data = response.json()
print(f"✅ {data.get('total', 0)} hizmet kartı yüklendi")

items = data.get("items", [])
for item in items[:3]:
    print(f"\n📌 {item['kod']}: {item['ad']}")
    if item.get('aciklama'):
        print(f"   Açıklama: {item['aciklama']}")
    if item.get('birim'):
        print(f"   Birim: {item['birim']}")

print(f"\n✅ Test başarılı! {len(items)} hizmet kartı bulundu.")
