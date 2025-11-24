# backend/tests/test_api_workorder.py
"""
API endpoint tests for WorkOrder module.
"""
import pytest
from datetime import datetime, timedelta


@pytest.mark.api
class TestWorkOrderEndpoints:
    """Tests for WorkOrder API endpoints."""
    
    def test_list_work_orders(self, client, sample_work_order):
        """GET /api/work-order -> paginated response, capitalized field names inside items."""
        response = client.get("/api/work-order")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "pagination" in data
        assert data["pagination"]["total"] >= 1
        assert len(data["data"]) >= 1
        # İç item alanları WorkOrderResponse (Id, WoNumber, Status ...)
        first = data["data"][0]
        assert "Id" in first and "WoNumber" in first and "Status" in first
    
    def test_list_work_orders_with_status_filter(self, client, sample_work_order):
        """GET /api/work-order?status=DRAFT -> Status filtrasyonu (Status alanı)."""
        response = client.get("/api/work-order?status=DRAFT")
        assert response.status_code == 200
        data = response.json()
        assert all(wo["Status"] == "DRAFT" for wo in data["data"])
    
    def test_get_work_order_by_id(self, client, sample_work_order):
        """GET /api/work-order/{id} -> Tekil iş emri; alan adları capitalize."""
        response = client.get(f"/api/work-order/{sample_work_order.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["Id"] == sample_work_order.id
        assert data["data"]["WoNumber"] == sample_work_order.wo_number
    
    def test_get_work_order_by_number(self, client, sample_work_order):
        """GET /api/work-order/number/{wo_number}."""
        response = client.get(f"/api/work-order/number/{sample_work_order.wo_number}")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["WoNumber"] == sample_work_order.wo_number
    
    def test_create_work_order(self, client, sample_cari):
        """POST /api/work-order -> 201, zorunlu alanlarla oluşturma."""
        payload = {
            "cari_id": sample_cari.Id,
            "cari_code": sample_cari.CariKod,
            "cari_title": sample_cari.Unvan,
            "type": "HIZMET",
            "subject": "Oluşturulan İş Emri",
            "description": "Yeni açıklama",
            "planned_start": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "planned_end": (datetime.utcnow() + timedelta(days=2)).isoformat()
        }
        response = client.post("/api/work-order", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["Status"] == "DRAFT"
        assert "WoNumber" in data["data"]
    
    def test_change_work_order_status(self, client, sample_work_order):
        """PATCH /api/work-order/{id}/status -> Durum güncelleme."""
        payload = {"status": "APPROVED", "notes": "Onaylandı"}
        response = client.patch(f"/api/work-order/{sample_work_order.id}/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["Status"] == "APPROVED"
    
    def test_status_transition_any_allowed_current_impl(self, client, sample_work_order):
        """PATCH status şu an sistemde geçiş validasyonu yapmıyor; direkt set edilmeli."""
        payload = {"status": "TAMAMLANDI", "notes": "Tamamlandı"}
        response = client.patch(f"/api/work-order/{sample_work_order.id}/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["Status"] == "TAMAMLANDI"
    
    def test_work_order_stats(self, client, sample_work_order):
        """GET /api/work-order/stats -> İstatistik alanları (Total, ByStatus)."""
        response = client.get("/api/work-order/stats")
        assert response.status_code == 200
        data = response.json()
        assert "Total" in data["data"]
        assert "ByStatus" in data["data"]
        # DRAFT sayısı >= 1
        assert data["data"]["ByStatus"].get("DRAFT", 0) >= 1
    
    def test_update_work_order(self, client, sample_work_order):
        """PUT /api/work-order/{id} -> Açıklama güncelleme."""
        payload = {"description": "Güncellenmiş açıklama"}
        response = client.put(f"/api/work-order/{sample_work_order.id}", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["Description"] == "Güncellenmiş açıklama"
    
    def test_delete_work_order(self, client, sample_work_order):
        """DELETE /api/work-order/{id} -> Soft delete (is_active False)."""
        response = client.delete(f"/api/work-order/{sample_work_order.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


@pytest.mark.api
class TestWorkOrderItemEndpoints:
    """WorkOrderItem endpoint'leri: /api/work-order-item*"""

    def test_create_work_order_item(self, client, sample_work_order, sample_hizmet):
        """POST /api/work-order-item -> SERVICE tipi kalem oluştur."""
        quantity = 10.0
        unit_price = 100.0
        total_amount = quantity * unit_price
        vat_rate = 20.0
        vat_amount = total_amount * (vat_rate / 100.0)
        grand_total = total_amount + vat_amount
        payload = {
            "work_order_id": sample_work_order.id,
            "wo_number": sample_work_order.wo_number,
            "item_type": "SERVICE",
            "service_code": sample_hizmet.Kod,
            "service_name": sample_hizmet.Ad,
            "quantity": quantity,
            "unit": "SAAT",
            "unit_price": unit_price,
            "currency": "TRY",
            "total_amount": total_amount,
            "vat_rate": vat_rate,
            "vat_amount": vat_amount,
            "grand_total": grand_total
        }
        response = client.post("/api/work-order-item", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["Quantity"] == quantity
        assert data["data"]["TotalAmount"] == total_amount
        assert data["data"]["VatAmount"] == vat_amount
        assert data["data"]["GrandTotal"] == grand_total

    def test_list_work_order_items(self, client, sample_work_order):
        """GET /api/work-order-item/wo/{work_order_id} -> Liste."""
        response = client.get(f"/api/work-order-item/wo/{sample_work_order.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    def test_delete_work_order_item(self, client, sample_work_order, db):
        """DELETE /api/work-order-item/{item_id} -> Kalem silme."""
        from aliaport_api.modules.isemri.models import WorkOrderItem
        item = WorkOrderItem(
            work_order_id=sample_work_order.id,
            wo_number=sample_work_order.wo_number,
            item_type="SERVICE",
            quantity=1.0,
            unit="SAAT",
            unit_price=100.0,
            currency="TRY",
            total_amount=100.0,
            vat_rate=20.0,
            vat_amount=20.0,
            grand_total=120.0
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        response = client.delete(f"/api/work-order-item/{item.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
