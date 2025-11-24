import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from aliaport_api.modules.motorbot.models import Motorbot, MbTrip

pytestmark = [pytest.mark.api]


def create_motorbot(db: Session, **kwargs) -> Motorbot:
    data = {
        "Kod": f"MBLEG{len(list(db.query(Motorbot).all())) + 1:03d}",
        "Ad": "Legacy Motorbot",
        "Durum": "AKTIF",
    }
    data.update(kwargs)
    obj = Motorbot(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_trip(db: Session, mb: Motorbot, **kwargs) -> MbTrip:
    base = {
        "MotorbotId": mb.Id,
        "SeferTarihi": date.today(),
        "Durum": "PLANLANDI",
        "KalkisIskele": "A",
        "VarisIskele": "B",
        "CikisZamani": datetime.utcnow(),
        "DonusZamani": datetime.utcnow() + timedelta(hours=2),
    }
    base.update(kwargs)
    trip = MbTrip(**base)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


class TestSeferLegacyRouter:
    base_url = "/api/mb-trip"

    def test_list_empty(self, client: TestClient):
        r = client.get(self.base_url + "/")
        assert r.status_code == 200
        assert r.json() == []

    def test_create_success(self, client: TestClient, db: Session):
        mb = create_motorbot(db, Kod="MBLEG_CREATE")
        payload = {
            "MotorbotId": mb.Id,
            "SeferTarihi": str(date.today()),
            "Durum": "PLANLANDI",
            "KalkisIskele": "A",
            "VarisIskele": "B"
        }
        r = client.post(self.base_url + "/", json=payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["MotorbotId"] == mb.Id
        assert body["Durum"] == "PLANLANDI"
        assert body["KalkisIskele"] == "A"

    def test_get_not_found(self, client: TestClient):
        r = client.get(self.base_url + "/999999")
        assert r.status_code == 404
        assert "Sefer kaydı bulunamadı" in r.json()["detail"]

    def test_get_by_id(self, client: TestClient, db: Session):
        mb = create_motorbot(db, Kod="MBLEG_GET")
        trip = create_trip(db, mb)
        r = client.get(f"{self.base_url}/{trip.Id}")
        assert r.status_code == 200
        body = r.json()
        assert body["Id"] == trip.Id
        assert body["MotorbotId"] == mb.Id

    def test_update_success(self, client: TestClient, db: Session):
        mb = create_motorbot(db, Kod="MBLEG_UPD")
        trip = create_trip(db, mb, Durum="PLANLANDI")
        r = client.put(f"{self.base_url}/{trip.Id}", json={"Durum": "TAMAMLANDI"})
        assert r.status_code == 200
        assert r.json()["Durum"] == "TAMAMLANDI"

    def test_update_not_found(self, client: TestClient):
        r = client.put(self.base_url + "/888888", json={"Durum": "X"})
        assert r.status_code == 404

    def test_delete_success(self, client: TestClient, db: Session):
        mb = create_motorbot(db, Kod="MBLEG_DEL")
        trip = create_trip(db, mb)
        r = client.delete(f"{self.base_url}/{trip.Id}")
        assert r.status_code == 204
        assert r.text == ""

    def test_delete_not_found(self, client: TestClient):
        r = client.delete(self.base_url + "/777777")
        assert r.status_code == 404

    def test_list_after_creations(self, client: TestClient, db: Session):
        mb = create_motorbot(db, Kod="MBLEG_LIST")
        create_trip(db, mb)
        create_trip(db, mb)
        r = client.get(self.base_url + "/")
        assert r.status_code == 200
        assert len(r.json()) >= 2
        # Check ordering (latest SeferTarihi first)
        trips = r.json()
        if len(trips) >= 2:
            d0 = datetime.fromisoformat(trips[0]["SeferTarihi"]).date() if isinstance(trips[0]["SeferTarihi"], str) else trips[0]["SeferTarihi"]
            d1 = datetime.fromisoformat(trips[1]["SeferTarihi"]).date() if isinstance(trips[1]["SeferTarihi"], str) else trips[1]["SeferTarihi"]
            assert d0 >= d1
