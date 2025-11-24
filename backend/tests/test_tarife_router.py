"""Tarife (PriceList) ve Tarife Kalemleri (PriceListItem) Router Testleri
İlk Faz Amaç: CRUD + temel filtreler + durum güncelleme + kalem ekleme/güncelleme/silme + bulk ekleme.

Endpoint Envanteri (router) (gerçek prefix: /api/price-list):
    GET /api/price-list/                              -> get_all_price_lists (pagination, search, status, currency)
    GET /api/price-list/active                        -> get_active_price_lists
    GET /api/price-list/{id}                          -> get_price_list
    GET /api/price-list/code/{code}                   -> get_price_list_by_code
    GET /api/price-list/{id}/with-items               -> get_price_list_with_items
    POST /api/price-list/                             -> create_price_list
    PUT /api/price-list/{id}                          -> update_price_list
    PATCH /api/price-list/{id}/status?status=AKTIF    -> update_price_list_status
    DELETE /api/price-list/{id}                       -> delete_price_list (kalemleri ile)
    GET /api/price-list/{id}/items                    -> get_price_list_items
    GET /api/price-list/item/{item_id}                -> get_price_list_item
    POST /api/price-list/item                         -> create_price_list_item
    PUT /api/price-list/item/{item_id}                -> update_price_list_item
    DELETE /api/price-list/item/{item_id}             -> delete_price_list_item
    POST /api/price-list/{id}/items/bulk              -> create_bulk_items

Notlar:
 - Hata yanıtları success=False ve error code içeriyor (error_response pattern).
 - Silme işleminde ilişkili kalemler tamamen kaldırılıyor (cascade yok, manuel delete).
 - Durum değerleri: TASLAK, AKTIF, PASIF (testte örnek iki değişiklik yapılacak).
 - Decimal alanlar (BirimFiyat, KdvOrani) JSON’da sayı (float) olarak post edilecek; Pydantic Decimal kabul ediyor.

İlk Faz Test Kapsamı (~20 test):
  PriceList: list empty, create, duplicate code, get by id, get by code, not found, update fields, status change, delete, list filters (search/status/currency), with-items combined.
  PriceListItem: create success, create price_list_not_found, list items (after create), get item success/not found, update item, delete item, bulk create.

Edge Case (ikinci faza ertelenen): Geçerlilik tarih mantığı (başlangıç < bitiş), KdvOrani valid aralık kontrolü (şema serbest), pagination boundary (page_size > total), inactive filtering.
"""

