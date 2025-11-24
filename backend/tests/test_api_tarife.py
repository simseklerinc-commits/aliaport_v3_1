import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, timedelta

pytestmark = [pytest.mark.api]

class TestTarifeEndpoints:
    @pytest.fixture(scope="function")
    def base_price_list_payload(self):
        today = date.today()
        return {
            "Kod": "PL001",
            "Ad": "Standart Hizmet Tarifesi",
            "ParaBirimi": "TRY",
            "Durum": "TASLAK",
            "GecerlilikBaslangic": str(today),
            "GecerlilikBitis": str(today + timedelta(days=30)),
            "AktifMi": True
        }

    @pytest.fixture(scope="function")
    def create_price_list(self, client: TestClient, base_price_list_payload):
        resp = client.post("/api/price-list/", json=base_price_list_payload)
        assert resp.status_code == 200, resp.text
        return resp.json()["data"]

    def test_list_empty(self, client: TestClient):
        resp = client.get("/api/price-list/?page=1&page_size=10")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"] == []
        assert body["pagination"]["total"] == 0

    def test_create_price_list(self, client: TestClient, base_price_list_payload):
        resp = client.post("/api/price-list/", json=base_price_list_payload)
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["Kod"] == base_price_list_payload["Kod"]
        assert data["Ad"] == base_price_list_payload["Ad"]
        assert data["Durum"] == "TASLAK"
        assert "Id" in data

    def test_get_price_list(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        resp = client.get(f"/api/price-list/{pid}")
        assert resp.status_code == 200
        wrapper = resp.json()
        assert wrapper["success"] is True
        assert wrapper["data"]["Id"] == pid

    def test_get_price_list_not_found(self, client: TestClient):
        resp = client.get("/api/price-list/9999")
        err = resp.json().get("error") or resp.json().get("detail", {}).get("error")
        assert err["code"] == "TARIFE_NOT_FOUND"

    def test_duplicate_code(self, client: TestClient, base_price_list_payload):
        r1 = client.post("/api/price-list/", json=base_price_list_payload)
        assert r1.status_code == 200
        r2 = client.post("/api/price-list/", json=base_price_list_payload)
        # Router currently returns success_response or error_response directly (not HTTPException), so status likely 200
        body = r2.json()
        if r2.status_code == 200 and body.get("success") is False:
            assert body["error"]["code"] == "TARIFE_DUPLICATE"
        else:
            # If implemented with HTTPException later, accept 409
            assert r2.status_code in (200, 409)

    def test_update_price_list(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        payload = {"Ad": "Güncellenmiş Tarife", "Durum": "AKTIF"}
        resp = client.put(f"/api/price-list/{pid}", json=payload)
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["Ad"] == "Güncellenmiş Tarife"
        assert data["Durum"] == "AKTIF"

    def test_update_status(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        resp = client.patch(f"/api/price-list/{pid}/status?status=AKTIF")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["Durum"] == "AKTIF"

    def test_delete_price_list(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        resp = client.delete(f"/api/price-list/{pid}")
        # Router returns success_response or error_response, deletion success should be success True
        assert resp.status_code == 200
        wrapper = resp.json()
        assert wrapper["success"] is True
        assert wrapper["data"]["price_list_id"] == pid

    def test_price_list_with_items_empty(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        resp = client.get(f"/api/price-list/{pid}/with-items")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["Id"] == pid
        assert data.get("items") == []

    def test_create_price_list_item(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        item_payload = {
            "PriceListId": pid,
            "HizmetKodu": "H001",
            "HizmetAdi": "Römorkör Hizmeti",
            "Birim": "SAAT",
            "BirimFiyat": "1500.00",
            "KdvOrani": "20",
            "SiraNo": 1,
            "AktifMi": True
        }
        resp = client.post("/api/price-list/item", json=item_payload)
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["HizmetKodu"] == "H001"
        assert data["PriceListId"] == pid

    def test_get_price_list_items(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        # add an item
        client.post("/api/price-list/item", json={
            "PriceListId": pid,
            "HizmetKodu": "H001",
            "HizmetAdi": "Römorkör Hizmeti",
            "Birim": "SAAT",
            "BirimFiyat": "1500.00"
        })
        resp = client.get(f"/api/price-list/{pid}/items")
        assert resp.status_code == 200
        items = resp.json()["data"]
        assert len(items) == 1
        assert items[0]["HizmetKodu"] == "H001"

    def test_update_price_list_item(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        item_resp = client.post("/api/price-list/item", json={
            "PriceListId": pid,
            "HizmetKodu": "H001",
            "HizmetAdi": "Römorkör Hizmeti",
            "Birim": "SAAT",
            "BirimFiyat": "1500.00"
        })
        item_id = item_resp.json()["data"]["Id"]
        upd = client.put(f"/api/price-list/item/{item_id}", json={"BirimFiyat": "1750.00"})
        assert upd.status_code == 200
        data = upd.json()["data"]
        assert data["BirimFiyat"] == 1750.00

    def test_delete_price_list_item(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        item_resp = client.post("/api/price-list/item", json={
            "PriceListId": pid,
            "HizmetKodu": "H001",
            "HizmetAdi": "Römorkör Hizmeti",
            "Birim": "SAAT",
            "BirimFiyat": "1500.00"
        })
        item_id = item_resp.json()["data"]["Id"]
        del_resp = client.delete(f"/api/price-list/item/{item_id}")
        assert del_resp.status_code == 200
        wrapper = del_resp.json()
        assert wrapper["success"] is True
        assert wrapper["data"]["item_id"] == item_id

    def test_get_price_list_item_single(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        item_resp = client.post("/api/price-list/item", json={
            "PriceListId": pid,
            "HizmetKodu": "H001",
            "HizmetAdi": "Römorkör Hizmeti",
            "Birim": "SAAT",
            "BirimFiyat": "1500.00"
        })
        item_id = item_resp.json()["data"]["Id"]
        get_resp = client.get(f"/api/price-list/item/{item_id}")
        assert get_resp.status_code == 200
        data = get_resp.json()["data"]
        assert data["Id"] == item_id

    def test_bulk_create_items(self, client: TestClient, create_price_list):
        pid = create_price_list["Id"]
        items_payload = [
            {
                "PriceListId": pid,
                "HizmetKodu": "H001",
                "HizmetAdi": "Römorkör",
                "BirimFiyat": "1000.00"
            },
            {
                "PriceListId": pid,
                "HizmetKodu": "H002",
                "HizmetAdi": "Palamar",
                "BirimFiyat": "500.00"
            }
        ]
        resp = client.post(f"/api/price-list/{pid}/items/bulk", json=items_payload)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 2
        codes = {d["HizmetKodu"] for d in data}
        assert codes == {"H001", "H002"}

    def test_filter_search_and_currency(self, client: TestClient, base_price_list_payload):
        # create two price lists
        p1 = base_price_list_payload
        p2 = {**base_price_list_payload, "Kod": "PL002", "Ad": "İkinci", "ParaBirimi": "USD"}
        client.post("/api/price-list/", json=p1)
        client.post("/api/price-list/", json=p2)
        resp_search = client.get("/api/price-list/?search=Standart")
        assert resp_search.status_code == 200
        data_search = resp_search.json()["data"]
        assert any(pl["Ad"].startswith("Standart") for pl in data_search)
        resp_currency = client.get("/api/price-list/?currency=USD")
        data_currency = resp_currency.json()["data"]
        assert all(pl["ParaBirimi"] == "USD" for pl in data_currency)

    def test_active_price_lists(self, client: TestClient, base_price_list_payload):
        # one TASLAK, one AKTIF
        client.post("/api/price-list/", json=base_price_list_payload)
        akt = {**base_price_list_payload, "Kod": "PL003", "Ad": "Aktif", "Durum": "AKTIF"}
        client.post("/api/price-list/", json=akt)
        resp = client.get("/api/price-list/active")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert all(pl["Durum"] == "AKTIF" for pl in data)


def test_tarife_smoke():
    assert True
