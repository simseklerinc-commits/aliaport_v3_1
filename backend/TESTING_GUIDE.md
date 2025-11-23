# Aliaport v3.1 - Testing Guide

## Overview

Aliaport uses **pytest** for testing. We have three test categories:
- **Unit tests** - Fast, isolated tests for models and business logic
- **API tests** - Endpoint tests with TestClient
- **Integration tests** - End-to-end workflow tests

**Coverage Target:** 80%+

---

## Setup

### Install Dependencies
```bash
cd backend
pip install -r requirements-dev.txt
```

### Verify Installation
```bash
pytest --version
# pytest 8.3.2
```

---

## Running Tests

### Run All Tests
```bash
pytest
```

### Run Specific Test File
```bash
pytest tests/test_models.py
pytest tests/test_api_cari.py
```

### Run Specific Test Class
```bash
pytest tests/test_models.py::TestCariModel
```

### Run Specific Test Function
```bash
pytest tests/test_api_cari.py::TestCariEndpoints::test_create_cari
```

### Run by Marker
```bash
# Only unit tests (fast)
pytest -m unit

# Only API tests
pytest -m api

# Skip slow tests
pytest -m "not slow"

# Integration tests only
pytest -m integration
```

### Run with Coverage
```bash
pytest --cov=aliaport_api --cov-report=html

# Open coverage report
open htmlcov/index.html  # macOS/Linux
start htmlcov\index.html  # Windows
```

### Verbose Output
```bash
pytest -v
pytest -vv  # Extra verbose
```

### Show Print Statements
```bash
pytest -s
```

### Stop on First Failure
```bash
pytest -x
```

### Run Last Failed Tests
```bash
pytest --lf
```

### Run Tests in Parallel
```bash
pip install pytest-xdist
pytest -n auto  # Use all CPU cores
```

---

## Test Structure

### Fixtures (conftest.py)
```python
@pytest.fixture(scope="function")
def db():
    """Fresh database for each test."""
    ...

@pytest.fixture
def client(db):
    """Test client with dependency injection."""
    ...

@pytest.fixture
def auth_headers(client, admin_user):
    """Authenticated request headers."""
    ...

@pytest.fixture
def sample_cari(db):
    """Sample Cari record."""
    ...
```

### Test File Naming
```
tests/
├── conftest.py              # Fixtures
├── test_models.py           # Model unit tests
├── test_api_cari.py         # Cari endpoint tests
├── test_api_workorder.py    # WorkOrder endpoint tests
├── test_business_logic.py   # Business rules tests
└── test_integration.py      # E2E workflow tests
```

### Test Function Naming
```python
def test_create_cari(client, auth_headers):
    """Test creating a cari."""
    ...

def test_cari_duplicate_code(client, auth_headers, sample_cari):
    """Test duplicate cari code error."""
    ...
```

---

## Writing Tests

### Unit Test Example
```python
import pytest
from aliaport_api.modules.cari.models import Cari

@pytest.mark.unit
def test_create_cari(db):
    """Test creating a Cari model."""
    cari = Cari(
        cari_code="C001",
        cari_unvan="Test Şirketi",
        cari_tip="MUSTERI"
    )
    db.add(cari)
    db.commit()
    
    assert cari.id is not None
    assert cari.cari_code == "C001"
    assert cari.created_at is not None
```

### API Test Example
```python
@pytest.mark.api
def test_list_cari(client, auth_headers, sample_cari):
    """Test GET /api/cari endpoint."""
    response = client.get("/api/cari", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
```

### Error Handling Test
```python
def test_cari_not_found(client, auth_headers):
    """Test 404 for non-existent cari."""
    response = client.get("/api/cari/99999", headers=auth_headers)
    
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "CARI_NOT_FOUND"
```

### Validation Test
```python
def test_create_cari_validation_error(client, auth_headers):
    """Test validation errors."""
    payload = {
        "cari_code": "C001",
        # Missing cari_unvan (required)
    }
    
    response = client.post("/api/cari", json=payload, headers=auth_headers)
    
    assert response.status_code == 422
```

### Parameterized Test
```python
@pytest.mark.parametrize("status,expected_count", [
    ("DRAFT", 5),
    ("APPROVED", 3),
    ("SAHADA", 2),
])
def test_work_order_by_status(client, auth_headers, status, expected_count):
    """Test filtering work orders by status."""
    response = client.get(f"/api/work-order?status={status}", headers=auth_headers)
    assert len(response.json()["data"]) == expected_count
```

---

## Fixtures Guide

### Using Fixtures
```python
def test_example(db, client, auth_headers, sample_cari):
    """Fixtures are automatically injected."""
    # db: Database session
    # client: TestClient
    # auth_headers: {"Authorization": "Bearer ..."}
    # sample_cari: Pre-created Cari instance
    ...
```

### Custom Fixtures
```python
# In conftest.py or test file
@pytest.fixture
def sample_work_order_with_items(db, sample_cari, sample_hizmet):
    """Work order with 3 items."""
    wo = create_work_order(db, sample_cari)
    for i in range(3):
        item = create_work_order_item(db, wo, sample_hizmet)
    return wo

# Use in test
def test_work_order_total(sample_work_order_with_items):
    assert len(sample_work_order_with_items.items) == 3
```

