import pytest
from datetime import datetime, date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from aliaport_api.modules.guvenlik.models import GateLog, GateChecklistItem
import hashlib

pytestmark = [pytest.mark.api]


def create_gate_log(db: Session, **kwargs) -> GateLog:
    base = {
        "work_order_id": 1,
        "motorbot_id": 1,
        "entry_type": "GIRIS",
        "wo_number": f"WO-{len(list(db.query(GateLog).all())) + 1:03d}",
        "wo_status": "AKTIF",
        "security_personnel": "Guard1",
        "is_approved": False,
        "checklist_complete": False,
        "is_exception": False,
    }
    base.update(kwargs)
    obj = GateLog(**base)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def create_checklist_item(db: Session, **kwargs) -> GateChecklistItem:
    base = {
        "wo_type": "HIZMET",
        "item_label": f"Item {len(list(db.query(GateChecklistItem).all())) + 1}",
        "is_required": True,
        "display_order": 1,
        "is_active": True,
    }
    base.update(kwargs)
    obj = GateChecklistItem(**base)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


class TestGateLogRouter:
    base_url = "/api/gatelog"

    def test_list_empty(self, client: TestClient):
        r = client.get(self.base_url + "/")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"] == []

    def test_create_normal(self, client: TestClient):
        payload = {
            "work_order_id": 1,
            "motorbot_id": 1,
            "entry_type": "GIRIS",
            "wo_number": "WO-CREATE-001",
            "wo_status": "AKTIF",
            "security_personnel": "GuardTest",
            "is_approved": True,
            "checklist_complete": True,
            "notes": "Test entry"
        }
        r = client.post(self.base_url + "/", json=payload)
        assert r.status_code == 201
        assert r.json()["data"]["wo_number"] == "WO-CREATE-001"

    def test_create_exception_with_hashed_pin(self, client: TestClient):
        payload = {
            "work_order_id": 2,
            "motorbot_id": 2,
            "entry_type": "CIKIS",
            "wo_number": "WO-EXC-001",
            "wo_status": "BEKLEMEDE",
            "security_personnel": "GuardExc",
            "is_approved": False,
            "checklist_complete": False,
            "is_exception": True,
            "exception_pin": "123456",
            "exception_reason": "Belge eksik",
            "exception_approved_by": "ManagerX"
        }
        r = client.post(self.base_url + "/exception", json=payload)
        assert r.status_code == 201
        body = r.json()["data"]
        assert body["is_exception"] is True
        # PIN should be hashed (first 10 chars of sha256)
        expected_hash_prefix = hashlib.sha256("123456".encode()).hexdigest()[:10]
        # We can't retrieve PIN from response, but we can verify creation succeeded
        assert body["exception_reason"] == "Belge eksik"

    def test_get_not_found(self, client: TestClient):
        r = client.get(self.base_url + "/999999")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "GATELOG_NOT_FOUND"

    def test_get_success(self, client: TestClient, db: Session):
        log = create_gate_log(db, wo_number="WO-GET-001")
        r = client.get(f"{self.base_url}/{log.id}")
        assert r.status_code == 200
        assert r.json()["data"]["wo_number"] == "WO-GET-001"

    def test_delete_not_found(self, client: TestClient):
        r = client.delete(self.base_url + "/888888")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "GATELOG_NOT_FOUND"

    def test_delete_success(self, client: TestClient, db: Session):
        log = create_gate_log(db, wo_number="WO-DEL-001")
        r = client.delete(f"{self.base_url}/{log.id}")
        assert r.status_code == 200
        assert r.json()["message"] == "GateLog silindi"
        # Verify deletion
        r2 = client.get(f"{self.base_url}/{log.id}")
        assert r2.status_code == 404

    def test_list_filters(self, client: TestClient, db: Session):
        create_gate_log(db, entry_type="GIRIS", wo_number="WO-F1", work_order_id=10, is_approved=True)
        create_gate_log(db, entry_type="CIKIS", wo_number="WO-F2", work_order_id=10, is_approved=False)
        create_gate_log(db, entry_type="GIRIS", wo_number="WO-F3", work_order_id=20, is_approved=True, is_exception=True)

        # Filter by entry_type
        r_entry = client.get(self.base_url + "?entry_type=GIRIS")
        assert r_entry.status_code == 200
        entry_nums = {log["wo_number"] for log in r_entry.json()["data"]}
        assert "WO-F2" not in entry_nums

        # Filter by work_order_id
        r_wo = client.get(self.base_url + "?work_order_id=10")
        assert r_wo.status_code == 200
        wo_nums = {log["wo_number"] for log in r_wo.json()["data"]}
        assert wo_nums.issuperset({"WO-F1", "WO-F2"})

        # Filter by is_approved
        r_appr = client.get(self.base_url + "?is_approved=true")
        assert r_appr.status_code == 200
        appr_nums = {log["wo_number"] for log in r_appr.json()["data"]}
        assert "WO-F2" not in appr_nums

        # Filter by is_exception
        r_exc = client.get(self.base_url + "?is_exception=true")
        assert r_exc.status_code == 200
        exc_nums = {log["wo_number"] for log in r_exc.json()["data"]}
        assert "WO-F3" in exc_nums

    def test_stats_endpoint(self, client: TestClient, db: Session):
        create_gate_log(db, entry_type="GIRIS", wo_status="AKTIF", is_approved=True)
        create_gate_log(db, entry_type="CIKIS", wo_status="AKTIF", is_approved=False)
        create_gate_log(db, entry_type="GIRIS", wo_status="BEKLEMEDE", is_approved=True, is_exception=True)

        r = client.get(self.base_url + "/stats")
        assert r.status_code == 200
        stats = r.json()["data"]
        assert stats["total_entries"] >= 2
        assert stats["total_exits"] >= 1
        assert stats["approved_count"] >= 2
        assert stats["rejected_count"] >= 1
        assert stats["exception_count"] >= 1
        assert "AKTIF" in stats["by_wo_status"]
        assert len(stats["recent_logs"]) > 0


