# backend/tests/test_api_workorder.py
"""
API endpoint tests for WorkOrder module.
"""
import pytest
from datetime import datetime, timedelta


@pytest.mark.api
class TestWorkOrderEndpoints:
    """Tests for WorkOrder API endpoints."""
    
    def test_list_work_orders(self, client, auth_headers, sample_work_order):
        """Test GET /api/work-order - List work orders."""
        response = client.get("/api/work-order", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1
    
    def test_list_work_orders_with_status_filter(self, client, auth_headers, sample_work_order):
        """Test filtering by status."""
        response = client.get(
            "/api/work-order?status=DRAFT",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(wo["status"] == "DRAFT" for wo in data["data"])
    
    def test_get_work_order_by_id(self, client, auth_headers, sample_work_order):
        """Test GET /api/work-order/{id}."""
        response = client.get(
            f"/api/work-order/{sample_work_order.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["id"] == sample_work_order.id
        assert data["data"]["wo_number"] == "WO-2025-0001"
    
    def test_get_work_order_by_number(self, client, auth_headers, sample_work_order):
        """Test GET /api/work-order/number/{wo_number}."""
        response = client.get(
            "/api/work-order/number/WO-2025-0001",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["wo_number"] == "WO-2025-0001"
    
    def test_create_work_order(self, client, auth_headers, sample_cari):
        """Test POST /api/work-order - Create work order."""
        payload = {
            "cari_id": sample_cari.id,
            "cari_code": sample_cari.cari_code,
            "type": "HIZMET",
            "subject": "Test İş Emri",
            "description": "Test açıklaması",
            "planned_start": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
            "planned_end": (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
        }
        
        response = client.post(
            "/api/work-order",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "DRAFT"
        assert "wo_number" in data["data"]
    
    def test_change_work_order_status(self, client, auth_headers, sample_work_order):
        """Test PATCH /api/work-order/{id}/status - Change status."""
        payload = {
            "status": "APPROVED",
            "notes": "Onaylandı"
        }
        
        response = client.patch(
            f"/api/work-order/{sample_work_order.id}/status",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "APPROVED"
    
    def test_invalid_status_transition(self, client, auth_headers, sample_work_order):
        """Test invalid status transition (DRAFT -> TAMAMLANDI)."""
        payload = {
            "status": "TAMAMLANDI",  # Invalid: DRAFT can only go to APPROVED
            "notes": "Test"
        }
        
        response = client.patch(
            f"/api/work-order/{sample_work_order.id}/status",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "WO_INVALID_STATUS_TRANSITION"
    
    def test_work_order_stats(self, client, auth_headers, sample_work_order):
        """Test GET /api/work-order/stats."""
        response = client.get("/api/work-order/stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data["data"]
        assert "draft" in data["data"]
        assert data["data"]["draft"] >= 1
    
    def test_update_work_order(self, client, auth_headers, sample_work_order):
        """Test PUT /api/work-order/{id}."""
        payload = {
            "description": "Updated description"
        }
        
        response = client.put(
            f"/api/work-order/{sample_work_order.id}",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["description"] == "Updated description"
    
    def test_delete_work_order(self, client, auth_headers, sample_work_order):
        """Test DELETE /api/work-order/{id}."""
        response = client.delete(
            f"/api/work-order/{sample_work_order.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


@pytest.mark.api
class TestWorkOrderItemEndpoints:
    """Tests for WorkOrderItem API endpoints."""
    
    def test_create_work_order_item(self, client, auth_headers, sample_work_order, sample_hizmet):
        """Test POST /api/work-order/{wo_id}/items."""
        payload = {
            "item_type": "HIZMET",
            "hizmet_id": sample_hizmet.id,
            "hizmet_kodu": sample_hizmet.hizmet_kodu,
            "description": "Test item",
            "quantity": 10.0,
            "unit_price": 100.0,
            "vat_rate": 20.0
        }
        
        response = client.post(
            f"/api/work-order/{sample_work_order.id}/items",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["quantity"] == 10.0
        assert data["data"]["total_amount"] == 1000.0  # 10 * 100
        assert data["data"]["vat_amount"] == 200.0  # 1000 * 0.2
    
    def test_list_work_order_items(self, client, auth_headers, sample_work_order):
        """Test GET /api/work-order/{wo_id}/items."""
        response = client.get(
            f"/api/work-order/{sample_work_order.id}/items",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
    
    def test_delete_work_order_item(self, client, auth_headers, sample_work_order, sample_hizmet, db):
        """Test DELETE /api/work-order/items/{item_id}."""
        # Create item first
        from aliaport_api.modules.isemri.models import WorkOrderItem
        
        item = WorkOrderItem(
            wo_id=sample_work_order.id,
            item_type="HIZMET",
            hizmet_id=sample_hizmet.id,
            hizmet_kodu=sample_hizmet.hizmet_kodu,
            description="Test",
            quantity=1.0,
            unit_price=100.0,
            total_amount=100.0,
            vat_rate=20.0,
            vat_amount=20.0
        )
        db.add(item)
        db.commit()
        
        response = client.delete(
            f"/api/work-order/items/{item.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
