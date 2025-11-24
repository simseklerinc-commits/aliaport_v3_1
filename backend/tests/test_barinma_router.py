import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from aliaport_api.modules.motorbot.models import Motorbot
from aliaport_api.modules.barinma.models import BarinmaContract

pytestmark = [pytest.mark.api]


def create_motorbot(db: Session, **kwargs) -> Motorbot:
    data = {
        "Kod": f"MBBAR{len(list(db.query(Motorbot).all())) + 1:03d}",
        "Ad": "Barinma Test Motorbot",
        "Durum": "AKTIF",
    }
    data.update(kwargs)
    obj = Motorbot(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_contract(db: Session, **kwargs) -> BarinmaContract:
    base = {
        "ContractNumber": f"CNT-{len(list(db.query(BarinmaContract).all())) + 1:03d}",
        "MotorbotId": kwargs.get("MotorbotId") or create_motorbot(db).Id,
        "CariId": 1,
        "ServiceCardId": 1,
        "PriceListId": 1,
        "StartDate": date.today(),
        "EndDate": None,
        "UnitPrice": 1500.00,
        "Currency": "TRY",
        "VatRate": 20.00,
        "BillingPeriod": "MONTHLY",
        "IsActive": True,
        "Notes": None,
    }
    base.update(kwargs)
    obj = BarinmaContract(**base)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


class TestBarinmaRouter:
    base_url = "/api/barinma"

    def test_list_empty(self, client: TestClient):
        r = client.get(self.base_url + "/")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"] == []
        assert body["pagination"]["total"] == 0

    def test_create_success(self, client: TestClient, db: Session):
        mb = create_motorbot(db, Kod="MBBAR_CREATE")
        payload = {
            "ContractNumber": "CNT-001",
            "MotorbotId": mb.Id,
            "CariId": 1,
            "ServiceCardId": 1,
            "PriceListId": 1,
            "StartDate": str(date.today()),
            "UnitPrice": 2000.50,
            "Currency": "TRY",
            "VatRate": 20.00,
            "BillingPeriod": "MONTHLY",
            "IsActive": True,
            "Notes": "Test kontrat"
        }
        r = client.post(self.base_url + "/", json=payload)
        assert r.status_code == 200, r.text  # success_response uses 200
        body = r.json()
        assert body["data"]["ContractNumber"] == "CNT-001"
        assert body["data"]["MotorbotId"] == mb.Id

    def test_duplicate_contract_number(self, client: TestClient, db: Session):
        # First create
        mb = create_motorbot(db, Kod="MBBAR_DUP")
        create_contract(db, ContractNumber="CNT-DUP", MotorbotId=mb.Id)
        # Attempt duplicate via API
        payload = {
            "ContractNumber": "CNT-DUP",
            "MotorbotId": mb.Id,
            "CariId": 1,
            "ServiceCardId": 1,
            "PriceListId": 1,
            "StartDate": str(date.today()),
            "UnitPrice": 1800.00,
            "Currency": "TRY",
            "VatRate": 20.00,
            "BillingPeriod": "MONTHLY",
            "IsActive": True
        }
        r = client.post(self.base_url + "/", json=payload)
        # Mapping for BARINMA_DUPLICATE_CONTRACT missing → defaults to 500
        assert r.status_code == 500
        body = r.json()
        assert body["detail"]["error"]["code"] == "BARINMA_DUPLICATE_CONTRACT"

    def test_get_contract_not_found(self, client: TestClient):
        r = client.get(self.base_url + "/999999")
        assert r.status_code == 404
        body = r.json()
        assert body["detail"]["error"]["code"] == "BARINMA_NOT_FOUND"

    def test_get_contract_success(self, client: TestClient, db: Session):
        c = create_contract(db)
        r = client.get(f"{self.base_url}/{c.Id}")
        assert r.status_code == 200
        assert r.json()["data"]["Id"] == c.Id

    def test_update_contract_success(self, client: TestClient, db: Session):
        c = create_contract(db, UnitPrice=1000.00)
        r = client.put(f"{self.base_url}/{c.Id}", json={"UnitPrice": 1250.75})
        assert r.status_code == 200
        assert float(r.json()["data"]["UnitPrice"]) == 1250.75

    def test_update_contract_not_found(self, client: TestClient):
        r = client.put(self.base_url + "/888888", json={"UnitPrice": 111})
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "BARINMA_NOT_FOUND"

    def test_update_duplicate_contract_number(self, client: TestClient, db: Session):
        c1 = create_contract(db, ContractNumber="CNT-UPD-1")
        c2 = create_contract(db, ContractNumber="CNT-UPD-2")
        r = client.put(f"{self.base_url}/{c2.Id}", json={"ContractNumber": "CNT-UPD-1"})
        assert r.status_code == 500
        assert r.json()["detail"]["error"]["code"] == "BARINMA_DUPLICATE_CONTRACT"

    def test_delete_contract_success(self, client: TestClient, db: Session):
        c = create_contract(db)
        r = client.delete(f"{self.base_url}/{c.Id}")
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["deleted"] is True
        # verify gone
        r2 = client.get(f"{self.base_url}/{c.Id}")
        assert r2.status_code == 404

    def test_delete_contract_not_found(self, client: TestClient):
        r = client.delete(self.base_url + "/777777")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "BARINMA_NOT_FOUND"

    def test_list_with_filters_and_search(self, client: TestClient, db: Session):
        mb1 = create_motorbot(db, Kod="MBBAR_F1")
        mb2 = create_motorbot(db, Kod="MBBAR_F2")
        create_contract(db, ContractNumber="CNT-FILT-A", MotorbotId=mb1.Id, CariId=10, IsActive=True)
        create_contract(db, ContractNumber="CNT-FILT-B", MotorbotId=mb1.Id, CariId=20, IsActive=False)
        create_contract(db, ContractNumber="CNT-FILT-C", MotorbotId=mb2.Id, CariId=10, IsActive=True)

        # Filter by is_active
        r_active = client.get(self.base_url + "/?is_active=true")
        assert r_active.status_code == 200
        active_ids = {item["ContractNumber"] for item in r_active.json()["data"]}
        assert "CNT-FILT-B" not in active_ids

        # Filter by motorbot_id
        r_mb = client.get(self.base_url + f"/?motorbot_id={mb1.Id}")
        assert r_mb.status_code == 200
        mb_items = {item["ContractNumber"] for item in r_mb.json()["data"]}
        assert mb_items.issubset({"CNT-FILT-A", "CNT-FILT-B"})

        # Filter by cari_id
        r_cari = client.get(self.base_url + "?cari_id=10")
        assert r_cari.status_code == 200
        cari_nums = {item["ContractNumber"] for item in r_cari.json()["data"]}
        assert "CNT-FILT-A" in cari_nums and "CNT-FILT-C" in cari_nums

        # Search
        r_search = client.get(self.base_url + "?search=FILT-C")
        assert r_search.status_code == 200
        assert len(r_search.json()["data"]) == 1
        assert r_search.json()["data"][0]["ContractNumber"] == "CNT-FILT-C"

    def test_active_contract_by_motorbot(self, client: TestClient, db: Session):
        mb = create_motorbot(db, Kod="MBBAR_ACT")
        # No contract yet
        r_none = client.get(f"{self.base_url}/motorbot/{mb.Id}/active")
        assert r_none.status_code == 200
        assert r_none.json()["data"] is None
        # Create inactive contract
        create_contract(db, MotorbotId=mb.Id, IsActive=False, ContractNumber="CNT-ACT-INACTIVE")
        r_inactive = client.get(f"{self.base_url}/motorbot/{mb.Id}/active")
        assert r_inactive.status_code == 200
        assert r_inactive.json()["data"] is None
        # Create active contract
        create_contract(db, MotorbotId=mb.Id, IsActive=True, ContractNumber="CNT-ACT-ACTIVE")
        r_active = client.get(f"{self.base_url}/motorbot/{mb.Id}/active")
        assert r_active.status_code == 200
        assert r_active.json()["data"]["ContractNumber"] == "CNT-ACT-ACTIVE"
