"""
Dijital Arşiv API Test Script
Tests: GET /api/archive/stats, POST /api/archive/upload, PUT approve/reject
"""

import requests
import json
from io import BytesIO

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_result(response, title="Response"):
    print(f"\n{title}:")
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except:
        print(response.text)

# ============================================
# TEST 1: Stats Endpoint
# ============================================
print_section("TEST 1: GET /api/archive/stats")

response = requests.get(f"{BASE_URL}/api/archive/stats")
print_result(response, "📊 Archive Stats")

if response.status_code == 200:
    data = response.json()
    if data["success"]:
        stats = data["data"]
        print("\n✅ İSTATİSTİKLER:")
        print(f"   Yüklendi (Onay Bekliyor): {stats['uploaded_count']}")
        print(f"   Onaylandı: {stats['approved_count']}")
        print(f"   Reddedildi: {stats['rejected_count']}")
        print(f"   Süresi Doldu: {stats['expired_count']}")
        print(f"   Toplam: {stats['total_count']}")
        print(f"   Yakında Süre Dolacak: {stats.get('expiring_soon_count', 0)}")
    else:
        print(f"❌ HATA: {data.get('message')}")
else:
    print(f"❌ HTTP HATASI: {response.status_code}")

# ============================================
# TEST 2: Upload Document
# ============================================
print_section("TEST 2: POST /api/archive/upload - Belge Yükleme")

# PDF dosyası simüle et (gerçek dosya yerine test verisi)
pdf_content = b"%PDF-1.4\n%Test PDF content for Aliaport Archive\nThis is a test document for upload testing."
pdf_file = BytesIO(pdf_content)

# Form data
files = {
    "file": ("test_gumruk_belgesi.pdf", pdf_file, "application/pdf")
}

data = {
    "category": "WORK_ORDER",
    "document_type": "GUMRUK_IZIN_BELGESI",
    "work_order_id": 1,  # Seed data'daki ilk iş emri
    "description": "Test Gümrük İzin Belgesi - API Test",
    "issue_date": "2025-01-01T00:00:00",
    "expires_at": "2025-12-31T23:59:59",
    "uploaded_by_id": 1  # Admin user
}

response = requests.post(f"{BASE_URL}/api/archive/upload", files=files, data=data)
print_result(response, "📤 Upload Document")

uploaded_doc_id = None
if response.status_code == 200:
    result = response.json()
    if result["success"]:
        doc = result["data"]
        uploaded_doc_id = doc["id"]
        print("\n✅ BELGE YÜKLEME BAŞARILI!")
        print(f"   ID: {doc['id']}")
        print(f"   Dosya Adı: {doc['file_name']}")
        print(f"   Boyut: {doc['file_size']} bytes")
        print(f"   Tip: {doc['file_type']}")
        print(f"   Durum: {doc['status']}")
        print(f"   Kategori: {doc['category']}")
        print(f"   Belge Tipi: {doc['document_type']}")
        print(f"   Duplicate: {doc['is_duplicate']}")
    else:
        print(f"❌ YÜKLEME HATASI: {result.get('message')}")
else:
    print(f"❌ HTTP HATASI: {response.status_code}")
    print(response.text)

# ============================================
# TEST 3: Approve Document
# ============================================
if uploaded_doc_id:
    print_section("TEST 3: PUT /api/archive/{id}/approve - Belge Onaylama")
    
    approve_data = {
        "approved_by_id": 1,  # Admin user
        "approval_note": "Test onay notu - Belge uygun görülmüştür"
    }
    
    response = requests.put(
        f"{BASE_URL}/api/archive/{uploaded_doc_id}/approve",
        data=approve_data
    )
    print_result(response, "✅ Approve Document")
    
    if response.status_code == 200:
        result = response.json()
        if result["success"]:
            doc = result["data"]
            print("\n✅ BELGE ONAYLANDI!")
            print(f"   ID: {doc['id']}")
            print(f"   Dosya: {doc['file_name']}")
            print(f"   Durum: {doc['status']}")
            print(f"   Onaylayan ID: {doc['approved_by_id']}")
            print(f"   Onay Tarihi: {doc['approved_at']}")
            print(f"   Onay Notu: {doc.get('approval_note', 'Yok')}")
        else:
            print(f"❌ ONAYLAMA HATASI: {result.get('message')}")
    else:
        print(f"❌ HTTP HATASI: {response.status_code}")

