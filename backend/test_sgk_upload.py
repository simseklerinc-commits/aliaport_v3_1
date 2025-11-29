"""
SGK PDF yükleme test scripti - Çok satırlı parser testi
"""
import requests
from pathlib import Path

# API config
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
UPLOAD_URL = f"{BASE_URL}/api/v1/portal/sgk/upload"

# PDF path
PDF_PATH = r"c:\Aliaport\Aliaport_v3_1\ŞİMŞEKLER AŞ 202510 - EKİM TUZLA HİZMET LİSTESİ_251128_183430.pdf"

def test_sgk_upload():
    # 1. Login
    print("🔐 Login yapılıyor...")
    login_data = {
        "username": "test@aliaport.com",
        "password": "Test123!"
    }
    
    response = requests.post(LOGIN_URL, json=login_data)
    if response.status_code != 200:
        print(f"❌ Login başarısız: {response.status_code}")
        print(response.text)
        return
    
    token = response.json()["access_token"]
    print(f"✅ Login başarılı: {token[:20]}...")
    
    # 2. SGK PDF yükle
    print("\n📄 SGK PDF yükleniyor...")
    headers = {"Authorization": f"Bearer {token}"}
    
    pdf_path = Path(PDF_PATH)
    if not pdf_path.exists():
        print(f"❌ PDF bulunamadı: {PDF_PATH}")
        return
    
    with open(pdf_path, "rb") as f:
        files = {"file": (pdf_path.name, f, "application/pdf")}
        response = requests.post(UPLOAD_URL, headers=headers, files=files)
    
    print(f"\n📊 Response Status: {response.status_code}")
    print(f"📊 Response Body:")
    print(response.json())
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ BAŞARILI!")
        print(f"   Dönem: {result.get('period')}")
        print(f"   Yeni kayıt: {result.get('new_count')}")
        print(f"   Güncelleme: {result.get('updated_count')}")
        print(f"   Toplam: {result.get('total_count')}")
        print(f"\n   📋 İlk 5 çalışan:")
        for emp in result.get('employees', [])[:5]:
            print(f"      {emp['tc_no']}: {emp['full_name']}")
    else:
        print(f"❌ HATA!")
        print(response.text)

if __name__ == "__main__":
    test_sgk_upload()
