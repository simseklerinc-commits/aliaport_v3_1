"""Hizmet modülü: duplicate ve not found testleri."""
from fastapi.testclient import TestClient

def test_hizmet_duplicate_create(client: TestClient, db):
    from aliaport_api.modules.hizmet.models import Hizmet
    h = Hizmet(Kod="H001", Ad="Test", Birim="SAAT", ParaBirimi="TRY", AktifMi=True)
    db.add(h)
    db.commit()
    # Duplicate create
    resp = client.post("/api/hizmet", json={"Kod": "H001", "Ad": "Test", "Birim": "SAAT", "ParaBirimi": "TRY", "AktifMi": True})
    assert resp.status_code == 409

def test_hizmet_not_found(client: TestClient):
    resp = client.get("/api/hizmet/9999")
    assert resp.status_code == 404
