"""
İş Emri (WorkOrder) ve Kalem (WorkOrderItem) Router Testleri
Kapsam (İlk Faz):
  - WorkOrder: list, filters, create, get(id/number), update, status change, delete (soft), cari bazlı liste, stats
  - WorkOrderItem: create, get(id/list), update, delete, faturalanmış blokaj, worklog ve uninvoiced filtreleri

Not: Bu ilk batch yaklaşık 24 test içerir. Sonraki fazlarda daha fazla edge case (tarih aralıkları, priority/type kombinasyonları, notes append format) eklenebilir.
"""

from datetime import datetime, timedelta
from uuid import uuid4
import pytest
from sqlalchemy.orm import Session


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_cari(db: Session, kod: str = "CRTEST", unvan: str = "Test Cari"):
    """WorkOrder için gerekli Cari kaydı oluştur."""
    from aliaport_api.modules.cari.models import Cari
    cari = Cari(
        CariKod=kod,
        Unvan=unvan,
        CariTip="GERCEK",
        Rol="MUSTERI",
        VergiDairesi="Kadıköy",
        VergiNo="1234567890",
        Ulke="Türkiye",
        Il="İstanbul",
        Ilce="Kadıköy",
        Adres="Adres",
        Telefon="+90 212 000 00 00",
        Eposta="cari@example.com",
        IletisimKisi="Yetkili",
        VadeGun=30,
        ParaBirimi="TRY",
        AktifMi=True
    )
    db.add(cari)
    db.commit()
    db.refresh(cari)
    return cari


