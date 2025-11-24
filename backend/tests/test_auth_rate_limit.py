"""Auth rate limiting testi: /auth/login endpoint 10/dakika limitini doğrular.

Senaryo:
 1. Test kullanıcı oluştur (email+şifre)
 2. Aynı IP'den art arda 10 başarılı login isteği gönder (status 200 beklenir)
 3. 11. istek 429 ve RATE_LIMIT_EXCEEDED hata kodu ile dönmeli

Notlar:
 - Limiter key_func login aşamasında IP bazlı (auth yok), bu nedenle ardışık istekler tek anahtar altında toplanır.
 - In-memory SQLite ve test client tek thread olduğundan deterministik.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from aliaport_api.modules.auth.models import User
from aliaport_api.modules.auth.utils import hash_password


def _create_login_user(db: Session):
    user = User(
        email="ratelimit_user@aliaport.com",
        hashed_password=hash_password("RateLimit123!"),
        full_name="Rate Limit User",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_login_rate_limit_exceeded(client: TestClient, db: Session):
    # Hazırlık: Kullanıcı oluştur
    _create_login_user(db)

    url = "/auth/login"
    payload = {"email": "ratelimit_user@aliaport.com", "password": "RateLimit123!"}

    # İlk 10 istek: başarılı olmalı
    success_count = 0
    for i in range(10):
        resp = client.post(url, json=payload)
        assert resp.status_code == 200, f"{i+1}. istekte beklenmeyen durum: {resp.status_code} -> {resp.text}"
        success_count += 1

    assert success_count == 10, "İlk 10 istek başarıyla tamamlanmalıydı"

    # 11. istek: limit aşımı
    resp_exceeded = client.post(url, json=payload)
    assert resp_exceeded.status_code == 429, f"Limit aşımı bekleniyordu: {resp_exceeded.status_code}"
    data = resp_exceeded.json()
    assert data.get("error", {}).get("code") == "RATE_LIMIT_EXCEEDED", data
    assert data.get("success") is False
    assert "policy" in data.get("error", {}).get("details", {}), "policy detayı yok"

    # Tekrar eden bir istek daha (12.) aynı şekilde 429 verebilir
    resp_again = client.post(url, json=payload)
    assert resp_again.status_code == 429, f"Tekrar isteğinde de limit bekleniyordu: {resp_again.status_code}"
