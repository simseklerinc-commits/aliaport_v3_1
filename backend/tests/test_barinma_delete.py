"""Barınma modülü: silme ve ilişkili kayıt testi."""
from fastapi.testclient import TestClient

def test_barinma_delete(client: TestClient, db):
    # Barınma kontratı oluştur
    from aliaport_api.modules.barinma.models import BarinmaContract
    contract = BarinmaContract(
        kontrat_no="B001",
        cari_id=1,
        baslangic_tarihi="2025-11-01",
        bitis_tarihi="2025-12-01",
        aktif_mi=True
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    # Silme isteği
    resp = client.delete(f"/api/barinma/{contract.id}")
    assert resp.status_code in (200, 204)
    # Tekrar silme: not found
    resp2 = client.delete(f"/api/barinma/{contract.id}")
    assert resp2.status_code == 404