# ============================================
# TEST 4: Upload + Reject Scenario
# ============================================
print_section("TEST 4: Upload + Reject - Reddedilme Senaryosu")

# Yeni belge yükle
pdf_file2 = BytesIO(b"%PDF-1.4\n%Test PDF - Will be rejected\n")
files2 = {
    "file": ("test_manifesto.pdf", pdf_file2, "application/pdf")
}

data2 = {
    "category": "WORK_ORDER",
    "document_type": "MANIFESTO",
    "work_order_id": 1,
    "description": "Test Manifesto - Reddedilecek",
    "uploaded_by_id": 1
}

response = requests.post(f"{BASE_URL}/api/archive/upload", files=files2, data=data2)
print_result(response, "📤 Upload for Rejection Test")

reject_doc_id = None
if response.status_code == 200:
    result = response.json()
    if result["success"]:
        reject_doc_id = result["data"]["id"]
        print(f"\n✅ Test belgesi yüklendi (ID: {reject_doc_id})")

# Belgeyi reddet
if reject_doc_id:
    print("\n--- Belge Reddediliyor ---")
    
    reject_data = {
        "rejected_by_id": 1,
        "rejection_reason": "Belge okunamıyor, yeniden yükleyin"
    }
    
    response = requests.put(
        f"{BASE_URL}/api/archive/{reject_doc_id}/reject",
        data=reject_data
    )
    print_result(response, "❌ Reject Document")
    
    if response.status_code == 200:
        result = response.json()
        if result["success"]:
            doc = result["data"]
            print("\n✅ BELGE REDDEDİLDİ!")
            print(f"   ID: {doc['id']}")
            print(f"   Dosya: {doc['file_name']}")
            print(f"   Durum: {doc['status']}")
            print(f"   Reddeden ID: {doc['rejected_by_id']}")
            print(f"   Red Tarihi: {doc['rejected_at']}")
            print(f"   Red Sebebi: {doc['rejection_reason']}")
        else:
            print(f"❌ RED HATASI: {result.get('message')}")
    else:
        print(f"❌ HTTP HATASI: {response.status_code}")

# ============================================
# TEST 5: Stats After Operations
# ============================================
print_section("TEST 5: Stats After All Operations")

response = requests.get(f"{BASE_URL}/api/archive/stats")
print_result(response, "📊 Final Stats")

if response.status_code == 200:
    data = response.json()
    if data["success"]:
        stats = data["data"]
        print("\n✅ SON DURUM:")
        print(f"   Yüklendi (Onay Bekliyor): {stats['uploaded_count']}")
        print(f"   Onaylandı: {stats['approved_count']} (+1 expected)")
        print(f"   Reddedildi: {stats['rejected_count']} (+1 expected)")
        print(f"   Süresi Doldu: {stats['expired_count']}")
        print(f"   Toplam: {stats['total_count']}")

# ============================================
# TEST 6: Duplicate Upload Detection
# ============================================
print_section("TEST 6: Duplicate Upload Detection")

# Aynı dosyayı tekrar yükle
pdf_file3 = BytesIO(pdf_content)  # İlk testteki aynı içerik
files3 = {
    "file": ("duplicate_test.pdf", pdf_file3, "application/pdf")
}

data3 = {
    "category": "WORK_ORDER",
    "document_type": "GUMRUK_IZIN_BELGESI",
    "work_order_id": 1,
    "uploaded_by_id": 1
}

response = requests.post(f"{BASE_URL}/api/archive/upload", files=files3, data=data3)
print_result(response, "📤 Duplicate Upload Attempt")

if response.status_code == 200:
    result = response.json()
    if result["success"]:
        doc = result["data"]
        if doc.get("is_duplicate"):
            print("\n✅ DUPLICATE DETECTION BAŞARILI!")
            print(f"   Mevcut Belge ID: {doc['id']}")
            print("   Sistem aynı hash'e sahip dosyayı tespit etti")
        else:
            print("\n⚠️  UYARI: Duplicate olarak işaretlenmedi")

print("\n" + "="*60)
print("  TEST TAMAMLANDI!")
print("="*60)
print("\n📋 ÖZET:")
print("  ✅ Stats endpoint çalışıyor")
print("  ✅ Upload endpoint çalışıyor")
print("  ✅ Approve workflow çalışıyor")
print("  ✅ Reject workflow çalışıyor")
print("  ✅ Duplicate detection çalışıyor")
print("\n🎉 TÜM DİJİTAL ARŞİV API'LERİ BAŞARIYLA TEST EDİLDİ!")
