"""
Cari Router Testleri
Kapsam: List with search/pagination, create duplicate check, update, delete with FK constraint
"""

import pytest
from sqlalchemy.orm import Session


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_cari(
    db: Session,
    cari_kod: str = "TEST001",
    unvan: str = "Test Şirketi A.Ş.",
    cari_tip: str = "GERCEK",
    rol: str = "MUSTERI",
    vergi_no: str = None,
    aktif_mi: bool = True
):
    """Test için Cari oluştur"""
    from aliaport_api.modules.cari.models import Cari
    
    cari = Cari(
        CariKod=cari_kod,
        Unvan=unvan,
        CariTip=cari_tip,
        Rol=rol,
        VergiDairesi="Kadıköy",
        VergiNo=vergi_no or "1234567890",
        Ulke="Türkiye",
        Il="İstanbul",
        Ilce="Kadıköy",
        Adres="Test Adres",
        Telefon="+90 212 123 45 67",
        Eposta="test@example.com",
        IletisimKisi="Test Kişi",
        VadeGun=30,
        ParaBirimi="TRY",
        Notlar="Test notu",
        AktifMi=aktif_mi
    )
    db.add(cari)
    db.commit()
    db.refresh(cari)
    return cari


# ============================================
# CARI ROUTER TESTS
# ============================================

