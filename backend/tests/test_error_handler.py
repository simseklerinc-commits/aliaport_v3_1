"""Global error handler: sentetik hata ve validation error testi."""
from fastapi.testclient import TestClient

def test_global_500_error(client: TestClient):
    resp = client.get("/api/parametre/trigger-error")  # Varsayalım bu endpoint bilinçli hata fırlatıyor
    assert resp.status_code == 500
    data = resp.json()
    assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"

def test_validation_error(client: TestClient):
    resp = client.post("/api/cari", json={"CariKod": 123})  # string beklerken int
    assert resp.status_code == 422
    data = resp.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
