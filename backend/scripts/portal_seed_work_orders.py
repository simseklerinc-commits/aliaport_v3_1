#!/usr/bin/env python3
"""Portal API üzerinden 10 farklı iş emri senaryosu oluşturur."""
from __future__ import annotations

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any

from fastapi.testclient import TestClient

# Backend dizinini sys.path'e ekle
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from aliaport_api.main import app  # noqa: E402  pylint: disable=wrong-import-position

PORTAL_EMAIL = "test@aliaport.com"
PORTAL_PASSWORD = "Test1234!"
BASE_URL = "/api/v1/portal"

client = TestClient(app)


def login() -> str:
    """Portal kullanıcısı ile giriş yap ve access token döndür."""
    response = client.post(
        f"{BASE_URL}/auth/login",
        data={"username": PORTAL_EMAIL, "password": PORTAL_PASSWORD},
    )
    if response.status_code != 200:
        raise RuntimeError(f"Portal login başarısız: {response.status_code} {response.text}")
    data = response.json()
    return data["access_token"]


def fetch_profile(token: str) -> Dict[str, Any]:
    """Portal kullanıcısının profil bilgilerini getir."""
    response = client.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    if response.status_code != 200:
        raise RuntimeError(f"Portal profil alınamadı: {response.status_code} {response.text}")
    return response.json()


def iso(dt: datetime) -> str:
    """datetime değerini ISO string'e çevir."""
    return dt.replace(microsecond=0).isoformat()


