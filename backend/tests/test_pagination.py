"""Pagination ve meta testleri (Cari, Hizmet, Tarife)."""
from fastapi.testclient import TestClient

def test_cari_pagination(client: TestClient):
    resp = client.get("/api/cari?page=1&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert "pagination" in data
    assert data["pagination"]["page"] == 1

def test_hizmet_pagination(client: TestClient):
    resp = client.get("/api/hizmet?page=1&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert "pagination" in data

