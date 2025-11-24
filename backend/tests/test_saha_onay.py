"""Saha modülü: onay/ret ve tarih filtre testleri."""
from fastapi.testclient import TestClient

def test_saha_onay_ret(client: TestClient, db):
    from aliaport_api.modules.saha.models import WorkLog
    log = WorkLog(
        wo_id=1,
        personel_id=1,
        baslangic="2025-11-23T10:00:00Z",
        bitis="2025-11-23T12:00:00Z",
        onay_durumu="BEKLIYOR"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    # Onayla
    resp = client.post(f"/api/worklog/{log.id}/onayla")
    assert resp.status_code == 200
    # Ret et
    resp2 = client.post(f"/api/worklog/{log.id}/ret")
    assert resp2.status_code == 200

def test_saha_tarih_filtre(client: TestClient):
    resp = client.get("/api/worklog?baslangic=2025-11-01&bitis=2025-11-30")
    assert resp.status_code == 200
