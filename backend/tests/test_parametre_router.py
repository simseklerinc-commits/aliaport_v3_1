import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from aliaport_api.modules.parametre.models import Parametre

pytestmark = [pytest.mark.api]


def create_parametre(db: Session, **kwargs) -> Parametre:
    data = {
        "Kategori": "GENEL",
        "Kod": f"P{int(len(kwargs)==0)}_{int(len(kwargs))}",
        "Ad": "Test Parametre",
        "Deger": "Val",
        "Aciklama": "Açıklama",
        "AktifMi": True,
    }
    data.update(kwargs)
    p = Parametre(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


class TestParametreRouter:
    def test_create_success(self, client: TestClient, db: Session):
        payload = {
            "Kategori": "GENEL",
            "Kod": "TEST_PARAM_1",
            "Ad": "Param 1",
            "Deger": "Value",
            "Aciklama": "Açıklama",
            "AktifMi": True,
        }
        r = client.post("/api/parametre/", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["data"]["Kod"] == "TEST_PARAM_1"

    def test_create_duplicate_code(self, client: TestClient, db: Session):
        create_parametre(db, Kod="DUP_CODE")
        r = client.post("/api/parametre/", json={
            "Kategori": "GENEL",
            "Kod": "DUP_CODE",
            "Ad": "Param Dup",
            "Deger": "X",
            "Aciklama": "Dup",
            "AktifMi": True,
        })
        assert r.status_code == 409
        detail = r.json()["detail"]
        assert detail["error"]["code"] == "PARAMETRE_DUPLICATE_CODE"

    def test_get_by_id_not_found(self, client: TestClient):
        r = client.get("/api/parametre/9999")
        assert r.status_code == 404

    def test_get_by_id_success(self, client: TestClient, db: Session):
        p = create_parametre(db, Kod="GET_OK")
        r = client.get(f"/api/parametre/{p.Id}")
        assert r.status_code == 200
        assert r.json()["data"]["Kod"] == "GET_OK"

    def test_update_parametre_success(self, client: TestClient, db: Session):
        p = create_parametre(db, Kod="UPD1", Deger="OLD")
        r = client.put(f"/api/parametre/{p.Id}", json={"Deger": "NEW"})
        assert r.status_code == 200
        assert r.json()["data"]["Deger"] == "NEW"

    def test_update_duplicate_code_conflict(self, client: TestClient, db: Session):
        p1 = create_parametre(db, Kod="UPD_EXIST")
        p2 = create_parametre(db, Kod="UPD_TARGET")
        r = client.put(f"/api/parametre/{p2.Id}", json={"Kod": "UPD_EXIST"})
        assert r.status_code == 409

    def test_delete_parametre_sets_inactive(self, client: TestClient, db: Session):
        p = create_parametre(db, Kod="DEL1")
        r = client.delete(f"/api/parametre/{p.Id}")
        assert r.status_code == 200
        assert r.json()["data"]["deleted"] is True
        # fetch again should show inactive
        r2 = client.get(f"/api/parametre/{p.Id}")
        assert r2.status_code == 200
        assert r2.json()["data"]["AktifMi"] is False

    def test_toggle_active(self, client: TestClient, db: Session):
        p = create_parametre(db, Kod="TOGGLE1", AktifMi=True)
        r = client.patch(f"/api/parametre/{p.Id}/toggle-active")
        assert r.status_code == 200
        first_state = r.json()["data"]["AktifMi"]
        r2 = client.patch(f"/api/parametre/{p.Id}/toggle-active")
        assert r2.status_code == 200
        second_state = r2.json()["data"]["AktifMi"]
        assert first_state != second_state

    def test_list_with_filters(self, client: TestClient, db: Session):
        create_parametre(db, Kod="FILT_A1", Kategori="A", AktifMi=True)
        create_parametre(db, Kod="FILT_A2", Kategori="A", AktifMi=False)
        create_parametre(db, Kod="FILT_B1", Kategori="B", AktifMi=True)
        r_all = client.get("/api/parametre/?page=1&page_size=10")
        assert r_all.status_code == 200
        assert r_all.json()["pagination"]["total"] >= 3
        r_kat = client.get("/api/parametre/?kategori=A&page=1&page_size=10")
        assert r_kat.status_code == 200
        assert all(item["Kategori"] == "A" for item in r_kat.json()["data"])
        r_aktif = client.get("/api/parametre/?aktif=true&page=1&page_size=10")
        assert r_aktif.status_code == 200
        assert all(item["AktifMi"] is True for item in r_aktif.json()["data"])

    def test_update_not_found(self, client: TestClient):
        r = client.put("/api/parametre/9999", json={"Deger": "NEW"})
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "PARAMETRE_NOT_FOUND"

    def test_delete_not_found(self, client: TestClient):
        r = client.delete("/api/parametre/9999")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "PARAMETRE_NOT_FOUND"

    def test_toggle_active_not_found(self, client: TestClient):
        r = client.patch("/api/parametre/9999/toggle-active")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "PARAMETRE_NOT_FOUND"

    def test_list_by_kategori_filter(self, client: TestClient, db: Session):
        """Test listing parametreler filtered by kategori."""
        create_parametre(db, Kod="CAT_A1", Kategori="CATEGORY_A", AktifMi=True)
        create_parametre(db, Kod="CAT_A2", Kategori="CATEGORY_A", AktifMi=True)
        create_parametre(db, Kod="CAT_B1", Kategori="CATEGORY_B", AktifMi=True)
        r = client.get("/api/parametre/?kategori=CATEGORY_A")
        assert r.status_code == 200
        data = r.json()["data"]
        assert all(p["Kategori"] == "CATEGORY_A" for p in data)
        assert len(data) == 2

    def test_list_by_aktif_filter_true(self, client: TestClient, db: Session):
        """Test listing only active parametreler."""
        create_parametre(db, Kod="ACT1", AktifMi=True)
        create_parametre(db, Kod="ACT2", AktifMi=False)
        r = client.get("/api/parametre/?aktif=true")
        assert r.status_code == 200
        data = r.json()["data"]
        # Should only include active
        assert any(p["Kod"] == "ACT1" for p in data)
        assert not any(p["Kod"] == "ACT2" for p in data)

    def test_list_by_aktif_filter_false(self, client: TestClient, db: Session):
        """Test listing only inactive parametreler."""
        create_parametre(db, Kod="INACT1", AktifMi=True)
        create_parametre(db, Kod="INACT2", AktifMi=False)
        r = client.get("/api/parametre/?aktif=false")
        assert r.status_code == 200
        data = r.json()["data"]
        # Should only include inactive
        assert not any(p["Kod"] == "INACT1" for p in data)
        assert any(p["Kod"] == "INACT2" for p in data)

    def test_list_combined_filters(self, client: TestClient, db: Session):
        """Test listing with both kategori and aktif filters."""
        create_parametre(db, Kod="COMB1", Kategori="SPECIAL", AktifMi=True)
        create_parametre(db, Kod="COMB2", Kategori="SPECIAL", AktifMi=False)
        create_parametre(db, Kod="COMB3", Kategori="OTHER", AktifMi=True)
        r = client.get("/api/parametre/?kategori=SPECIAL&aktif=true")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 1
        assert data[0]["Kod"] == "COMB1"

    def test_list_pagination(self, client: TestClient, db: Session):
        """Test pagination in list endpoint."""
        for i in range(5):
            create_parametre(db, Kod=f"PAGE{i}")
        r = client.get("/api/parametre/?page=1&page_size=2")
        assert r.status_code == 200
        json_data = r.json()
        assert len(json_data["data"]) == 2
        assert json_data["pagination"]["page"] == 1
        assert json_data["pagination"]["total"] >= 5

    def test_list_empty_result(self, client: TestClient):
        """Test listing with filter returning no results."""
        r = client.get("/api/parametre/?kategori=NONEXISTENT_CATEGORY")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 0
        assert r.json()["pagination"]["total"] == 0