def build_scenarios(now: datetime) -> List[Dict[str, Any]]:
    """Farklı kombinasyonlara sahip 10 iş emri senaryosu hazırla."""
    return [
        {
            "Subject": "Portal Test #1 - Römorkaj",
            "Description": "Acil römorkaj talebi",
            "Type": "HIZMET",
            "Action": "ROMORKOR",
            "Priority": "URGENT",
            "PlannedStart": iso(now + timedelta(hours=2)),
            "PlannedEnd": iso(now + timedelta(hours=6)),
            "GateRequired": True,
            "SahaKayitYetkisi": True,
            "ServiceCodes": ["HZM001", "HZM002"],
            "EmployeeIds": [1, 2],
            "VehicleIds": [1],
            "PersonelList": None,
        },
        {
            "Subject": "Portal Test #2 - Personel Transferi",
            "Description": "12 kişilik vardiya değişimi",
            "Type": "HIZMET",
            "Action": "PERSONEL_TRANSFER",
            "Priority": "HIGH",
            "PlannedStart": iso(now + timedelta(days=1)),
            "PlannedEnd": iso(now + timedelta(days=1, hours=4)),
            "GateRequired": True,
            "SahaKayitYetkisi": True,
            "ServiceCodes": ["HZM005"],
            "EmployeeIds": [3, 4],
            "VehicleIds": [2, 3],
            "PersonelList": [
                {
                    "full_name": "Kemal Oz",
                    "tc_kimlik": "12345678901",
                    "pasaport": None,
                    "nationality": "TUR",
                    "phone": "+90 532 111 2233",
                },
                {
                    "full_name": "Sara Demir",
                    "tc_kimlik": "23456789012",
                    "pasaport": None,
                    "nationality": "TUR",
                    "phone": "+90 532 222 3344",
                },
            ],
        },
        {
            "Subject": "Portal Test #3 - Barınma Talebi",
            "Description": "48 saatlik barınma talebi",
            "Type": "BARINMA",
            "Action": "BARINMA",
            "Priority": "MEDIUM",
            "PlannedStart": iso(now + timedelta(days=2)),
            "PlannedEnd": iso(now + timedelta(days=4)),
            "GateRequired": False,
            "SahaKayitYetkisi": False,
            "ServiceCodes": ["HZM003"],
            "EmployeeIds": [],
            "VehicleIds": [],
            "PersonelList": None,
        },
        {
            "Subject": "Portal Test #4 - Atık Alma",
            "Description": "Petrol türevleri atık boşaltımı",
            "Type": "HIZMET",
            "Action": "ATIK",
            "Priority": "HIGH",
            "PlannedStart": iso(now + timedelta(hours=12)),
            "PlannedEnd": iso(now + timedelta(hours=24)),
            "GateRequired": True,
            "SahaKayitYetkisi": True,
            "ServiceCodes": ["HZM005", "HZM006"],
            "EmployeeIds": [5],
            "VehicleIds": [2],
            "PersonelList": [
                {
                    "full_name": "Luis Ortega",
                    "tc_kimlik": None,
                    "pasaport": "P1234567",
                    "nationality": "ESP",
                    "phone": "+34 600 123 456",
                }
            ],
        },
        {
            "Subject": "Portal Test #5 - Elektrik Temini",
            "Description": "Yüke özel elektrik kablolaması",
            "Type": "HIZMET",
            "Action": "ELEKTRIK",
            "Priority": "MEDIUM",
            "PlannedStart": iso(now - timedelta(hours=6)),
            "PlannedEnd": iso(now + timedelta(hours=2)),
            "GateRequired": False,
            "SahaKayitYetkisi": True,
            "ServiceCodes": ["HZM007"],
            "EmployeeIds": [1, 3],
            "VehicleIds": [],
            "PersonelList": None,
        },
        {
            "Subject": "Portal Test #6 - Motorbot Transferi",
            "Description": "Motorbot ile mühendis transferi",
            "Type": "MOTORBOT",
            "Action": "MOTORBOT",
            "Priority": "HIGH",
            "PlannedStart": iso(now + timedelta(hours=4)),
            "PlannedEnd": iso(now + timedelta(hours=8)),
            "GateRequired": True,
            "SahaKayitYetkisi": True,
            "ServiceCodes": ["HZM001"],
            "EmployeeIds": [2],
            "VehicleIds": [3],
            "PersonelList": [
                {
                    "full_name": "Nihal Er",
                    "tc_kimlik": "34567890123",
                    "pasaport": None,
                    "nationality": "TUR",
                    "phone": "+90 531 333 4455",
                }
            ],
        },
        {
            "Subject": "Portal Test #7 - Balast Alma",
            "Description": "Gemiden balast suyu boşaltımı",
            "Type": "HIZMET",
            "Action": "BALAST",
            "Priority": "MEDIUM",
            "PlannedStart": iso(now - timedelta(days=1)),
            "PlannedEnd": iso(now - timedelta(hours=12)),
            "GateRequired": False,
            "SahaKayitYetkisi": False,
            "ServiceCodes": ["HZM008"],
            "EmployeeIds": [],
            "VehicleIds": [4],
            "PersonelList": None,
        },
        {
            "Subject": "Portal Test #8 - Güvenlik Refakati",
            "Description": "VIP ziyaretçi için güvenlik planı",
            "Type": "HIZMET",
            "Action": "GUVENLIK",
            "Priority": "LOW",
            "PlannedStart": iso(now + timedelta(days=3)),
            "PlannedEnd": iso(now + timedelta(days=3, hours=6)),
            "GateRequired": True,
            "SahaKayitYetkisi": False,
            "ServiceCodes": ["HZM002"],
            "EmployeeIds": [4, 5],
            "VehicleIds": [5],
            "PersonelList": None,
        },
        {
            "Subject": "Portal Test #9 - Dok İç Hizmeti",
            "Description": "Kuru havuz hazırlıkları",
            "Type": "DIGER",
            "Action": "DOK_ICE",
            "Priority": "MEDIUM",
            "PlannedStart": iso(now + timedelta(days=5)),
            "PlannedEnd": iso(now + timedelta(days=6)),
            "GateRequired": False,
            "SahaKayitYetkisi": True,
            "ServiceCodes": ["HZM004"],
            "EmployeeIds": [1],
            "VehicleIds": [],
            "PersonelList": None,
        },
        {
            "Subject": "Portal Test #10 - Yaklaşma Çekme",
            "Description": "Gemi yanaştırma ve yaklaşma koordinasyonu",
            "Type": "HIZMET",
            "Action": "YAKLASMA",
            "Priority": "HIGH",
            "PlannedStart": iso(now + timedelta(hours=1)),
            "PlannedEnd": iso(now + timedelta(hours=5)),
            "GateRequired": True,
            "SahaKayitYetkisi": True,
            "ServiceCodes": ["HZM004", "HZM006"],
            "EmployeeIds": [2, 3],
            "VehicleIds": [1, 4],
            "PersonelList": None,
        },
    ]


def main() -> None:
    print("=" * 70)
    print("🔧 Portal API Test İş Emirleri")
    print("=" * 70)

    token = login()
    profile = fetch_profile(token)

    headers = {"Authorization": f"Bearer {token}"}
    cari_payload = {
        "CariId": profile["cari_id"],
        "CariCode": profile.get("cari_code") or "",
        "CariTitle": profile.get("cari_unvan") or "Portal Cari",
    }

    scenarios = build_scenarios(datetime.utcnow())
    success_count = 0

    for idx, scenario in enumerate(scenarios, start=1):
        payload = {**cari_payload, **scenario}
        response = client.post(
            f"{BASE_URL}/work-orders",
            headers=headers,
            json=payload,
        )

        if response.status_code == 201:
            body = response.json()
            success_count += 1
            print(f"✓ #{idx:02d} | {scenario['Subject']} -> {body['wo_number']} ({body['status']})")
        else:
            print(f"✗ #{idx:02d} | {scenario['Subject']} | {response.status_code} {response.text}")

    print("-" * 70)
    print(f"✅ Başarılı iş emri sayısı: {success_count}/{len(scenarios)}")


if __name__ == "__main__":
    main()
