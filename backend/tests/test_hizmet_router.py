import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from aliaport_api.modules.hizmet.models import Hizmet
from aliaport_api.modules.tarife.models import PriceList, PriceListItem

pytestmark = [pytest.mark.api]


def create_hizmet(db: Session, **kwargs) -> Hizmet:
    base = {
        "Kod": f"HZ{len(list(db.query(Hizmet).all())) + 1:03d}",
        "Ad": "Test Hizmet",
        "Aciklama": "Açıklama",
        "AktifMi": True,
        "ParaBirimi": "TRY",
    }
    base.update(kwargs)
    obj = Hizmet(**base)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_price_list_with_item(db: Session, hizmet: Hizmet) -> PriceListItem:
    pl = PriceList(Kod="PL-HIZMET", Ad="Test Tarife", ParaBirimi="TRY")
    db.add(pl)
    db.commit()
    db.refresh(pl)
    item = PriceListItem(
        PriceListId=pl.Id,
        HizmetKodu=hizmet.Kod,
        HizmetAdi=hizmet.Ad,
        BirimFiyat=100,
        KdvOrani=20
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


class TestHizmetRouter:
    base_url = "/api/hizmet"

    def test_list_empty(self, client: TestClient):
        r = client.get(self.base_url + "/")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"] == []
        assert body["pagination"]["total"] == 0

    def test_create_success(self, client: TestClient):
        payload = {
            "Kod": "HIZ001",
            "Ad": "Römorkaj",
            "Aciklama": "Römorkaj hizmeti",
            "AktifMi": True,
            "ParaBirimi": "TRY"
        }
        r = client.post(self.base_url + "/", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["data"]["Kod"] == "HIZ001"

    def test_create_duplicate_kod(self, client: TestClient, db: Session):
        create_hizmet(db, Kod="DUPHIZ", Ad="A")
        payload = {
            "Kod": "DUPHIZ",
            "Ad": "B",
            "AktifMi": True,
            "ParaBirimi": "TRY"
        }
        r = client.post(self.base_url + "/", json=payload)
        assert r.status_code == 409
        assert r.json()["detail"]["error"]["code"] == "HIZMET_DUPLICATE_CODE"

    def test_get_not_found(self, client: TestClient):
        r = client.get(self.base_url + "/999999")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "HIZMET_NOT_FOUND"

    def test_get_success(self, client: TestClient, db: Session):
        h = create_hizmet(db, Kod="GETHZ", Ad="Get Hizmet")
        r = client.get(f"{self.base_url}/{h.Id}")
        assert r.status_code == 200
        assert r.json()["data"]["Kod"] == "GETHZ"

    def test_update_success(self, client: TestClient, db: Session):
        h = create_hizmet(db, Kod="UPDHZ", Ad="Old Ad")
        r = client.put(f"{self.base_url}/{h.Id}", json={"Ad": "New Ad", "Fiyat": 250.75})
        assert r.status_code == 200
        body = r.json()["data"]
        assert body["Ad"] == "New Ad"
        assert float(body["Fiyat"]) == 250.75

    def test_update_not_found(self, client: TestClient):
        r = client.put(self.base_url + "/888888", json={"Ad": "X"})
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "HIZMET_NOT_FOUND"

    def test_update_duplicate_kod(self, client: TestClient, db: Session):
        h1 = create_hizmet(db, Kod="UPD1", Ad="A")
        h2 = create_hizmet(db, Kod="UPD2", Ad="B")
        r = client.put(f"{self.base_url}/{h2.Id}", json={"Kod": "UPD1"})
        assert r.status_code == 409
        assert r.json()["detail"]["error"]["code"] == "HIZMET_DUPLICATE_CODE"

    def test_delete_in_use_blocked(self, client: TestClient, db: Session):
        h = create_hizmet(db, Kod="DELUSE", Ad="In Use")
        create_price_list_with_item(db, h)
        r = client.delete(f"{self.base_url}/{h.Id}")
        # HIZMET_INACTIVE error code not mapped → HTTP 500 default
        assert r.status_code == 500
        detail = r.json()["detail"]
        assert detail["error"]["code"] == "HIZMET_INACTIVE"

    def test_delete_success(self, client: TestClient, db: Session):
        h = create_hizmet(db, Kod="DELSUCC", Ad="To Delete")
        r = client.delete(f"{self.base_url}/{h.Id}")
        assert r.status_code == 200
        assert r.json()["data"]["deleted"] is True
        r2 = client.get(f"{self.base_url}/{h.Id}")
        assert r2.status_code == 404

    def test_delete_not_found(self, client: TestClient):
        r = client.delete(self.base_url + "/777777")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "HIZMET_NOT_FOUND"

    def test_list_filters_and_search(self, client: TestClient, db: Session):
        create_hizmet(db, Kod="SRCH_A", Ad="Alpha", AktifMi=True)
        create_hizmet(db, Kod="SRCH_B", Ad="Beta", AktifMi=False)
        create_hizmet(db, Kod="SRCH_C", Ad="Gamma", AktifMi=True)

        r_active = client.get(self.base_url + "?is_active=true")
        assert r_active.status_code == 200
        active_codes = {h["Kod"] for h in r_active.json()["data"]}
        assert "SRCH_B" not in active_codes

        r_inactive = client.get(self.base_url + "?is_active=false")
        assert r_inactive.status_code == 200
        inactive_codes = {h["Kod"] for h in r_inactive.json()["data"]}
        assert "SRCH_B" in inactive_codes

        r_search_code = client.get(self.base_url + "?search=SRCH_C")
        assert r_search_code.status_code == 200
        assert len(r_search_code.json()["data"]) == 1
        assert r_search_code.json()["data"][0]["Kod"] == "SRCH_C"

        r_search_name = client.get(self.base_url + "?search=Alpha")
        assert r_search_name.status_code == 200
        codes = {h["Kod"] for h in r_search_name.json()["data"]}
        assert "SRCH_A" in codes

    def test_pagination_meta(self, client: TestClient, db: Session):
        for i in range(5):
            create_hizmet(db, Kod=f"PAGE_{i}")
        r = client.get(self.base_url + "?page=1&page_size=2")
        assert r.status_code == 200
        body = r.json()
        assert len(body["data"]) == 2
        assert body["pagination"]["page"] == 1
        assert body["pagination"]["total"] >= 5
