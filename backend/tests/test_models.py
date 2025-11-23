# backend/tests/test_models.py
"""
Unit tests for SQLAlchemy models.
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError

from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.isemri.models import WorkOrder, WorkOrderItem
from aliaport_api.modules.motorbot.models import Motorbot, MbTrip
from aliaport_api.modules.hizmet.models import Hizmet
from aliaport_api.modules.parametre.models import Parametre
from aliaport_api.modules.kurlar.models import ExchangeRate


@pytest.mark.unit
class TestCariModel:
    """Tests for Cari model."""
    
    def test_create_cari(self, db):
        """Test creating a Cari."""
        cari = Cari(
            cari_code="C001",
            cari_unvan="Test Şirketi",
            cari_tip="MUSTERI",
            is_active=True
        )
        db.add(cari)
        db.commit()
        
        assert cari.id is not None
        assert cari.cari_code == "C001"
        assert cari.created_at is not None
    
    def test_cari_unique_code(self, db):
        """Test that cari_code must be unique."""
        cari1 = Cari(cari_code="C001", cari_unvan="Test 1", cari_tip="MUSTERI")
        db.add(cari1)
        db.commit()
        
        cari2 = Cari(cari_code="C001", cari_unvan="Test 2", cari_tip="MUSTERI")
        db.add(cari2)
        
        with pytest.raises(IntegrityError):
            db.commit()
    
    def test_cari_soft_delete(self, db, sample_cari):
        """Test soft delete (is_active flag)."""
        assert sample_cari.is_active is True
        
        sample_cari.is_active = False
        db.commit()
        
        assert sample_cari.is_active is False


@pytest.mark.unit
class TestWorkOrderModel:
    """Tests for WorkOrder model."""
    
    def test_create_work_order(self, db, sample_cari):
        """Test creating a WorkOrder."""
        wo = WorkOrder(
            wo_number="WO-2025-0001",
            cari_id=sample_cari.id,
            cari_code=sample_cari.cari_code,
            type="HIZMET",
            subject="Test WO",
            status="DRAFT",
            created_by="admin"
        )
        db.add(wo)
        db.commit()
        
        assert wo.id is not None
        assert wo.wo_number == "WO-2025-0001"
        assert wo.status == "DRAFT"
        assert wo.created_at is not None
    
    def test_work_order_unique_number(self, db, sample_cari):
        """Test that wo_number must be unique."""
        wo1 = WorkOrder(
            wo_number="WO-2025-0001",
            cari_id=sample_cari.id,
            cari_code=sample_cari.cari_code,
            type="HIZMET",
            subject="WO 1",
            status="DRAFT",
            created_by="admin"
        )
        db.add(wo1)
        db.commit()
        
        wo2 = WorkOrder(
            wo_number="WO-2025-0001",
            cari_id=sample_cari.id,
            cari_code=sample_cari.cari_code,
            type="HIZMET",
            subject="WO 2",
            status="DRAFT",
            created_by="admin"
        )
        db.add(wo2)
        
        with pytest.raises(IntegrityError):
            db.commit()
    
    def test_work_order_status_change(self, db, sample_work_order):
        """Test changing WorkOrder status."""
        assert sample_work_order.status == "DRAFT"
        
        sample_work_order.status = "APPROVED"
        db.commit()
        
        assert sample_work_order.status == "APPROVED"
        assert sample_work_order.updated_at is not None


@pytest.mark.unit
class TestWorkOrderItemModel:
    """Tests for WorkOrderItem model."""
    
    def test_create_work_order_item(self, db, sample_work_order, sample_hizmet):
        """Test creating a WorkOrderItem."""
        item = WorkOrderItem(
            wo_id=sample_work_order.id,
            item_type="HIZMET",
            hizmet_id=sample_hizmet.id,
            hizmet_kodu=sample_hizmet.hizmet_kodu,
            description="Test item",
            quantity=10.0,
            unit_price=100.0,
            total_amount=1000.0,
            vat_rate=20.0,
            vat_amount=200.0
        )
        db.add(item)
        db.commit()
        
        assert item.id is not None
        assert item.wo_id == sample_work_order.id
        assert item.quantity == 10.0
        assert item.total_amount == 1000.0


@pytest.mark.unit
class TestMotorbotModel:
    """Tests for Motorbot model."""
    
    def test_create_motorbot(self, db):
        """Test creating a Motorbot."""
        mb = Motorbot(
            mb_code="MB001",
            mb_adi="Test Motorbot",
            mb_length=25.5,
            mb_capacity=500.0,
            is_active=True
        )
        db.add(mb)
        db.commit()
        
        assert mb.id is not None
        assert mb.mb_code == "MB001"
        assert mb.mb_length == 25.5
    
    def test_motorbot_unique_code(self, db):
        """Test that mb_code must be unique."""
        mb1 = Motorbot(mb_code="MB001", mb_adi="MB 1")
        db.add(mb1)
        db.commit()
        
        mb2 = Motorbot(mb_code="MB001", mb_adi="MB 2")
        db.add(mb2)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.unit
class TestMbTripModel:
    """Tests for MbTrip model."""
    
    def test_create_mb_trip(self, db, sample_motorbot):
        """Test creating a MbTrip."""
        trip = MbTrip(
            motorbot_id=sample_motorbot.id,
            mb_code=sample_motorbot.mb_code,
            cikis_zamani=datetime.utcnow(),
            donus_zamani=datetime.utcnow() + timedelta(hours=2),
            cikis_iskelesi="Haydarpaşa",
            donus_iskelesi="Haydarpaşa",
            status="TAMAMLANDI"
        )
        db.add(trip)
        db.commit()
        
        assert trip.id is not None
        assert trip.motorbot_id == sample_motorbot.id
        assert trip.status == "TAMAMLANDI"


@pytest.mark.unit
class TestHizmetModel:
    """Tests for Hizmet model."""
    
    def test_create_hizmet(self, db):
        """Test creating a Hizmet."""
        hizmet = Hizmet(
            hizmet_kodu="H001",
            hizmet_adi="Römorkör",
            birim="SAAT",
            is_active=True
        )
        db.add(hizmet)
        db.commit()
        
        assert hizmet.id is not None
        assert hizmet.hizmet_kodu == "H001"
    
    def test_hizmet_unique_code(self, db):
        """Test that hizmet_kodu must be unique."""
        h1 = Hizmet(hizmet_kodu="H001", hizmet_adi="Test 1")
        db.add(h1)
        db.commit()
        
        h2 = Hizmet(hizmet_kodu="H001", hizmet_adi="Test 2")
        db.add(h2)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.unit
class TestParametreModel:
    """Tests for Parametre model."""
    
    def test_create_parametre(self, db):
        """Test creating a Parametre."""
        param = Parametre(
            param_code="TEST",
            param_category="GENEL",
            param_value="100",
            param_description="Test parameter"
        )
        db.add(param)
        db.commit()
        
        assert param.id is not None
        assert param.param_code == "TEST"
    
    def test_parametre_unique_code(self, db):
        """Test that param_code must be unique."""
        p1 = Parametre(param_code="TEST", param_category="GENEL", param_value="1")
        db.add(p1)
        db.commit()
        
        p2 = Parametre(param_code="TEST", param_category="GENEL", param_value="2")
        db.add(p2)
        
        with pytest.raises(IntegrityError):
            db.commit()


@pytest.mark.unit
class TestExchangeRateModel:
    """Tests for ExchangeRate model."""
    
    def test_create_exchange_rate(self, db):
        """Test creating an ExchangeRate."""
        rate = ExchangeRate(
            currency_pair="USD_TRY",
            date=datetime.utcnow().date(),
            forex_buying=34.5678,
            forex_selling=34.7890,
            is_published=True,
            is_frozen=False
        )
        db.add(rate)
        db.commit()
        
        assert rate.id is not None
        assert rate.currency_pair == "USD_TRY"
        assert rate.forex_buying == 34.5678
    
    def test_exchange_rate_freeze(self, db):
        """Test freezing an exchange rate."""
        rate = ExchangeRate(
            currency_pair="USD_TRY",
            date=datetime.utcnow().date(),
            forex_buying=34.5678,
            forex_selling=34.7890,
            is_published=True,
            is_frozen=False
        )
        db.add(rate)
        db.commit()
        
        assert rate.is_frozen is False
        
        rate.is_frozen = True
        db.commit()
        
        assert rate.is_frozen is True
