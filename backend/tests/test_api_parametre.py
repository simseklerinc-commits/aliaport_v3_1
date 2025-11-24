import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

pytestmark = [pytest.mark.api]

class TestParametreEndpoints:
    @pytest.fixture(scope="function")
    def base_payload(self):
        return {
            "Kategori": "GENEL",
            "Kod": "TEST_PARAM_1",
            "Ad": "Test Parametre 1",
            "Deger": "Değer 1",
            "Aciklama": "Açıklama",
            "AktifMi": True
        }

    def test_list_empty(self, client: TestClient):
        resp = client.get("/api/parametre/?page=1&page_size=10")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"] == []
        assert body["pagination"]["total"] == 0

    def test_create_parametre(self, client: TestClient, base_payload):
        resp = client.post("/api/parametre/", json=base_payload)
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["Kod"] == base_payload["Kod"]
        assert data["Kategori"] == base_payload["Kategori"]
        assert data["AktifMi"] is True
        assert "Id" in data

    def test_get_parametre(self, client: TestClient, db: Session, base_payload):
        # Create
        create = client.post("/api/parametre/", json=base_payload)
        pid = create.json()["data"]["Id"]
        # Get
        resp = client.get(f"/api/parametre/{pid}")
        assert resp.status_code == 200
        wrapper = resp.json()
        assert wrapper["success"] is True
        assert wrapper["data"]["Id"] == pid

    def test_duplicate_code(self, client: TestClient, base_payload):
        r1 = client.post("/api/parametre/", json=base_payload)
        assert r1.status_code == 200
        r2 = client.post("/api/parametre/", json=base_payload)
        assert r2.status_code == 409
        body = r2.json()
        err = body.get("detail", body)
        assert err["error"]["code"] == "PARAMETRE_DUPLICATE_CODE"

    def test_update_parametre(self, client: TestClient, base_payload):
        create = client.post("/api/parametre/", json=base_payload)
        pid = create.json()["data"]["Id"]
        payload = {"Ad": "Güncellenmiş Parametre", "Deger": "Yeni Değer"}
        resp = client.put(f"/api/parametre/{pid}", json=payload)
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["Ad"] == "Güncellenmiş Parametre"
        assert data["Deger"] == "Yeni Değer"

    def test_toggle_active(self, client: TestClient, base_payload):
        create = client.post("/api/parametre/", json=base_payload)
        pid = create.json()["data"]["Id"]
        resp = client.patch(f"/api/parametre/{pid}/toggle-active")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["AktifMi"] is False
        resp2 = client.patch(f"/api/parametre/{pid}/toggle-active")
        assert resp2.status_code == 200
        data2 = resp2.json()["data"]
        assert data2["AktifMi"] is True

    def test_delete_parametre(self, client: TestClient, base_payload):
        create = client.post("/api/parametre/", json=base_payload)
        pid = create.json()["data"]["Id"]
        resp = client.delete(f"/api/parametre/{pid}")
        assert resp.status_code == 200
        d = resp.json()["data"]
        assert d["deleted"] is True
        assert d["aktif"] is False
        # get should still succeed but show AktifMi False
        get_after = client.get(f"/api/parametre/{pid}")
        assert get_after.status_code == 200
        assert get_after.json()["data"]["AktifMi"] is False

    def test_not_found(self, client: TestClient):
        resp = client.get("/api/parametre/9999")
        assert resp.status_code == 404
        err = resp.json().get("detail")
        assert err["error"]["code"] == "PARAMETRE_NOT_FOUND"

    def test_invalid_create_missing_fields(self, client: TestClient):
        resp = client.post("/api/parametre/", json={"Kategori": "GENEL"})
        assert resp.status_code == 422
        assert resp.json()["detail"]

    def test_filter_by_kategori_and_cache(self, client: TestClient):
        p1 = {"Kategori": "RAPOR", "Kod": "R1", "Ad": "R1", "AktifMi": True}
        p2 = {"Kategori": "RAPOR", "Kod": "R2", "Ad": "R2", "AktifMi": False}
        client.post("/api/parametre/", json=p1)
        client.post("/api/parametre/", json=p2)
        # include_inactive False -> only active
        resp_active = client.get("/api/parametre/by-kategori/RAPOR")
        assert resp_active.status_code == 200
        data_a = resp_active.json()["data"]
        assert len(data_a) == 1
        # include inactive
        resp_all = client.get("/api/parametre/by-kategori/RAPOR?include_inactive=true")
        assert resp_all.status_code == 200
        data_all = resp_all.json()["data"]
        assert len(data_all) == 2

    def test_list_with_filters(self, client: TestClient):
        # create some
        for i in range(3):
            client.post("/api/parametre/", json={"Kategori": "FILTRE", "Kod": f"F{i}", "Ad": f"Filtre {i}"})
        resp = client.get("/api/parametre/?kategori=FILTRE&aktif=true")
        assert resp.status_code == 200
        body = resp.json()
        assert body["pagination"]["total"] >= 3
        assert all(item["Kategori"] == "FILTRE" for item in body["data"])


def test_parametre_smoke():
    # Basit smoke testi; discovery doğrulama
    assert True
