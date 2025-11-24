import pytest
from sqlalchemy.orm import Session
from datetime import datetime

from aliaport_api.modules.auth.models import User, Role
from aliaport_api.modules.auth.schemas import UserCreate, UserUpdate
from aliaport_api.modules.auth.service import AuthService

pytestmark = [pytest.mark.unit]


@pytest.fixture(scope="function")
def roles(db: Session):
    r1 = Role(name="SISTEM_YONETICISI", description="Admin")
    r2 = Role(name="OPERASYON", description="Operasyon")
    db.add_all([r1, r2])
    db.commit()
    db.refresh(r1)
    db.refresh(r2)
    return [r1, r2]


def test_create_user_with_roles_and_hash(db: Session, roles):
    payload = UserCreate(
        email="svcuser@example.com",
        password="Service123",
        full_name="Service User",
        role_ids=[roles[0].id, roles[1].id],
        is_active=True,
    )
    user = AuthService.create_user(db, payload)
    assert user.id is not None
    assert user.email == "svcuser@example.com"
    assert user.hashed_password != payload.password  # hashed
    assert {r.name for r in user.roles} == {"SISTEM_YONETICISI", "OPERASYON"}


def test_update_user_change_password_and_roles(db: Session, roles):
    # create initial user with first role only
    create_payload = UserCreate(
        email="update@example.com",
        password="Initial123",
        full_name="Initial User",
        role_ids=[roles[0].id],
    )
    user = AuthService.create_user(db, create_payload)
    old_hash = user.hashed_password
    # prepare new role list & password
    upd = UserUpdate(password="Changed123", role_ids=[roles[1].id], full_name="Changed User")
    updated = AuthService.update_user(db, user.id, upd)
    assert updated.full_name == "Changed User"
    assert updated.hashed_password != old_hash
    assert {r.name for r in updated.roles} == {"OPERASYON"}


def test_update_last_login_sets_timestamp(db: Session, roles):
    create_payload = UserCreate(
        email="lastlogin@example.com",
        password="LastLogin1",
        full_name="LL User",
        role_ids=[roles[0].id],
    )
    user = AuthService.create_user(db, create_payload)
    assert user.last_login is None
    AuthService.update_last_login(db, user.id)
    refreshed = AuthService.get_user_by_id(db, user.id)
    assert isinstance(refreshed.last_login, datetime)


def test_list_users_filter_is_active(db: Session, roles):
    # active user
    AuthService.create_user(db, UserCreate(
        email="active1@example.com",
        password="Active123",
        full_name="Active User",
        role_ids=[roles[0].id],
        is_active=True,
    ))
    # inactive user
    AuthService.create_user(db, UserCreate(
        email="inactive1@example.com",
        password="Inactive123",
        full_name="Inactive User",
        role_ids=[roles[0].id],
        is_active=False,
    ))
    active_list = AuthService.list_users(db, is_active=True)
    inactive_list = AuthService.list_users(db, is_active=False)
    assert any(u.email == "active1@example.com" for u in active_list)
    assert all(u.is_active for u in active_list)
    assert any(u.email == "inactive1@example.com" for u in inactive_list)
    assert all(not u.is_active for u in inactive_list)


def test_generate_tokens_contains_roles(db: Session, roles):
    user = AuthService.create_user(db, UserCreate(
        email="tokenuser@example.com",
        password="TokenUser1",
        full_name="Token User",
        role_ids=[roles[0].id, roles[1].id],
    ))
    tokens = AuthService.generate_tokens(user)
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    # Decode JWT payload safely and validate roles list
    import base64, json
    parts = tokens["access_token"].split(".")
    assert len(parts) == 3, "Invalid JWT format"
    payload_raw = parts[1] + "=" * (-len(parts[1]) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_raw).decode())
    assert set(payload.get("roles", [])) == {"SISTEM_YONETICISI", "OPERASYON"}