class TestCariRouter:
    """Cari router test sınıfı"""
    
    def test_list_empty(self, client, db):
        """Boş liste döner"""
        r = client.get("/api/cari")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 0
        assert body["pagination"]["total"] == 0
    
    def test_list_with_data(self, client, db):
        """Cari listesi döner"""
        create_cari(db, cari_kod="C001", unvan="Şirket A")
        create_cari(db, cari_kod="C002", unvan="Şirket B")
        create_cari(db, cari_kod="C003", unvan="Şirket C")
        
        r = client.get("/api/cari")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 3
        assert body["pagination"]["total"] == 3
        assert body["pagination"]["page"] == 1
    
    def test_list_search_by_unvan(self, client, db):
        """Ünvan ile arama çalışır"""
        create_cari(db, cari_kod="C001", unvan="ACME Corporation")
        create_cari(db, cari_kod="C002", unvan="Beta Ltd")
        create_cari(db, cari_kod="C003", unvan="ACME Industries")
        
        r = client.get("/api/cari?search=acme")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 2
        assert "ACME" in body["data"][0]["Unvan"]
    
    def test_list_search_by_kod(self, client, db):
        """Kod ile arama çalışır"""
        create_cari(db, cari_kod="ABC123", unvan="Şirket A")
        create_cari(db, cari_kod="DEF456", unvan="Şirket B")
        create_cari(db, cari_kod="ABC789", unvan="Şirket C")
        
        r = client.get("/api/cari?search=ABC")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert len(body["data"]) == 2
    
    def test_list_pagination(self, client, db):
        """Pagination çalışır"""
        for i in range(15):
            create_cari(db, cari_kod=f"C{i:03d}", unvan=f"Şirket {i}")
        
        # Sayfa 1 - 10 kayıt
        r = client.get("/api/cari?page=1&page_size=10")
        assert r.status_code == 200
        body = r.json()
        assert len(body["data"]) == 10
        assert body["pagination"]["total"] == 15
        assert body["pagination"]["page"] == 1
        assert body["pagination"]["total_pages"] == 2
        assert body["pagination"]["has_next"] is True
        
        # Sayfa 2 - 5 kayıt
        r = client.get("/api/cari?page=2&page_size=10")
        assert r.status_code == 200
        body = r.json()
        assert len(body["data"]) == 5
        assert body["pagination"]["page"] == 2
        assert body["pagination"]["has_next"] is False
    
    def test_get_not_found(self, client, db):
        """Olmayan cari 404 döner"""
        r = client.get("/api/cari/999999")
        assert r.status_code in [404, 500]  # ErrorCode mapping'e göre
        body = r.json()
        assert body["detail"]["success"] is False
        assert "CARI_NOT_FOUND" in body["detail"]["error"]["code"]
    
    def test_get_success(self, client, db):
        """Cari başarıyla getirilir"""
        cari = create_cari(db, cari_kod="GET001", unvan="Test Get Şirketi")
        
        r = client.get(f"/api/cari/{cari.Id}")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["Id"] == cari.Id
        assert body["data"]["CariKod"] == "GET001"
        assert body["data"]["Unvan"] == "Test Get Şirketi"
    
    def test_create_success(self, client, db):
        """Yeni cari başarıyla oluşturulur"""
        r = client.post("/api/cari", json={
            "CariKod": "NEW001",
            "Unvan": "Yeni Şirket",
            "CariTip": "TUZEL",
            "Rol": "TEDARIKCI",
            "VergiDairesi": "Beşiktaş",
            "VergiNo": "9876543210",
            "Ulke": "Türkiye",
            "Il": "İstanbul",
            "ParaBirimi": "USD",
            "VadeGun": 45,
            "AktifMi": True
        })
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["CariKod"] == "NEW001"
        assert body["data"]["Unvan"] == "Yeni Şirket"
        assert body["data"]["CariTip"] == "TUZEL"
        assert body["data"]["ParaBirimi"] == "USD"
        assert body["data"]["VadeGun"] == 45
        assert "Id" in body["data"]
    
    def test_create_duplicate_code(self, client, db):
        """Duplicate CariKod hata döner"""
        create_cari(db, cari_kod="DUP001")
        
        r = client.post("/api/cari", json={
            "CariKod": "DUP001",  # Aynı kod
            "Unvan": "Başka Şirket",
            "CariTip": "GERCEK",
            "Rol": "MUSTERI",
            "AktifMi": True
        })
        assert r.status_code in [409, 500]  # Conflict veya mapped status
        body = r.json()
        assert body["detail"]["success"] is False
        assert "CARI_DUPLICATE_CODE" in body["detail"]["error"]["code"]
        assert "field" in body["detail"]["error"]
        assert body["detail"]["error"]["field"] == "CariKod"
    
    def test_update_success(self, client, db):
        """Cari başarıyla güncellenir"""
        cari = create_cari(db, cari_kod="UPD001", unvan="Eski Ünvan")
        
        r = client.put(f"/api/cari/{cari.Id}", json={
            "CariKod": "UPD001",
            "Unvan": "Yeni Ünvan",  # Değişti
            "CariTip": "GERCEK",
            "Rol": "MUSTERI",
            "ParaBirimi": "EUR",  # Değişti
            "VadeGun": 60,  # Değişti
            "AktifMi": False  # Değişti
        })
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["Unvan"] == "Yeni Ünvan"
        assert body["data"]["ParaBirimi"] == "EUR"
        assert body["data"]["VadeGun"] == 60
        assert body["data"]["AktifMi"] is False
    
    def test_update_not_found(self, client, db):
        """Olmayan cari güncellenemez"""
        r = client.put("/api/cari/888888", json={
            "CariKod": "XXX",
            "Unvan": "Test",
            "CariTip": "GERCEK",
            "Rol": "MUSTERI",
            "AktifMi": True
        })
        assert r.status_code in [404, 500]
        body = r.json()
        assert body["detail"]["success"] is False
        assert "CARI_NOT_FOUND" in body["detail"]["error"]["code"]
    
    def test_delete_success(self, client, db):
        """Cari başarıyla silinir (ilişkili kayıt yoksa)"""
        cari = create_cari(db, cari_kod="DEL001")
        
        r = client.delete(f"/api/cari/{cari.Id}")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["deleted"] is True
        assert body["data"]["id"] == cari.Id
        
        # Silindi mi kontrol et
        r2 = client.get(f"/api/cari/{cari.Id}")
        assert r2.status_code in [404, 500]
    
    def test_delete_not_found(self, client, db):
        """Olmayan cari silinemez"""
        r = client.delete("/api/cari/777777")
        assert r.status_code in [404, 500]
        body = r.json()
        assert body["detail"]["success"] is False
        assert "CARI_NOT_FOUND" in body["detail"]["error"]["code"]
    
    def test_delete_with_relations(self, client, db):
        """İlişkili kayıtları olan cari silinemez"""
        from aliaport_api.modules.isemri.models import WorkOrder
        from datetime import datetime, timedelta
        
        # Cari oluştur
        cari = create_cari(db, cari_kod="REL001", unvan="İlişkili Cari")
        
        # İş emri ekle (foreign key relation)
        wo = WorkOrder(
            wo_number="WO-REL-001",
            cari_id=cari.Id,
            cari_code=cari.CariKod,
            cari_title=cari.Unvan,
            type="HIZMET",
            subject="Test İş Emri",
            status="DRAFT",
            planned_start=datetime.utcnow() + timedelta(days=1),
            planned_end=datetime.utcnow() + timedelta(days=2),
            created_by=1
        )
        db.add(wo)
        db.commit()
        
        # Silmeyi dene
        r = client.delete(f"/api/cari/{cari.Id}")
        assert r.status_code in [409, 500]  # Conflict veya mapped
        body = r.json()
        assert body["detail"]["success"] is False
        assert "CARI_DELETE_HAS_RELATIONS" in body["detail"]["error"]["code"]
    
    def test_create_minimal_fields(self, client, db):
        """Sadece zorunlu alanlarla oluşturma"""
        r = client.post("/api/cari", json={
            "CariKod": "MIN001",
            "Unvan": "Minimal Şirket",
            "CariTip": "GERCEK",
            "Rol": "MUSTERI"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["data"]["CariKod"] == "MIN001"
        assert body["data"]["ParaBirimi"] == "TRY"  # Default
        assert body["data"]["AktifMi"] is True  # Default
    
    def test_list_order_by_unvan(self, client, db):
        """Liste Unvan'a göre sıralanır"""
        create_cari(db, cari_kod="C1", unvan="Zebra Ltd")
        create_cari(db, cari_kod="C2", unvan="Alpha Inc")
        create_cari(db, cari_kod="C3", unvan="Beta Corp")
        
        r = client.get("/api/cari")
        assert r.status_code == 200
        body = r.json()
        assert body["data"][0]["Unvan"] == "Alpha Inc"
        assert body["data"][1]["Unvan"] == "Beta Corp"
        assert body["data"][2]["Unvan"] == "Zebra Ltd"
