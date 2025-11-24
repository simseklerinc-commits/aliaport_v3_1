"""
Saha WorkLog Router Testleri
Kapsam: List filters, create duration, update approval, approve endpoint, stats, not found
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from aliaport_api.modules.saha.models import WorkLog


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_worklog(
    db: Session,
    work_order_id: int = 1001,
    personnel_name: str = "Test Personel",
    time_start: datetime = None,
    time_end: datetime = None,
    service_type: str = "BAKIM",
    is_approved: int = 0
) -> WorkLog:
    """Test için WorkLog oluştur"""
    if time_start is None:
        time_start = datetime.utcnow() - timedelta(hours=2)
    
    log = WorkLog(
        work_order_id=work_order_id,
        personnel_name=personnel_name,
        time_start=time_start,
        time_end=time_end,
        service_type=service_type,
        quantity=1.0,
        unit="SAAT",
        is_approved=is_approved
    )
    
    if time_end:
        log.calculate_duration()
    
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ============================================
# WORKLOG ROUTER TESTS
# ============================================

class TestWorkLogRouter:
    """WorkLog router test sınıfı"""
    
    def test_list_empty(self, client, db):
        """Boş liste döner"""
        r = client.get("/api/worklog")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 0
        assert body["pagination"]["total"] == 0
    
    def test_create_success(self, client, db):
        """WorkLog başarıyla oluşturulur"""
        now = datetime.utcnow()
        r = client.post("/api/worklog", json={
            "work_order_id": 1001,
            "personnel_name": "Ali Veli",
            "time_start": now.isoformat(),
            "service_type": "TAMIR",
            "quantity": 1.0,
            "unit": "SAAT"
        })
        assert r.status_code == 201
        body = r.json()
        assert body["success"] is True
        assert body["data"]["personnel_name"] == "Ali Veli"
        assert body["data"]["service_type"] == "TAMIR"
        assert body["data"]["is_approved"] == 0
    
    def test_create_with_duration_calculation(self, client, db):
        """time_start + time_end verildiğinde duration_minutes hesaplanır"""
        start = datetime.utcnow()
        end = start + timedelta(hours=3, minutes=30)
        
        r = client.post("/api/worklog", json={
            "personnel_name": "Test User",
            "time_start": start.isoformat(),
            "time_end": end.isoformat(),
            "service_type": "BAKIM",
            "quantity": 1.0,
            "unit": "SAAT"
        })
        assert r.status_code == 201
        body = r.json()
        assert body["success"] is True
        assert body["data"]["duration_minutes"] == 210  # 3.5 saat = 210 dakika
    
    def test_get_not_found(self, client, db):
        """Olmayan WorkLog 404 döner"""
        r = client.get("/api/worklog/999999")
        assert r.status_code in [404, 500]  # WORKLOG_NOT_FOUND error kodu bağlı
        body = r.json()
        assert body["detail"]["success"] is False
        assert "WORKLOG_NOT_FOUND" in body["detail"]["error"]["code"]
    
    def test_get_success(self, client, db):
        """Var olan WorkLog getirilir"""
        log = create_worklog(db, personnel_name="Ahmet Yılmaz")
        
        r = client.get(f"/api/worklog/{log.id}")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["id"] == log.id
        assert body["data"]["personnel_name"] == "Ahmet Yılmaz"
    
    def test_update_success(self, client, db):
        """WorkLog güncellenir"""
        log = create_worklog(db)
        
        r = client.put(f"/api/worklog/{log.id}", json={
            "service_type": "ACİL",
            "notes": "Acil müdahale yapıldı"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["service_type"] == "ACİL"
        assert body["data"]["notes"] == "Acil müdahale yapıldı"
    
    def test_update_recalculates_duration(self, client, db):
        """time_end güncellendiğinde duration yeniden hesaplanır"""
        start = datetime.utcnow()
        log = create_worklog(db, time_start=start)
        
        end = start + timedelta(hours=2)
        r = client.put(f"/api/worklog/{log.id}", json={
            "time_end": end.isoformat()
        })
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["duration_minutes"] == 120
    
    def test_update_approval_sets_timestamp(self, client, db):
        """is_approved=1 yapılınca approved_at set edilir"""
        log = create_worklog(db, is_approved=0)
        assert log.approved_at is None
        
        r = client.put(f"/api/worklog/{log.id}", json={
            "is_approved": 1
        })
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["is_approved"] == 1
        assert body["data"]["approved_at"] is not None
    
    def test_update_not_found(self, client, db):
        """Olmayan WorkLog güncellenemez"""
        r = client.put("/api/worklog/888888", json={"notes": "test"})
        assert r.status_code in [404, 500]
        body = r.json()
        assert body["detail"]["success"] is False
        assert "WORKLOG_NOT_FOUND" in body["detail"]["error"]["code"]
    
    def test_delete_success(self, client, db):
        """WorkLog silinir"""
        log = create_worklog(db)
        
        r = client.delete(f"/api/worklog/{log.id}")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        
        # Silindi mi kontrol
        r2 = client.get(f"/api/worklog/{log.id}")
        assert r2.status_code in [404, 500]
    
    def test_delete_not_found(self, client, db):
        """Olmayan WorkLog silinemez"""
        r = client.delete("/api/worklog/777777")
        assert r.status_code in [404, 500]
        body = r.json()
        assert body["detail"]["success"] is False
    
    def test_approve_endpoint(self, client, db):
        """Approve endpoint WorkLog'u onaylar"""
        log = create_worklog(db, is_approved=0)
        
        r = client.post(f"/api/worklog/{log.id}/approve?approved_by=Yönetici")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["is_approved"] == 1
        assert body["data"]["approved_by"] == "Yönetici"
        assert body["data"]["approved_at"] is not None
    
    def test_approve_not_found(self, client, db):
        """Olmayan WorkLog onaylanamaz"""
        r = client.post("/api/worklog/666666/approve?approved_by=Admin")
        assert r.status_code in [404, 500]
        body = r.json()
        assert body["detail"]["success"] is False
    
    def test_list_filters_work_order(self, client, db):
        """work_order_id filtresi çalışır"""
        create_worklog(db, work_order_id=101, personnel_name="User A")
        create_worklog(db, work_order_id=102, personnel_name="User B")
        
        r = client.get("/api/worklog?work_order_id=101")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 1
        assert body["data"][0]["personnel_name"] == "User A"
    
    def test_list_filters_personnel_name(self, client, db):
        """personnel_name ilike filtresi çalışır"""
        create_worklog(db, personnel_name="Ahmet Yılmaz")
        create_worklog(db, personnel_name="Mehmet Demir")
        
        r = client.get("/api/worklog?personnel_name=ahmet")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 1
        assert "Ahmet" in body["data"][0]["personnel_name"]
    
    def test_list_filters_is_approved(self, client, db):
        """is_approved filtresi çalışır"""
        create_worklog(db, is_approved=0, personnel_name="Pending")
        create_worklog(db, is_approved=1, personnel_name="Approved")
        
        r = client.get("/api/worklog?is_approved=1")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 1
        assert body["data"][0]["is_approved"] == 1
    
    def test_list_filters_date_range(self, client, db):
        """date_from ve date_to filtreleri çalışır"""
        old_date = datetime.utcnow() - timedelta(days=10)
        recent_date = datetime.utcnow() - timedelta(days=2)
        
        create_worklog(db, time_start=old_date, personnel_name="Old Log")
        create_worklog(db, time_start=recent_date, personnel_name="Recent Log")
        
        filter_date = (datetime.utcnow() - timedelta(days=5)).date()
        r = client.get(f"/api/worklog?date_from={filter_date.isoformat()}")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 1
        assert body["data"][0]["personnel_name"] == "Recent Log"
    
    def test_stats_endpoint(self, client, db):
        """Stats endpoint doğru istatistikler döner"""
        # 2 onaylı, 1 beklemede
        start = datetime.utcnow()
        end = start + timedelta(hours=2)
        
        create_worklog(db, personnel_name="User1", time_start=start, time_end=end, 
                      service_type="BAKIM", is_approved=1)
        create_worklog(db, personnel_name="User2", time_start=start, time_end=end, 
                      service_type="TAMIR", is_approved=1)
        create_worklog(db, personnel_name="User3", time_start=start, time_end=end, 
                      service_type="BAKIM", is_approved=0)
        
        r = client.get("/api/worklog/stats")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        
        stats = body["data"]
        assert stats["total_logs"] == 3
        assert stats["approved"] == 2
        assert stats["pending_approval"] == 1
        assert stats["total_hours"] == 6.0  # 3 log * 2 saat
        
        # by_personnel kontrolü
        assert "User1" in stats["by_personnel"]
        assert stats["by_personnel"]["User1"]["count"] == 1
        assert stats["by_personnel"]["User1"]["hours"] == 2.0
        
        # by_service_type kontrolü
        assert "BAKIM" in stats["by_service_type"]
        assert stats["by_service_type"]["BAKIM"]["count"] == 2
        assert stats["by_service_type"]["BAKIM"]["hours"] == 4.0
    
    def test_pagination(self, client, db):
        """Pagination meta bilgileri doğru"""
        for i in range(15):
            create_worklog(db, personnel_name=f"User{i}")
        
        r = client.get("/api/worklog?page=1&page_size=10")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 10
        assert body["pagination"]["total"] == 15
        assert body["pagination"]["page"] == 1
        assert body["pagination"]["total_pages"] == 2
        assert body["pagination"]["has_next"] is True