---

## Coverage

### View Coverage Summary
```bash
pytest --cov=aliaport_api --cov-report=term-missing
```

**Output:**
```
Name                                      Stmts   Miss  Cover   Missing
-----------------------------------------------------------------------
aliaport_api/modules/cari/models.py          45      2    96%   23, 45
aliaport_api/modules/cari/router.py          67      5    93%   12-15, 89
...
TOTAL                                      1234     98    92%
```

### HTML Coverage Report
```bash
pytest --cov=aliaport_api --cov-report=html
open htmlcov/index.html
```

### Coverage by File
```bash
pytest --cov=aliaport_api/modules/cari --cov-report=term
```

### Exclude Files from Coverage
```python
# .coveragerc
[run]
omit =
    */tests/*
    */migrations/*
    */conftest.py
```

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements-dev.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=aliaport_api --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
```

---

## Mocking

### Mock External API Calls
```python
from unittest.mock import patch

def test_tcmb_fetch_success(client, auth_headers, mocker):
    """Test TCMB API call with mock."""
    mock_response = {
        "currency_pair": "USD_TRY",
        "forex_buying": 34.5678
    }
    
    mocker.patch(
        'aliaport_api.integrations.tcmb_client.TCMBClient.fetch_rates',
        return_value=mock_response
    )
    
    response = client.post("/api/exchange-rate/fetch-tcmb", headers=auth_headers)
    assert response.status_code == 200
```

### Mock Database Queries
```python
def test_cari_list_with_mock(client, auth_headers, mocker):
    """Test cari list with mocked database."""
    mock_cari_list = [
        {"id": 1, "cari_code": "C001", "cari_unvan": "Test 1"},
        {"id": 2, "cari_code": "C002", "cari_unvan": "Test 2"},
    ]
    
    mocker.patch(
        'aliaport_api.modules.cari.router.get_cari_list',
        return_value=mock_cari_list
    )
    
    response = client.get("/api/cari", headers=auth_headers)
    assert len(response.json()["data"]) == 2
```

---

## Best Practices

### 1. Test One Thing Per Test
❌ Bad:
```python
def test_cari_operations(client, auth_headers):
    # Create
    create_response = client.post(...)
    # Update
    update_response = client.put(...)
    # Delete
    delete_response = client.delete(...)
```

✅ Good:
```python
def test_create_cari(client, auth_headers):
    response = client.post(...)
    assert response.status_code == 200

def test_update_cari(client, auth_headers, sample_cari):
    response = client.put(...)
    assert response.status_code == 200

def test_delete_cari(client, auth_headers, sample_cari):
    response = client.delete(...)
    assert response.status_code == 200
```

### 2. Use Descriptive Names
```python
# Good test names
def test_create_cari_with_duplicate_code_returns_409():
    ...

def test_work_order_status_transition_from_draft_to_approved():
    ...

def test_unauthorized_user_cannot_access_admin_endpoint():
    ...
```

### 3. Arrange-Act-Assert Pattern
```python
def test_create_cari(client, auth_headers):
    # Arrange
    payload = {
        "cari_code": "C001",
        "cari_unvan": "Test",
        "cari_tip": "MUSTERI"
    }
    
    # Act
    response = client.post("/api/cari", json=payload, headers=auth_headers)
    
    # Assert
    assert response.status_code == 200
    assert response.json()["data"]["cari_code"] == "C001"
```

### 4. Don't Test Third-Party Code
❌ Don't test SQLAlchemy, FastAPI, etc.
✅ Test your business logic and integrations

### 5. Use Fixtures for Common Setup
```python
# Instead of this in every test:
def test_something(client):
    cari = Cari(...)
    db.add(cari)
    db.commit()
    ...

# Use fixture:
def test_something(sample_cari):
    # sample_cari already created
    ...
```

---

## Troubleshooting

### Issue: "ImportError: No module named aliaport_api"
**Solution:**
```bash
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest
```

### Issue: "Database locked" or connection errors
**Solution:**
```python
# In conftest.py, use in-memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
```

### Issue: Tests fail in CI but pass locally
**Solution:**
- Check environment variables
- Verify database service is running
- Check file permissions
- Ensure dependencies are installed

### Issue: Slow tests
**Solution:**
```bash
# Run only fast tests
pytest -m "not slow"

# Use pytest-xdist for parallel execution
pytest -n auto
```

---

## Next Steps

1. **Increase coverage to 80%+**
   - Add tests for all router endpoints
   - Test error conditions
   - Test business logic

2. **Add integration tests**
   - End-to-end workflows
   - Multi-module interactions

3. **Performance tests**
   - Load testing with k6
   - Database query optimization

4. **Security tests**
   - Authentication bypass attempts
   - SQL injection tests
   - XSS tests

---

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [FastAPI testing guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [Coverage.py documentation](https://coverage.readthedocs.io/)

---

**Last Updated:** 23 Kasım 2025
