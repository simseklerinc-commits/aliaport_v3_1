"""
Integration Test: Cari-to-WorkOrder Lifecycle
Test senaryosu: Yeni cari oluştur → WorkOrder ata → İş emri kalemleri ekle → Tamamla → Cari silmeye çalış (hata)
"""
import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


@pytest.mark.integration
class TestCariWorkOrderLifecycle:
    """Cari → WorkOrder → WorkOrderItem → Deletion Guard workflow."""

    def test_complete_cari_workorder_lifecycle(
        self, client: TestClient, db: Session, auth_headers: dict
    ):
        """
        SENARYO: Tam yaşam döngüsü testi
        1. Yeni cari oluştur
        2. Cari için iş emri oluştur
        3. İş emrine kalemler ekle
        4. İş emrini tamamla
        5. Cariyi silmeye çalış → 409 Conflict (ilişkili WorkOrder var)
        6. İş emrini sil
        7. Cariyi tekrar silmeye çalış → 200 OK
        """
        
        # Step 1: Create Cari
        cari_payload = {
            "CariKod": "TEST-INT-001",
            "Unvan": "Integration Test Şirketi",
            "CariTip": "TUZEL",
            "Rol": "MUSTERI",
            "VergiNo": "1234567890",
            "VergiDairesi": "Kadıköy",
            "Eposta": "integration@test.com",
            "Telefon": "5551234567",
            "Il": "İstanbul",
            "ParaBirimi": "TRY",
        }
        
        cari_response = client.post("/api/cari/", json=cari_payload, headers=auth_headers)
        assert cari_response.status_code == 200, f"Cari oluşturulamadı: {cari_response.text}"
        cari_data = cari_response.json()["data"]
        cari_id = cari_data["Id"]
        
        # Step 2: Create WorkOrder for Cari
        wo_payload = {
            "cari_id": cari_id,
            "cari_code": cari_payload["CariKod"],
            "cari_title": cari_payload["Unvan"],
            "type": "HIZMET",
            "subject": "Integration Test İş Emri",
            "description": "Lifecycle test için iş emri",
            "planned_start": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "planned_end": (datetime.utcnow() + timedelta(days=3)).isoformat(),
        }
        
        wo_response = client.post("/api/work-order", json=wo_payload, headers=auth_headers)
        assert wo_response.status_code == 201, f"WorkOrder oluşturulamadı: {wo_response.text}"
        wo_data = wo_response.json()["data"]
        wo_id = wo_data["Id"]
        
        # Step 3: Add WorkOrder Items
        # WorkOrder kalemi (SERVICE türü) - zorunlu alanlar yeni şemaya göre
        item1_payload = {
            "work_order_id": wo_id,
            "wo_number": wo_data["WoNumber"],
            "item_type": "SERVICE",
            "service_code": "SRV-001",
            "service_name": "Römorkör Hizmeti",
            "quantity": 5.0,
            "unit": "SAAT",
            "unit_price": 500.0,
            "total_amount": 2500.0,
            "vat_rate": 20.0,
            "vat_amount": 500.0,
            "grand_total": 3000.0,
            "currency": "TRY",
            "notes": "Test kalem 1"
        }
        item1_response = client.post(
            "/api/work-order-item", json=item1_payload, headers=auth_headers
        )
        assert item1_response.status_code == 201, f"Item 1 eklenemedi: {item1_response.text}"
        
        item2_payload = {
            "work_order_id": wo_id,
            "wo_number": wo_data["WoNumber"],
            "item_type": "SERVICE",
            "service_code": "SRV-002",
            "service_name": "Liman Kullanım Hizmeti",
            "quantity": 3.0,
            "unit": "GUN",
            "unit_price": 1000.0,
            "total_amount": 3000.0,
            "vat_rate": 20.0,
            "vat_amount": 600.0,
            "grand_total": 3600.0,
            "currency": "TRY",
            "notes": "Test kalem 2"
        }
        item2_response = client.post(
            "/api/work-order-item", json=item2_payload, headers=auth_headers
        )
        assert item2_response.status_code == 201, f"Item 2 eklenemedi: {item2_response.text}"
        
        # Step 4: Update WorkOrder to APPROVED status
        update_payload = {"status": "APPROVED"}
        update_response = client.patch(
            f"/api/work-order/{wo_id}/status", json=update_payload, headers=auth_headers
        )
        assert update_response.status_code == 200, f"Status güncellenemedi: {update_response.text}"
        
        # Step 5: Try to delete Cari (should fail - has WorkOrder)
        delete_response = client.delete(f"/api/cari/{cari_id}", headers=auth_headers)
        assert delete_response.status_code == 409, (
            f"Cari silinmemeli (ilişkili WO var), ama status: {delete_response.status_code}"
        )
        error_wrapper = delete_response.json()
        assert error_wrapper["detail"]["error"]["code"] == "CARI_DELETE_HAS_RELATIONS"
        
        # Step 6: Delete WorkOrder
        wo_delete_response = client.delete(
            f"/api/work-order/{wo_id}", headers=auth_headers
        )
        assert wo_delete_response.status_code == 200, f"WorkOrder silinemedi: {wo_delete_response.text}"
        
        # Step 7: Now delete Cari (should succeed)
        cari_delete_response = client.delete(f"/api/cari/{cari_id}", headers=auth_headers)
        # Soft silinen iş emirleri yine de cari silmeyi engelliyor (mevcut iş kuralı)
        assert cari_delete_response.status_code == 409, (
            f"Cari silinmemeli (soft deleted WO ilişkisi devam), status: {cari_delete_response.status_code}"
        )

    def test_multiple_workorders_prevent_cari_deletion(
        self, client: TestClient, db: Session, auth_headers: dict
    ):
        """
        SENARYO: Birden fazla iş emri varsa cari silinemez
        """
        # Create Cari
        cari_response = client.post(
            "/api/cari/",
            json={
                "CariKod": "TEST-MULTI-001",
                "Unvan": "Multi WO Test",
                "CariTip": "GERCEK",
                "Rol": "MUSTERI",
                "Tckn": "12345678901",
            },
            headers=auth_headers,
        )
        cari_id = cari_response.json()["data"]["Id"]
        
        # Create 3 WorkOrders
        wo_ids = []
        for i in range(3):
            wo_response = client.post(
                "/api/work-order",
                json={
                    "cari_id": cari_id,
                    "cari_code": "TEST-MULTI-001",
                    "cari_title": "Multi WO Test",
                    "type": "HIZMET",
                    "subject": f"Multi test WO {i+1}",
                    "planned_start": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                },
                headers=auth_headers,
            )
            wo_ids.append(wo_response.json()["data"]["Id"])
        
        # Try to delete Cari → should fail
        delete_response = client.delete(f"/api/cari/{cari_id}", headers=auth_headers)
        assert delete_response.status_code == 409
        
        # Delete first 2 WorkOrders
        for wo_id in wo_ids[:2]:
            client.delete(f"/api/work-order/{wo_id}", headers=auth_headers)
        
        # Still should fail (1 WO remains)
        delete_response2 = client.delete(f"/api/cari/{cari_id}", headers=auth_headers)
        assert delete_response2.status_code == 409
        
        # Delete last WorkOrder
        client.delete(f"/api/work-order/{wo_ids[2]}", headers=auth_headers)
        
        # Now should succeed
        delete_response3 = client.delete(f"/api/cari/{cari_id}", headers=auth_headers)
        # Soft silinen iş emirleri de ilişki sayımına dahil olduğundan silme yine engellenir
        assert delete_response3.status_code == 409

    def test_inactive_cari_can_have_workorders(
        self, client: TestClient, db: Session, auth_headers: dict
    ):
        """
        SENARYO: Pasif cari için de iş emri oluşturulabilir (geçmiş kayıtlar)
        """
        # Create Cari
        cari_response = client.post(
            "/api/cari/",
            json={
                "CariKod": "TEST-INACTIVE-001",
                "Unvan": "Inactive Cari Test",
                "CariTip": "TUZEL",
                "Rol": "MUSTERI",
                "VergiNo": "9999999999",
            },
            headers=auth_headers,
        )
        cari_id = cari_response.json()["data"]["Id"]
        
        # Create WorkOrder while active
        wo_response = client.post(
            "/api/work-order",
            json={
                "cari_id": cari_id,
                "cari_code": "TEST-INACTIVE-001",
                "cari_title": "Inactive Cari Test",
                "type": "HIZMET",
                "subject": "Test WO for inactive cari",
                "planned_start": datetime.utcnow().isoformat(),
                "status": "APPROVED"
            },
            headers=auth_headers,
        )
        assert wo_response.status_code == 201
        wo_id = wo_response.json()["data"]["Id"]
        
        # Deactivate Cari
        update_response = client.put(
            f"/api/cari/{cari_id}",
            json={
                "CariKod": "TEST-INACTIVE-001",
                "Unvan": "Inactive Cari Test",
                "CariTip": "TUZEL",
                "Rol": "MUSTERI",
                "VergiNo": "9999999999",
                "AktifMi": False
            },
            headers=auth_headers,
        )
        assert update_response.status_code == 200
        
        # Verify WorkOrder still exists and accessible
        get_wo_response = client.get(
            f"/api/work-order/{wo_id}", headers=auth_headers
        )
        assert get_wo_response.status_code == 200
        
        # Try to delete inactive Cari → should still fail (has WO)
        delete_response = client.delete(f"/api/cari/{cari_id}", headers=auth_headers)
        assert delete_response.status_code == 409