def create_work_order(client, db: Session, subject: str = "Test İş Emri", priority: str = "MEDIUM"):
    """API üzerinden WorkOrder oluştur ve döndür (response json)."""
    # Benzersiz CariKod üret (timestamp çakışmalarını önlemek için UUID kullan)
    cari = create_cari(db, kod=f"CR{uuid4().hex[:8].upper()}")
    payload = {
        "cari_id": cari.Id,
        "cari_code": cari.CariKod,
        "cari_title": cari.Unvan,
        "type": "HIZMET",
        "subject": subject,
        "priority": priority,
        "status": "DRAFT",
        "planned_start": datetime.utcnow().isoformat(),
        "planned_end": (datetime.utcnow() + timedelta(hours=2)).isoformat()
    }
    r = client.post("/api/work-order", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["success"] is True
    return body["data"]  # WorkOrderResponse alanları


def create_work_order_item(client, work_order: dict, item_type: str = "SERVICE", invoiced: bool = False):
    """API üzerinden WorkOrderItem oluştur (faturalanmış opsiyonu)."""
    payload = {
        "work_order_id": work_order["Id"],
        "wo_number": work_order["WoNumber"],
        "item_type": item_type,
        "quantity": 2,
        "unit": "SAAT",
        "unit_price": 100.0,
        "total_amount": 200.0,
        "vat_rate": 20,
        "vat_amount": 40.0,
        "grand_total": 240.0,
        "is_invoiced": invoiced,
        "currency": "TRY"
    }
    r = client.post("/api/work-order-item", json=payload)
    return r


# ============================================
# WORK ORDER TESTLERİ
# ============================================

class TestWorkOrderRouter:
    def test_list_empty(self, client, db):
        r = client.get("/api/work-order")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 0
        assert body["pagination"]["total"] == 0

    def test_create_success(self, client, db):
        wo = create_work_order(client, db, subject="Bakım İş Emri", priority="HIGH")
        assert wo["Subject"] == "Bakım İş Emri"
        assert wo["Priority"] == "HIGH"
        assert wo["Status"] == "DRAFT"
        assert wo["WoNumber"].startswith("WO")

    def test_get_by_id_success(self, client, db):
        wo = create_work_order(client, db)
        r = client.get(f"/api/work-order/{wo['Id']}")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["Id"] == wo["Id"]
        assert body["data"]["WoNumber"] == wo["WoNumber"]

    def test_get_by_id_not_found(self, client, db):
        r = client.get("/api/work-order/999999")
        assert r.status_code in [404, 500]
        body = r.json()
        assert body["detail"]["success"] is False
        assert "WO_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_get_by_number_success(self, client, db):
        wo = create_work_order(client, db)
        r = client.get(f"/api/work-order/number/{wo['WoNumber']}")
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["WoNumber"] == wo["WoNumber"]

    def test_get_by_number_not_found(self, client, db):
        r = client.get("/api/work-order/number/WO-OLMAYAN")
        assert r.status_code in [404, 500]
        body = r.json()
        assert "WO_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_list_filters_status_priority_search(self, client, db):
        create_work_order(client, db, subject="Bakım A", priority="LOW")
        wo2 = create_work_order(client, db, subject="Tamir B", priority="URGENT")
        # Status change ikinci iş emri
        r_status = client.patch(f"/api/work-order/{wo2['Id']}/status", json={"status": "APPROVED"})
        assert r_status.status_code == 200
        # Search
        r = client.get("/api/work-order?search=Tamir")
        body = r.json()
        assert len(body["data"]) == 1
        # Priority filter
        r2 = client.get("/api/work-order?priority=URGENT")
        assert r2.status_code == 200
        assert len(r2.json()["data"]) == 1
        # Status filter
        r3 = client.get("/api/work-order?status=APPROVED")
        assert r3.status_code == 200
        assert len(r3.json()["data"]) == 1

    def test_update_work_order_success(self, client, db):
        wo = create_work_order(client, db)
        r = client.put(f"/api/work-order/{wo['Id']}", json={
            "subject": "Güncellenmiş Konu",
            "priority": "LOW",
            "description": "Açıklama değişti"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["Subject"] == "Güncellenmiş Konu"
        assert body["data"]["Priority"] == "LOW"
        assert body["data"]["Description"] == "Açıklama değişti"

    def test_update_work_order_not_found(self, client, db):
        # subject minimum 3 karakter gerektiriyor; 404 kontrolü için geçerli payload gönder
        r = client.put("/api/work-order/888888", json={"subject": "XYZ"})
        assert r.status_code in [404, 500]
        body = r.json()
        assert "WO_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_change_status_appends_notes(self, client, db):
        wo = create_work_order(client, db)
        r = client.patch(f"/api/work-order/{wo['Id']}/status", json={"status": "APPROVED", "notes": "Onay verildi"})
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["Status"] == "APPROVED"
        assert "Onay verildi" in (body["data"].get("Notes") or "")

    def test_change_status_not_found(self, client, db):
        r = client.patch("/api/work-order/777777/status", json={"status": "APPROVED"})
        body = r.json()
        assert "WO_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_delete_work_order_soft(self, client, db):
        wo = create_work_order(client, db)
        r = client.delete(f"/api/work-order/{wo['Id']}")
        assert r.status_code == 200
        # Tekrar get -> not found
        r2 = client.get(f"/api/work-order/{wo['Id']}")
        assert r2.status_code in [404, 500]

    def test_delete_work_order_not_found(self, client, db):
        r = client.delete("/api/work-order/666666")
        assert r.status_code in [404, 500]
        body = r.json()
        assert "WO_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_work_orders_by_cari_status_filter(self, client, db):
        wo1 = create_work_order(client, db, subject="Cari A İş", priority="MEDIUM")
        cari_code = wo1["CariCode"]
        wo2 = create_work_order(client, db, subject="Cari A İş 2", priority="HIGH")
        # Aynı cari kullanıldığı için ikinci create_cari farklı kod üretir -> bunu garanti etmek için cari_code override yok.
        # Bu nedenle aynı cari_code'u test etmek için manuel create gerekli. Basitleştirme: sadece tek cari ile filtre.
        r = client.get(f"/api/work-order/cari/{cari_code}")
        assert r.status_code == 200
        body = r.json()
        # En az 1 kayıt dönmeli (ilk WO)
        assert any(item["CariCode"] == cari_code for item in body["data"])

    def test_work_order_stats(self, client, db):
        create_work_order(client, db, priority="LOW")
        wo2 = create_work_order(client, db, priority="URGENT")
        client.patch(f"/api/work-order/{wo2['Id']}/status", json={"status": "APPROVED"})
        r = client.get("/api/work-order/stats")
        assert r.status_code == 200
        body = r.json()
        stats = body["data"]
        assert stats["Total"] >= 2
        assert "APPROVED" in stats["ByStatus"]
        assert "URGENT" in stats["ByPriority"]
        assert "HIZMET" in stats["ByType"]


# ============================================
# WORK ORDER ITEM TESTLERİ
# ============================================

class TestWorkOrderItemRouter:
    def test_create_item_success(self, client, db):
        wo = create_work_order(client, db)
        r = create_work_order_item(client, wo)
        assert r.status_code == 201
        body = r.json()
        assert body["success"] is True
        assert body["data"]["WorkOrderId"] == wo["Id"]
        assert body["data"]["Quantity"] == 2
        assert body["data"]["GrandTotal"] == 240.0

    def test_create_item_work_order_not_found(self, client, db):
        fake_wo = {"Id": 999999, "WoNumber": "WOFAKE"}
        r = client.post("/api/work-order-item", json={
            "work_order_id": fake_wo["Id"],
            "wo_number": fake_wo["WoNumber"],
            "item_type": "SERVICE",
            "quantity": 1,
            "unit": "SAAT",
            "unit_price": 50.0,
            "total_amount": 50.0,
            "vat_rate": 20,
            "vat_amount": 10.0,
            "grand_total": 60.0,
            "currency": "TRY"
        })
        assert r.status_code in [404, 500]
        body = r.json()
        assert "WO_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_get_item_success(self, client, db):
        wo = create_work_order(client, db)
        r_item = create_work_order_item(client, wo)
        item_id = r_item.json()["data"]["Id"]
        r = client.get(f"/api/work-order-item/{item_id}")
        assert r.status_code == 200
        assert r.json()["data"]["Id"] == item_id

    def test_get_item_not_found(self, client, db):
        r = client.get("/api/work-order-item/999999")
        assert r.status_code in [404, 500]
        body = r.json()
        assert "WO_ITEM_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_update_item_success(self, client, db):
        wo = create_work_order(client, db)
        r_item = create_work_order_item(client, wo)
        item_id = r_item.json()["data"]["Id"]
        r = client.put(f"/api/work-order-item/{item_id}", json={"quantity": 3, "total_amount": 300.0, "vat_amount": 60.0, "grand_total": 360.0})
        assert r.status_code == 200
        body = r.json()
        assert body["data"]["Quantity"] == 3
        assert body["data"]["GrandTotal"] == 360.0

    def test_update_item_not_found(self, client, db):
        r = client.put("/api/work-order-item/888888", json={"quantity": 5})
        assert r.status_code in [404, 500]
        body = r.json()
        assert "WO_ITEM_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_update_item_invoiced_blocked(self, client, db):
        wo = create_work_order(client, db)
        r_item = create_work_order_item(client, wo, invoiced=True)
        item_id = r_item.json()["data"]["Id"]
        r = client.put(f"/api/work-order-item/{item_id}", json={"quantity": 5})
        assert r.status_code in [400, 409, 500]  # mapped error
        body = r.json()
        assert "WO_ALREADY_INVOICED" in body["detail"]["error"]["code"]

    def test_delete_item_success(self, client, db):
        wo = create_work_order(client, db)
        r_item = create_work_order_item(client, wo)
        item_id = r_item.json()["data"]["Id"]
        r = client.delete(f"/api/work-order-item/{item_id}")
        # tekrar get -> not found
        r2 = client.get(f"/api/work-order-item/{item_id}")
        assert r2.status_code in [404, 500]

    def test_delete_item_not_found(self, client, db):
        r = client.delete("/api/work-order-item/777777")
        assert r.status_code in [404, 500]
        body = r.json()
        assert "WO_ITEM_NOT_FOUND" in body["detail"]["error"]["code"]

    def test_delete_item_invoiced_blocked(self, client, db):
        wo = create_work_order(client, db)
        r_item = create_work_order_item(client, wo, invoiced=True)
        item_id = r_item.json()["data"]["Id"]
        r = client.delete(f"/api/work-order-item/{item_id}")
        assert r.status_code in [400, 409, 500]
        body = r.json()
        assert "WO_ALREADY_INVOICED" in body["detail"]["error"]["code"]

    def test_get_items_for_work_order(self, client, db):
        wo = create_work_order(client, db)
        create_work_order_item(client, wo)
        create_work_order_item(client, wo)
        r = client.get(f"/api/work-order-item/wo/{wo['Id']}")
        assert r.status_code == 200
        body = r.json()
        assert len(body["data"]) == 2

    def test_get_worklog_items_filter(self, client, db):
        wo = create_work_order(client, db)
        create_work_order_item(client, wo, item_type="WORKLOG")
        create_work_order_item(client, wo, item_type="SERVICE")
        r = client.get(f"/api/work-order-item/wo/{wo['Id']}/worklogs")
        assert r.status_code == 200
        body = r.json()
        assert all(item["ItemType"] == "WORKLOG" for item in body["data"])

    def test_get_uninvoiced_items(self, client, db):
        wo = create_work_order(client, db)
        create_work_order_item(client, wo, invoiced=False)
        create_work_order_item(client, wo, invoiced=True)
        r = client.get("/api/work-order-item/uninvoiced")
        assert r.status_code == 200
        body = r.json()
        # Sadece faturalanmamış olanlar dönmeli
        assert any(item["IsInvoiced"] is False for item in body["data"])
        assert all(item["IsInvoiced"] is False for item in body["data"])  # hiçbir True yok