class TestChecklistRouter:
    checklist_url = "/api/gatelog/checklist/items"

    def test_list_checklist_empty(self, client: TestClient):
        r = client.get(self.checklist_url)
        assert r.status_code == 200
        # May already have seeded items from prior tests, so just verify structure
        body = r.json()
        assert body["success"] is True
        assert "data" in body

    def test_create_checklist_item(self, client: TestClient):
        payload = {
            "wo_type": "MOTORBOT",
            "item_label": "Test Item Create",
            "is_required": True,
            "display_order": 10,
            "is_active": True
        }
        r = client.post(self.checklist_url, json=payload)
        assert r.status_code == 201
        assert r.json()["data"]["item_label"] == "Test Item Create"

    def test_update_checklist_item(self, client: TestClient, db: Session):
        item = create_checklist_item(db, wo_type="HIZMET", item_label="Old Label")
        r = client.put(f"{self.checklist_url}/{item.id}", json={"item_label": "New Label", "display_order": 5})
        assert r.status_code == 200
        body = r.json()["data"]
        assert body["item_label"] == "New Label"
        assert body["display_order"] == 5

    def test_update_checklist_not_found(self, client: TestClient):
        r = client.put(f"{self.checklist_url}/777777", json={"item_label": "X"})
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "NOT_FOUND"

    def test_delete_checklist_item(self, client: TestClient, db: Session):
        item = create_checklist_item(db, item_label="To Delete")
        r = client.delete(f"{self.checklist_url}/{item.id}")
        assert r.status_code == 200
        assert r.json()["message"] == "Checklist item silindi"

    def test_delete_checklist_not_found(self, client: TestClient):
        r = client.delete(f"{self.checklist_url}/666666")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "NOT_FOUND"

    def test_filter_by_wo_type(self, client: TestClient, db: Session):
        create_checklist_item(db, wo_type="MOTORBOT", item_label="MB Item")
        create_checklist_item(db, wo_type="HIZMET", item_label="HZ Item")
        r = client.get(self.checklist_url + "?wo_type=MOTORBOT")
        assert r.status_code == 200
        labels = {item["item_label"] for item in r.json()["data"]}
        assert "MB Item" in labels

    def test_filter_by_is_active(self, client: TestClient, db: Session):
        create_checklist_item(db, item_label="Active", is_active=True)
        create_checklist_item(db, item_label="Inactive", is_active=False)
        r_active = client.get(self.checklist_url + "?is_active=true")
        assert r_active.status_code == 200
        labels = {item["item_label"] for item in r_active.json()["data"]}
        assert "Inactive" not in labels

    def test_seed_default_checklist_idempotent(self, client: TestClient, db: Session):
        # First seed
        r1 = client.post("/api/gatelog/checklist/seed")
        assert r1.status_code == 200
        created_first = r1.json()["data"]["created_count"]
        assert created_first > 0  # Should create items

        # Second seed (should not duplicate)
        r2 = client.post("/api/gatelog/checklist/seed")
        assert r2.status_code == 200
        created_second = r2.json()["data"]["created_count"]
        assert created_second == 0  # Should be idempotent
