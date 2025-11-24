# backend/tests/conftest.py
"""
Pytest configuration and fixtures for Aliaport tests.
"""
import os
import sys
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from aliaport_api.main import app
from aliaport_api.config.database import Base, get_db
from aliaport_api.modules.auth.models import User
from aliaport_api.modules.auth.utils import hash_password


# Test database URL (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    Create a fresh database for each test.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with dependency injection.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(db: Session) -> User:
    """Testler için basit admin kullanıcı (şifre: Admin123!)."""
    user = User(
        email="admin@aliaport.com",
        hashed_password=hash_password("Admin123!"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(client: TestClient, admin_user: User) -> dict:
    """JWT alan auth header üret (email + password)."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@aliaport.com", "password": "Admin123!"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    access_token = data["access_token"] if "access_token" in data else data["data"]["access_token"] if "data" in data else None
    assert access_token, "Access token alınamadı"
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def sample_cari(db: Session):
    """
    Create a sample Cari for tests.
    """
    from aliaport_api.modules.cari.models import Cari
    cari = Cari(
        CariKod="C001",
        Unvan="Test Şirketi A.Ş.",
        CariTip="GERCEK",
        Rol="MUSTERI",
        VergiDairesi="Kadıköy",
        VergiNo="1234567890",
        Tckn=None,
        Ulke="Türkiye",
        Il="İstanbul",
        Ilce="Kadıköy",
        Adres="İstanbul",
        Telefon="+90 212 123 45 67",
        Eposta="test@example.com",
        IletisimKisi="Yetkili Kişi",
        Iban=None,
        VadeGun=30,
        ParaBirimi="TRY",
        Notlar="Test notu",
        AktifMi=True
    )
    db.add(cari)
    db.commit()
    db.refresh(cari)
    return cari


@pytest.fixture(scope="function")
def sample_work_order(db: Session, sample_cari):
    """Create a sample WorkOrder using actual field names."""
    from aliaport_api.modules.isemri.models import WorkOrder
    from datetime import datetime, timedelta
    wo = WorkOrder(
        wo_number="WO-2025-0001",
        cari_id=sample_cari.Id,
        cari_code=sample_cari.CariKod,
        cari_title=sample_cari.Unvan,
        type="HIZMET",
        subject="Test İş Emri",
        description="Test açıklaması",
        status="DRAFT",
        planned_start=datetime.utcnow() + timedelta(days=1),
        planned_end=datetime.utcnow() + timedelta(days=2),
        created_by=1
    )
    db.add(wo)
    db.commit()
    db.refresh(wo)
    return wo


@pytest.fixture(scope="function")
def sample_motorbot(db: Session):
    """Create a sample Motorbot using real field names."""
    from aliaport_api.modules.motorbot.models import Motorbot
    mb = Motorbot(
        Kod="MB001",
        Ad="Test Motorbot",
        Durum="AKTIF"
    )
    db.add(mb)
    db.commit()
    db.refresh(mb)
    return mb


@pytest.fixture(scope="function")
def sample_hizmet(db: Session):
    """Create a sample Hizmet using real field names."""
    from aliaport_api.modules.hizmet.models import Hizmet
    hizmet = Hizmet(
        Kod="H001",
        Ad="Römorkör Hizmeti",
        Birim="SAAT",
        ParaBirimi="TRY",
        AktifMi=True
    )
    db.add(hizmet)
    db.commit()
    db.refresh(hizmet)
    return hizmet


@pytest.fixture(scope="function")
def sample_parametre(db: Session):
    """Create a sample Parametre using real field names."""
    from aliaport_api.modules.parametre.models import Parametre
    param = Parametre(
        Kategori="GENEL",
        Kod="TEST_PARAM",
        Ad="Test Parametre",
        Deger="Test Value",
        Aciklama="Test parametresi",
        AktifMi=True
    )
    db.add(param)
    db.commit()
    db.refresh(param)
    return param


# Test data factories
def create_cari(db: Session, **kwargs):
    """Factory: create Cari with Turkish field names."""
    from aliaport_api.modules.cari.models import Cari
    defaults = {
        "CariKod": "C999",
        "Unvan": "Factory Cari",
        "CariTip": "GERCEK",
        "Rol": "MUSTERI",
        "AktifMi": True
    }
    defaults.update(kwargs)
    cari = Cari(**defaults)
    db.add(cari)
    db.commit()
    db.refresh(cari)
    return cari


def create_work_order(db: Session, cari, **kwargs):
    """Factory: create WorkOrder with actual field names."""
    from aliaport_api.modules.isemri.models import WorkOrder
    from datetime import datetime, timedelta
    defaults = {
        "wo_number": f"WO-TEST-{datetime.utcnow().timestamp()}",
        "cari_id": cari.Id,
        "cari_code": cari.CariKod,
        "cari_title": cari.Unvan,
        "type": "HIZMET",
        "subject": "Factory WO",
        "status": "DRAFT",
        "planned_start": datetime.utcnow() + timedelta(days=1),
        "planned_end": datetime.utcnow() + timedelta(days=2),
        "created_by": 1
    }
    defaults.update(kwargs)
    wo = WorkOrder(**defaults)
    db.add(wo)
    db.commit()
    db.refresh(wo)
    return wo


# Pytest configuration
def pytest_configure(config):
    """Configure pytest."""
    config.addinivalue_line(
        "markers", "unit: Unit tests (fast, isolated)"
    )
    config.addinivalue_line(
        "markers", "integration: Integration tests (slower, with database)"
    )
    config.addinivalue_line(
        "markers", "api: API endpoint tests"
    )
    config.addinivalue_line(
        "markers", "slow: Slow tests (skip with -m 'not slow')"
    )