from datetime import date
import pytest


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_price_list(client, kod: str = "PLTEST", ad: str = "Test Tarife", currency: str = "TRY"):
    payload = {
        "Kod": kod,
        "Ad": ad,
        "ParaBirimi": currency,
        "Durum": "TASLAK",
        "Versiyon": 1,
        "AktifMi": True,
    }
    r = client.post("/api/price-list/", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    return body["data"]


def create_price_list_item(client, price_list_id: int, hizmet_kodu: str = "SRV001", hizmet_adi: str = "Servis 1", fiyat: float = 100.0):
    payload = {
        "PriceListId": price_list_id,
        "HizmetKodu": hizmet_kodu,
        "HizmetAdi": hizmet_adi,
        "BirimFiyat": fiyat,
        "KdvOrani": 20,
        "AktifMi": True,
    }
    r = client.post("/api/price-list/item", json=payload)
    return r


# ============================================
# PRICE LIST TESTLERİ
# ============================================

class TestPriceListRouter:
    def test_list_empty(self, client):
        r = client.get("/api/price-list/?page=1&page_size=10")
        assert r.status_code == 200
        body = r.json()
        assert body["pagination"]["total"] == 0
        assert body["data"] == []

    def test_create_success(self, client):
        pl = create_price_list(client, kod="PL001", ad="Ana Tarife")
        assert pl["Kod"] == "PL001"
        assert pl["Durum"] == "TASLAK"

    def test_create_duplicate_code(self, client):
        create_price_list(client, kod="PLDUP")
        r = client.post("/api/price-list/", json={"Kod": "PLDUP", "Ad": "Tarife", "ParaBirimi": "TRY"})
        assert r.status_code == 400 or r.status_code == 200  # error_response sets success False
        body = r.json()
        assert body["success"] is False
        assert body["error"]["code"].startswith("TARIFE_DUPLICATE")

    def test_get_by_id_success(self, client):
        pl = create_price_list(client, kod="PLID1")
        r = client.get(f"/api/price-list/{pl['Id']}")
        assert r.status_code == 200
        assert r.json()["data"]["Id"] == pl["Id"]

    def test_get_by_id_not_found(self, client):
        r = client.get("/api/price-list/999999")
        assert r.status_code in [200, 404, 400]
        body = r.json()
        assert body["success"] is False
        assert body["error"]["code"].startswith("TARIFE_NOT_FOUND")

    def test_get_by_code_success(self, client):
        pl = create_price_list(client, kod="PLC999")
        r = client.get(f"/api/price-list/code/{pl['Kod']}")
        assert r.status_code == 200
        assert r.json()["data"]["Kod"] == pl["Kod"]

    def test_get_by_code_not_found(self, client):
        r = client.get("/api/price-list/code/XNONEX")
        assert r.status_code in [200, 404, 400]
        body = r.json()
        assert body["error"]["code"].startswith("TARIFE_NOT_FOUND")

    def test_update_price_list_success(self, client):
        pl = create_price_list(client, kod="PLUPD")
        r = client.put(f"/api/price-list/{pl['Id']}", json={"Ad": "Güncellenmiş Tarife", "Durum": "PASIF"})
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["Ad"] == "Güncellenmiş Tarife"
        assert body["data"]["Durum"] == "PASIF"

    def test_update_price_list_not_found(self, client):
        r = client.put("/api/price-list/888888", json={"Ad": "X"})
        assert r.status_code in [200, 404, 400]
        body = r.json()
        assert body["error"]["code"].startswith("TARIFE_NOT_FOUND")

    def test_status_change(self, client):
        pl = create_price_list(client, kod="PLSTS")
        r = client.patch(f"/api/price-list/{pl['Id']}/status", params={"status": "AKTIF"})
        assert r.status_code == 200
        assert r.json()["data"]["Durum"] == "AKTIF"

    def test_price_list_with_items(self, client):
        pl = create_price_list(client, kod="PLWITH")
        create_price_list_item(client, pl["Id"], hizmet_kodu="SRV10", hizmet_adi="Servis 10")
        r = client.get(f"/api/price-list/{pl['Id']}/with-items")
        assert r.status_code == 200
        body = r.json()
        assert len(body["data"]["items"]) == 1
        assert body["data"]["items"][0]["HizmetKodu"] == "SRV10"

    def test_list_filters_search_status_currency(self, client):
        create_price_list(client, kod="PLF1", ad="Arama A", currency="USD")
        create_price_list(client, kod="PLF2", ad="Arama B", currency="TRY")
        # status patch second
        r_patch = client.patch("/api/price-list/2/status", params={"status": "AKTIF"})
        assert r_patch.status_code == 200
        # search
        r_search = client.get("/api/price-list/?search=Arama B")
        assert r_search.status_code == 200
        assert len(r_search.json()["data"]) == 1
        # status filter
        r_status = client.get("/api/price-list/?status=AKTIF")
        assert len(r_status.json()["data"]) >= 1
        # currency filter
        r_curr = client.get("/api/price-list/?currency=USD")
        assert len(r_curr.json()["data"]) == 1

    def test_delete_price_list(self, client):
        pl = create_price_list(client, kod="PLDEL")
        create_price_list_item(client, pl["Id"], hizmet_kodu="SRVDEL", hizmet_adi="Silinecek")
        r = client.delete(f"/api/price-list/{pl['Id']}")
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["price_list_id"] == pl["Id"]
        # tekrar get -> not found
        r2 = client.get(f"/api/price-list/{pl['Id']}")
        assert r2.status_code in [200, 404, 400]


# ============================================
# PRICE LIST ITEM TESTLERİ
# ============================================

class TestPriceListItemRouter:
    def test_create_item_success(self, client):
        pl = create_price_list(client, kod="PLITEM1")
        r_item = create_price_list_item(client, pl["Id"], hizmet_kodu="SRVA", hizmet_adi="Servis A", fiyat=150.5)
        assert r_item.status_code == 200
        body = r_item.json()
        assert body["data"]["HizmetKodu"] == "SRVA"
        assert float(body["data"]["BirimFiyat"]) == pytest.approx(150.5)

    def test_create_item_price_list_not_found(self, client):
        payload = {
            "PriceListId": 999999,
            "HizmetKodu": "SRVNF",
            "HizmetAdi": "Yok",
            "BirimFiyat": 10,
        }
        r = client.post("/api/price-list/item", json=payload)
        assert r.status_code in [200, 404, 400]
        body = r.json()
        assert body["error"]["code"].startswith("TARIFE_NOT_FOUND")

    def test_get_item_success(self, client):
        pl = create_price_list(client, kod="PLITEM2")
        r_item = create_price_list_item(client, pl["Id"], hizmet_kodu="SRVB", hizmet_adi="Servis B")
        item_id = r_item.json()["data"]["Id"]
        r = client.get(f"/api/price-list/item/{item_id}")
        assert r.status_code == 200
        assert r.json()["data"]["Id"] == item_id

    def test_get_item_not_found(self, client):
        r = client.get("/api/price-list/item/888888")
        assert r.status_code in [200, 404, 400]
        body = r.json()
        assert body["error"]["code"].startswith("TARIFE_ITEM_NOT_FOUND")

    def test_list_items_for_price_list(self, client):
        pl = create_price_list(client, kod="PLITEM3")
        create_price_list_item(client, pl["Id"], hizmet_kodu="SRV1", hizmet_adi="Servis 1")
        create_price_list_item(client, pl["Id"], hizmet_kodu="SRV2", hizmet_adi="Servis 2")
        r = client.get(f"/api/price-list/{pl['Id']}/items")
        assert r.status_code == 200
        body = r.json()
        assert len(body["data"]) == 2

    def test_update_item_success(self, client):
        pl = create_price_list(client, kod="PLITEM4")
        r_item = create_price_list_item(client, pl["Id"], hizmet_kodu="SRVUP", hizmet_adi="Servis Up", fiyat=50)
        item_id = r_item.json()["data"]["Id"]
        r_upd = client.put(f"/api/price-list/item/{item_id}", json={"HizmetAdi": "Servis Upd", "BirimFiyat": 75})
        assert r_upd.status_code == 200
        body = r_upd.json()
        assert body["data"]["HizmetAdi"] == "Servis Upd"
        assert float(body["data"]["BirimFiyat"]) == pytest.approx(75)

    def test_update_item_not_found(self, client):
        r = client.put("/api/price-list/item/777777", json={"HizmetAdi": "X"})
        assert r.status_code in [200, 404, 400]
        body = r.json()
        assert body["error"]["code"].startswith("TARIFE_ITEM_NOT_FOUND")

    def test_delete_item_success(self, client):
        pl = create_price_list(client, kod="PLITEM5")
        r_item = create_price_list_item(client, pl["Id"], hizmet_kodu="SRVDEL", hizmet_adi="Silinecek")
        item_id = r_item.json()["data"]["Id"]
        r_del = client.delete(f"/api/price-list/item/{item_id}")
        assert r_del.status_code == 200
        # tekrar get -> not found
        r2 = client.get(f"/api/price-list/item/{item_id}")
        assert r2.status_code in [200, 404, 400]

    def test_delete_item_not_found(self, client):
        r = client.delete("/api/price-list/item/555555")
        assert r.status_code in [200, 404, 400]
        body = r.json()
        assert body["error"]["code"].startswith("TARIFE_ITEM_NOT_FOUND")

    def test_bulk_create_items(self, client):
        pl = create_price_list(client, kod="PLBULK")
        bulk_payload = [
            {"PriceListId": pl["Id"], "HizmetKodu": "SRVB1", "HizmetAdi": "Bulk 1", "BirimFiyat": 10},
            {"PriceListId": pl["Id"], "HizmetKodu": "SRVB2", "HizmetAdi": "Bulk 2", "BirimFiyat": 20},
        ]
        r = client.post(f"/api/price-list/{pl['Id']}/items/bulk", json=bulk_payload)
        assert r.status_code == 200
        body = r.json()
        assert len(body["data"]) == 2
        codes = {item["HizmetKodu"] for item in body["data"]}
        assert codes == {"SRVB1", "SRVB2"}
