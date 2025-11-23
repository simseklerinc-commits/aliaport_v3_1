# backend/tests/test_api_cari.py
"""
API endpoint tests for Cari module.
"""
import pytest


@pytest.mark.api
class TestCariEndpoints:
    """Tests for Cari API endpoints."""
    
    def test_list_cari(self, client, auth_headers, sample_cari):
        """Test GET /api/cari - List cari."""
        response = client.get("/api/cari", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1
        assert data["data"][0]["cari_code"] == "C001"
    
    def test_list_cari_with_pagination(self, client, auth_headers, sample_cari):
        """Test pagination parameters."""
        response = client.get(
            "/api/cari?page=1&page_size=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "pagination" in data
        assert data["pagination"]["page"] == 1
        assert data["pagination"]["page_size"] == 10
    
    def test_list_cari_with_filter(self, client, auth_headers, sample_cari):
        """Test filtering by cari_tip."""
        response = client.get(
            "/api/cari?cari_tip=MUSTERI",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert all(c["cari_tip"] == "MUSTERI" for c in data["data"])
    
    def test_get_cari_by_id(self, client, auth_headers, sample_cari):
        """Test GET /api/cari/{id}."""
        response = client.get(
            f"/api/cari/{sample_cari.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == sample_cari.id
        assert data["data"]["cari_code"] == "C001"
    
    def test_get_cari_not_found(self, client, auth_headers):
        """Test 404 for non-existent cari."""
        response = client.get("/api/cari/99999", headers=auth_headers)
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "CARI_NOT_FOUND"
    
    def test_create_cari(self, client, auth_headers):
        """Test POST /api/cari - Create cari."""
        payload = {
            "cari_code": "C002",
            "cari_unvan": "Yeni Şirket",
            "cari_tip": "MUSTERI",
            "tax_number": "9876543210",
            "tax_office": "Beşiktaş",
            "email": "test@example.com"
        }
        
        response = client.post(
            "/api/cari",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["cari_code"] == "C002"
        assert data["message"] == "Cari başarıyla oluşturuldu"
    
    def test_create_cari_duplicate_code(self, client, auth_headers, sample_cari):
        """Test creating cari with duplicate code."""
        payload = {
            "cari_code": "C001",  # Already exists
            "cari_unvan": "Duplicate",
            "cari_tip": "MUSTERI"
        }
        
        response = client.post(
            "/api/cari",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 409
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "CARI_DUPLICATE_CODE"
    
    def test_create_cari_validation_error(self, client, auth_headers):
        """Test validation errors."""
        payload = {
            "cari_code": "C003",
            "cari_unvan": "Test",
            # Missing cari_tip (required)
        }
        
        response = client.post(
            "/api/cari",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    def test_update_cari(self, client, auth_headers, sample_cari):
        """Test PUT /api/cari/{id} - Update cari."""
        payload = {
            "phone": "+90 212 999 88 77",
            "email": "updated@example.com"
        }
        
        response = client.put(
            f"/api/cari/{sample_cari.id}",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["phone"] == "+90 212 999 88 77"
    
    def test_delete_cari(self, client, auth_headers, sample_cari):
        """Test DELETE /api/cari/{id} - Soft delete cari."""
        response = client.delete(
            f"/api/cari/{sample_cari.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "Cari pasif edildi"
        
        # Verify soft delete
        get_response = client.get(
            f"/api/cari/{sample_cari.id}",
            headers=auth_headers
        )
        assert get_response.json()["data"]["is_active"] is False
    
    def test_unauthorized_access(self, client):
        """Test accessing endpoints without authentication."""
        response = client.get("/api/cari")
        
        assert response.status_code == 401
    
    def test_search_cari(self, client, auth_headers, sample_cari):
        """Test searching cari by unvan."""
        response = client.get(
            "/api/cari?search=Test",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1
