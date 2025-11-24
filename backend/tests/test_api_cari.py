import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

pytestmark = [pytest.mark.api]


class TestCariEndpoints:
    @pytest.fixture(scope="function")
    def base_payload(self):
        return {
            "CariKod": "C100",
            "Unvan": "Yeni Test Cari",
            "CariTip": "GERCEK",
            "Rol": "MUSTERI",
            "VergiDairesi": "Kadıköy",
            "VergiNo": "9999999999",
            "Ulke": "Türkiye",
            "Il": "İstanbul"
        }

    def test_list_cari_empty(self, client: TestClient):
        resp = client.get("/api/cari/?page=1&page_size=10")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["success"] is True
        assert data["data"] == []
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["total"] == 0

    def test_create_cari(self, client: TestClient, db: Session, base_payload):
        resp = client.post("/api/cari/", json=base_payload)
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["CariKod"] == base_payload["CariKod"]
        assert data["Unvan"] == base_payload["Unvan"]
        assert data["AktifMi"] is True
        assert "Id" in data

    def test_get_cari(self, client: TestClient, sample_cari):
        resp = client.get(f"/api/cari/{sample_cari.Id}")
        assert resp.status_code == 200, resp.text
        wrapper = resp.json()
        data = wrapper["data"]
        assert wrapper["success"] is True
        assert data["Id"] == sample_cari.Id
        assert data["CariKod"] == sample_cari.CariKod

    def test_update_cari(self, client: TestClient, sample_cari):
        payload = {
            "CariKod": sample_cari.CariKod,
            "Unvan": "Güncellenmiş Şirket",
            "CariTip": sample_cari.CariTip,
            "Rol": sample_cari.Rol
        }
        resp = client.put(f"/api/cari/{sample_cari.Id}", json=payload)
        assert resp.status_code == 200, resp.text
        wrapper = resp.json()
        data = wrapper["data"]
        assert wrapper["success"] is True
        assert data["Unvan"] == "Güncellenmiş Şirket"

    def test_delete_cari(self, client: TestClient, sample_cari):
        resp = client.delete(f"/api/cari/{sample_cari.Id}")
        assert resp.status_code == 200, resp.text
        del_data = resp.json()["data"]
        assert del_data["deleted"] is True
        resp2 = client.get(f"/api/cari/{sample_cari.Id}")
        assert resp2.status_code == 404

    def test_list_cari_with_search(self, client: TestClient, sample_cari):
        resp = client.get("/api/cari/?search=Test")
        assert resp.status_code == 200
        wrapper = resp.json()
        assert wrapper["success"] is True
        assert wrapper["pagination"]["total"] >= 1
        assert any(item["Unvan"].startswith("Test") for item in wrapper["data"])

    def test_duplicate_code(self, client: TestClient, sample_cari):
        payload = {
            "CariKod": sample_cari.CariKod,
            "Unvan": "Başka Cari",
            "CariTip": "GERCEK",
            "Rol": "MUSTERI"
        }
        resp = client.post("/api/cari/", json=payload)
        assert resp.status_code == 409, resp.text
        body = resp.json()
        # FastAPI HTTPException detail sarma kontrolü
        err = body.get("detail", body)
        assert err["error"]["code"] == "CARI_DUPLICATE_CODE"

    def test_not_found(self, client: TestClient):
        resp = client.get("/api/cari/9999")
        assert resp.status_code == 404
        body = resp.json()
        err = body.get("detail", body)
        assert err["error"]["code"] == "CARI_NOT_FOUND"

    def test_invalid_create_missing_fields(self, client: TestClient):
        resp = client.post("/api/cari/", json={"CariKod": "X1"})
        assert resp.status_code == 422
        data = resp.json()
        assert data["detail"]

    def test_pagination_bounds(self, client: TestClient, sample_cari):
        resp = client.get("/api/cari/?page=2&page_size=50")
        assert resp.status_code == 200
        data = resp.json()
        assert data["pagination"]["page"] == 2
        assert data["data"] == []

    def test_multiple_create_and_search(self, client: TestClient):
        codes = ["C200", "C201", "C202"]
        for c in codes:
            payload = {"CariKod": c, "Unvan": f"Şirket {c}", "CariTip": "GERCEK", "Rol": "MUSTERI"}
            r = client.post("/api/cari/", json=payload)
            assert r.status_code == 200, r.text
        resp = client.get("/api/cari/?search=Şirket C20")
        assert resp.status_code == 200
        data = resp.json()
        assert data["pagination"]["total"] >= 3
        assert all("Şirket" in item["Unvan"] for item in data["data"])  # All results have Unvan containing 'Şirket'
