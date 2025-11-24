import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from aliaport_api.modules.auth.models import User, Role
from aliaport_api.modules.auth.utils import hash_password, create_access_token, create_refresh_token

pytestmark = [pytest.mark.api]


@pytest.fixture(scope="function")
def create_roles(db: Session):
    # Minimal two roles for testing
    admin = Role(name="SISTEM_YONETICISI", description="System admin")
    oper = Role(name="OPERASYON", description="Operasyon")
    db.add(admin)
    db.add(oper)
    db.commit()
    db.refresh(admin)
    db.refresh(oper)
    return {"admin": admin, "oper": oper}


@pytest.fixture(scope="function")
def create_users(db: Session, create_roles):
    admin_user = User(
        email="admin@example.com",
        hashed_password=hash_password("Admin1234"),
        full_name="Admin User",
        is_active=True,
        is_superuser=False,
    )
    admin_user.roles = [create_roles["admin"]]

    normal_user = User(
        email="user@example.com",
        hashed_password=hash_password("User12345"),
        full_name="Normal User",
        is_active=True,
        is_superuser=False,
    )
    normal_user.roles = [create_roles["oper"]]

    inactive_user = User(
        email="inactive@example.com",
        hashed_password=hash_password("Inactive123"),
        full_name="Inactive User",
        is_active=False,
        is_superuser=False,
    )

    super_user = User(
        email="super@example.com",
        hashed_password=hash_password("Super12345"),
        full_name="Super User",
        is_active=True,
        is_superuser=True,
    )

    db.add_all([admin_user, normal_user, inactive_user, super_user])
    db.commit()
    for u in [admin_user, normal_user, inactive_user, super_user]:
        db.refresh(u)
    return {
        "admin": admin_user,
        "normal": normal_user,
        "inactive": inactive_user,
        "super": super_user,
    }


class TestAuthEndpoints:
    def test_login_success(self, client: TestClient, create_users):
        resp = client.post("/auth/login", json={"email": "user@example.com", "password": "User12345"})
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "access_token" in data and "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client: TestClient, create_users):
        resp = client.post("/auth/login", json={"email": "user@example.com", "password": "WrongPass1"})
        assert resp.status_code == 401
        body = resp.json()
        assert body.get("detail") == "Incorrect email or password"

    def test_login_inactive_user(self, client: TestClient, create_users):
        resp = client.post("/auth/login", json={"email": "inactive@example.com", "password": "Inactive123"})
        assert resp.status_code == 403
        assert resp.json().get("detail") == "User account is inactive"

    def test_me_endpoint_requires_auth(self, client: TestClient):
        resp = client.get("/auth/me")
        assert resp.status_code == 403 or resp.status_code == 401

    def test_me_endpoint_success(self, client: TestClient, create_users):
        # login to get token
        login = client.post("/auth/login", json={"email": "user@example.com", "password": "User12345"})
        token = login.json()["access_token"]
        me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == "user@example.com"

    def test_refresh_token_success(self, client: TestClient, create_users):
        login = client.post("/auth/login", json={"email": "user@example.com", "password": "User12345"})
        refresh_token = login.json()["refresh_token"]
        resp = client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        data = resp.json()
        assert data["access_token"] != login.json()["access_token"]

    def test_refresh_token_invalid(self, client: TestClient):
        resp = client.post("/auth/refresh", json={"refresh_token": "invalid.token.value"})
        assert resp.status_code == 401
        assert resp.json().get("detail") == "Invalid refresh token"

    def test_logout(self, client: TestClient, create_users):
        login = client.post("/auth/login", json={"email": "user@example.com", "password": "User12345"})
        token = login.json()["access_token"]
        resp = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["message"] == "Logged out successfully"

    def test_admin_create_user_requires_role(self, client: TestClient, create_users):
        # normal user token
        login = client.post("/auth/login", json={"email": "user@example.com", "password": "User12345"})
        token = login.json()["access_token"]
        resp = client.post(
            "/auth/users",
            json={
                "email": "newuser@example.com",
                "password": "Newuser123",
                "full_name": "New User",
                "is_active": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    def test_admin_create_user_success(self, client: TestClient, create_users):
        # admin user token
        login = client.post("/auth/login", json={"email": "admin@example.com", "password": "Admin1234"})
        token = login.json()["access_token"]
        resp = client.post(
            "/auth/users",
            json={
                "email": "created@example.com",
                "password": "Created123",
                "full_name": "Created User",
                "is_active": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "created@example.com"

    def test_list_users_admin_only(self, client: TestClient, create_users):
        # normal user attempt
        login_u = client.post("/auth/login", json={"email": "user@example.com", "password": "User12345"})
        token_u = login_u.json()["access_token"]
        r_fail = client.get("/auth/users", headers={"Authorization": f"Bearer {token_u}"})
        assert r_fail.status_code == 403
        # admin user success
        login_a = client.post("/auth/login", json={"email": "admin@example.com", "password": "Admin1234"})
        token_a = login_a.json()["access_token"]
        r_ok = client.get("/auth/users", headers={"Authorization": f"Bearer {token_a}"})
        assert r_ok.status_code == 200
        assert isinstance(r_ok.json(), list)
        assert any(u["email"] == "admin@example.com" for u in r_ok.json())

    def test_update_user_email_conflict(self, client: TestClient, create_users):
        # create conflict target: we'll try to rename normal to admin email
        login_a = client.post("/auth/login", json={"email": "admin@example.com", "password": "Admin1234"})
        token_a = login_a.json()["access_token"]
        # get normal user id
        login_n = client.post("/auth/login", json={"email": "user@example.com", "password": "User12345"})
        token_n = login_n.json()["access_token"]
        # admin lists users to find normal user id
        r_list = client.get("/auth/users", headers={"Authorization": f"Bearer {token_a}"})
        normal_id = next(u["id"] for u in r_list.json() if u["email"] == "user@example.com")
        # attempt update to existing email
        r_update = client.put(
            f"/auth/users/{normal_id}",
            json={"email": "admin@example.com"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert r_update.status_code == 400
        assert r_update.json().get("detail") == "Email already registered"

    def test_superuser_bypass_roles(self, client: TestClient, create_users):
        login_s = client.post("/auth/login", json={"email": "super@example.com", "password": "Super12345"})
        token_s = login_s.json()["access_token"]
        # Super user should list users without SISTEM_YONETICISI role
        r_list = client.get("/auth/users", headers={"Authorization": f"Bearer {token_s}"})
        assert r_list.status_code == 200


def test_auth_smoke():
    assert True