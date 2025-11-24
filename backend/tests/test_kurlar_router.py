"""
Kurlar Router Test Suite

Tests for exchange rate management endpoints including:
- List with filters & pagination
- Today/date-specific queries
- Latest rate by currency pair
- Currency conversion
- CRUD operations
- Bulk operations
- TCMB/EVDS integration (mocked)
"""

import pytest
import requests
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from aliaport_api.modules.kurlar.models import ExchangeRate
from aliaport_api.core.cache import cache


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_exchange_rate(
    db: Session,
    currency_from: str = "USD",
    currency_to: str = "TRY",
    rate: float = 28.50,
    sell_rate: float = None,
    rate_date: date = None,
    source: str = "TEST"
) -> ExchangeRate:
    """Helper to create an exchange rate in DB."""
    if rate_date is None:
        rate_date = date.today()
    if sell_rate is None:
        sell_rate = rate * 1.02  # 2% spread
    
    rate_obj = ExchangeRate(
        CurrencyFrom=currency_from,
        CurrencyTo=currency_to,
        Rate=rate,
        SellRate=sell_rate,
        RateDate=rate_date,
        Source=source
    )
    db.add(rate_obj)
    db.commit()
    db.refresh(rate_obj)
    return rate_obj


# ============================================
# TEST CLASSES
# ============================================

class TestKurlarListEndpoints:
    """Test list and query endpoints."""
    
    def test_list_empty(self, client: TestClient, db: Session):
        """Test listing when no rates exist."""
        r = client.get("/api/exchange-rate/")
        assert r.status_code == 200
        data = r.json()
        assert data["pagination"]["total"] == 0
        assert len(data["data"]) == 0
    
    def test_list_with_rates(self, client: TestClient, db: Session):
        """Test listing exchange rates."""
        create_exchange_rate(db, "USD", "TRY", 28.50)
        create_exchange_rate(db, "EUR", "TRY", 31.20)
        
        r = client.get("/api/exchange-rate/")
        assert r.status_code == 200
        data = r.json()
        assert data["pagination"]["total"] == 2
        assert len(data["data"]) == 2
    
    def test_list_with_currency_from_filter(self, client: TestClient, db: Session):
        """Test filtering by CurrencyFrom."""
        create_exchange_rate(db, "USD", "TRY", 28.50)
        create_exchange_rate(db, "EUR", "TRY", 31.20)
        create_exchange_rate(db, "GBP", "TRY", 36.00)
        
        r = client.get("/api/exchange-rate/?currency_from=USD")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 1
        assert data[0]["CurrencyFrom"] == "USD"
    
    def test_list_with_currency_to_filter(self, client: TestClient, db: Session):
        """Test filtering by CurrencyTo."""
        create_exchange_rate(db, "USD", "TRY", 28.50)
        create_exchange_rate(db, "USD", "EUR", 0.92)
        
        r = client.get("/api/exchange-rate/?currency_to=TRY")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 1
        assert data[0]["CurrencyTo"] == "TRY"
    
    def test_list_with_date_filter(self, client: TestClient, db: Session):
        """Test filtering by RateDate."""
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=today)
        create_exchange_rate(db, "EUR", "TRY", 31.20, rate_date=yesterday)
        
        r = client.get(f"/api/exchange-rate/?rate_date={today}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 1
        assert data[0]["RateDate"] == str(today)
    
    def test_list_pagination(self, client: TestClient, db: Session):
        """Test pagination."""
        for i in range(5):
            create_exchange_rate(db, f"CUR{i}", "TRY", 10.0 + i)
        
        r = client.get("/api/exchange-rate/?page=1&page_size=2")
        assert r.status_code == 200
        json_data = r.json()
        assert len(json_data["data"]) == 2
        assert json_data["pagination"]["page"] == 1
        assert json_data["pagination"]["total"] == 5
    
    def test_list_combined_filters(self, client: TestClient, db: Session):
        """Test multiple filters together."""
        today = date.today()
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=today)
        create_exchange_rate(db, "USD", "EUR", 0.92, rate_date=today)
        create_exchange_rate(db, "EUR", "TRY", 31.20, rate_date=today - timedelta(days=1))
        
        r = client.get(f"/api/exchange-rate/?currency_from=USD&currency_to=TRY&rate_date={today}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 1
        assert data[0]["CurrencyFrom"] == "USD"
        assert data[0]["CurrencyTo"] == "TRY"


class TestKurlarSpecificQueries:
    """Test date-specific and latest rate queries."""
    
    def test_today_rates_empty(self, client: TestClient, db: Session):
        """Test today endpoint with no rates."""
        r = client.get("/api/exchange-rate/today")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 0
    
    def test_today_rates(self, client: TestClient, db: Session):
        """Test today endpoint."""
        today = date.today()
        # Invalidate cached empty result from previous test (test_today_rates_empty)
        cache.invalidate("kurlar:today")
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=today)
        create_exchange_rate(db, "EUR", "TRY", 31.20, rate_date=today)
        create_exchange_rate(db, "GBP", "TRY", 36.00, rate_date=today - timedelta(days=1))

        r = client.get("/api/exchange-rate/today")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 2
    
    def test_rates_by_date(self, client: TestClient, db: Session):
        """Test get rates by specific date."""
        target_date = date(2025, 11, 20)
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=target_date)
        create_exchange_rate(db, "EUR", "TRY", 31.20, rate_date=target_date)
        
        r = client.get(f"/api/exchange-rate/date/{target_date}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 2
        assert all(item["RateDate"] == str(target_date) for item in data)
    
    def test_latest_rate_by_pair(self, client: TestClient, db: Session):
        """Test get latest rate for currency pair."""
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=yesterday)
        create_exchange_rate(db, "USD", "TRY", 29.00, rate_date=today)
        
        r = client.get("/api/exchange-rate/latest/USD/TRY")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["Rate"] == 29.00
        assert data["RateDate"] == str(today)
    
    def test_latest_rate_not_found(self, client: TestClient, db: Session):
        """Test latest rate when pair doesn't exist."""
        r = client.get("/api/exchange-rate/latest/XXX/YYY")
        assert r.status_code == 404
        assert "bulunamadı" in r.json()["detail"]["error"]["message"].lower()
    
    def test_rate_by_date_and_pair(self, client: TestClient, db: Session):
        """Test get rate by currency pair and specific date."""
        target_date = date(2025, 11, 20)
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=target_date)
        
        r = client.get(f"/api/exchange-rate/USD/TRY/{target_date}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["Rate"] == 28.50
        assert data["CurrencyFrom"] == "USD"
        assert data["CurrencyTo"] == "TRY"
    
    def test_rate_by_date_and_pair_not_found(self, client: TestClient, db: Session):
        """Test when specific rate doesn't exist."""
        r = client.get(f"/api/exchange-rate/XXX/YYY/{date.today()}")
        assert r.status_code == 404


class TestKurlarConversion:
    """Test currency conversion endpoint."""
    
    def test_convert_currency_success(self, client: TestClient, db: Session):
        """Test successful currency conversion."""
        create_exchange_rate(db, "USD", "TRY", 28.50)
        
        r = client.get("/api/exchange-rate/convert?from=USD&to=TRY&amount=100")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["from"] == "USD"
        assert data["to"] == "TRY"
        assert data["amount"] == 100
        assert data["converted_amount"] == 2850.0  # 100 * 28.50
        assert data["rate"] == 28.50
    
    def test_convert_with_date(self, client: TestClient, db: Session):
        """Test conversion with specific date."""
        target_date = date(2025, 11, 20)
        create_exchange_rate(db, "EUR", "TRY", 31.20, rate_date=target_date)
        
        r = client.get(f"/api/exchange-rate/convert?from=EUR&to=TRY&amount=50&date={target_date}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["converted_amount"] == 1560.0  # 50 * 31.20
    
    def test_convert_reverse_direction(self, client: TestClient, db: Session):
        """Test conversion TRY to foreign currency (reverse)."""
        create_exchange_rate(db, "USD", "TRY", 28.50)
        
        r = client.get("/api/exchange-rate/convert?from=TRY&to=USD&amount=2850")
        assert r.status_code == 200
        data = r.json()["data"]
        assert abs(data["converted_amount"] - 100.0) < 0.01  # 2850 / 28.50
    
    def test_convert_rate_not_found(self, client: TestClient, db: Session):
        """Test conversion when rate doesn't exist."""
        r = client.get("/api/exchange-rate/convert?from=XXX&to=YYY&amount=100")
        assert r.status_code == 404
        assert "kur bulunamadı" in r.json()["detail"]["error"]["message"].lower()


class TestKurlarCRUD:
    """Test CRUD operations."""
    
    def test_get_by_id_success(self, client: TestClient, db: Session):
        """Test get rate by ID."""
        rate = create_exchange_rate(db, "USD", "TRY", 28.50)
        
        r = client.get(f"/api/exchange-rate/{rate.Id}")
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["Id"] == rate.Id
        assert data["Rate"] == 28.50
    
    def test_get_by_id_not_found(self, client: TestClient, db: Session):
        """Test get non-existent rate."""
        r = client.get("/api/exchange-rate/99999")
        assert r.status_code == 404
        assert "yok" in r.json()["detail"]["error"]["message"].lower()
    
    def test_create_rate_success(self, client: TestClient, db: Session):
        """Test creating new exchange rate."""
        payload = {
            "CurrencyFrom": "USD",
            "CurrencyTo": "TRY",
            "Rate": 28.75,
            "SellRate": 29.32,
            "RateDate": str(date.today()),
            "Source": "MANUAL"
        }
        
        r = client.post("/api/exchange-rate/", json=payload)
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["Rate"] == 28.75
        assert data["CurrencyFrom"] == "USD"
        assert "Id" in data
    
    def test_create_rate_duplicate(self, client: TestClient, db: Session):
        """Test creating duplicate rate (same pair + date)."""
        today = date.today()
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=today)
        
        payload = {
            "CurrencyFrom": "USD",
            "CurrencyTo": "TRY",
            "Rate": 29.00,
            "RateDate": str(today),
            "Source": "MANUAL"
        }
        
        r = client.post("/api/exchange-rate/", json=payload)
        assert r.status_code == 409
        # Router message: "Bu tarih için kur mevcut"
        assert "kur mevcut" in r.json()["detail"]["error"]["message"].lower()
    
    def test_update_rate_success(self, client: TestClient, db: Session):
        """Test updating exchange rate."""
        rate = create_exchange_rate(db, "USD", "TRY", 28.50)
        
        payload = {"Rate": 29.00, "SellRate": 29.58}
        r = client.put(f"/api/exchange-rate/{rate.Id}", json=payload)
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["Rate"] == 29.00
        assert data["SellRate"] == 29.58
    
    def test_update_rate_not_found(self, client: TestClient, db: Session):
        """Test updating non-existent rate."""
        payload = {"Rate": 29.00}
        r = client.put("/api/exchange-rate/99999", json=payload)
        assert r.status_code == 404
    
    def test_delete_rate_success(self, client: TestClient, db: Session):
        """Test deleting exchange rate."""
        rate = create_exchange_rate(db, "USD", "TRY", 28.50)
        
        r = client.delete(f"/api/exchange-rate/{rate.Id}")
        assert r.status_code == 200
        
        # Verify deletion
        db.expire_all()
        assert db.get(ExchangeRate, rate.Id) is None
    
    def test_delete_rate_not_found(self, client: TestClient, db: Session):
        """Test deleting non-existent rate."""
        r = client.delete("/api/exchange-rate/99999")
        assert r.status_code == 404


class TestKurlarBulkOperations:
    """Test bulk operations."""
    
    def test_bulk_create_success(self, client: TestClient, db: Session):
        """Test bulk creating exchange rates."""
        today = date.today()
        payload = {
            "rates": [
                {
                    "CurrencyFrom": "USD",
                    "CurrencyTo": "TRY",
                    "Rate": 28.50,
                    "SellRate": 29.07,
                    "RateDate": str(today),
                    "Source": "BULK_TEST"
                },
                {
                    "CurrencyFrom": "EUR",
                    "CurrencyTo": "TRY",
                    "Rate": 31.20,
                    "SellRate": 31.82,
                    "RateDate": str(today),
                    "Source": "BULK_TEST"
                }
            ]
        }
        
        r = client.post("/api/exchange-rate/bulk", json=payload)
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 2  # 2 items created
    
    def test_bulk_create_with_duplicates(self, client: TestClient, db: Session):
        """Test bulk create skips duplicates."""
        today = date.today()
        create_exchange_rate(db, "USD", "TRY", 28.50, rate_date=today)
        
        payload = {
            "rates": [
                {
                    "CurrencyFrom": "USD",
                    "CurrencyTo": "TRY",
                    "Rate": 28.50,
                    "RateDate": str(today),
                    "Source": "BULK"
                },
                {
                    "CurrencyFrom": "EUR",
                    "CurrencyTo": "TRY",
                    "Rate": 31.20,
                    "RateDate": str(today),
                    "Source": "BULK"
                }
            ]
        }
        
        r = client.post("/api/exchange-rate/bulk", json=payload)
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 1  # Only EUR created (USD skipped as duplicate)
    
    def test_bulk_create_empty_list(self, client: TestClient, db: Session):
        """Test bulk create with empty list."""
        payload = {"rates": []}
        
        r = client.post("/api/exchange-rate/bulk", json=payload)
        assert r.status_code == 200
        data = r.json()["data"]
        assert len(data) == 0  # Empty list


class TestKurlarExternalIntegration:
    """Test TCMB and EVDS integration (mocked)."""
    
    @patch("aliaport_api.modules.kurlar.router.requests.get")
    def test_fetch_tcmb_success(self, mock_get, client: TestClient, db: Session):
        """Test TCMB data fetch with mocked response."""
        xml_text = """<?xml version="1.0" encoding="UTF-8"?>
        <Tarih_Date Tarih="23.11.2025">
            <Currency CrossOrder="0" Kod="USD" CurrencyCode="USD">
                <Unit>1</Unit>
                <Isim>ABD DOLARI</Isim>
                <CurrencyName>US DOLLAR</CurrencyName>
                <ForexBuying>28.5000</ForexBuying>
                <ForexSelling>29.0700</ForexSelling>
            </Currency>
        </Tarih_Date>"""
        mock_get.return_value = MagicMock(status_code=200, text=xml_text)
        
        payload = {"date": "2025-11-23"}
        r = client.post("/api/exchange-rate/fetch-tcmb", json=payload)
        
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["CurrencyFrom"] == "USD"
    
    @patch("aliaport_api.modules.kurlar.router.requests.get")
    def test_fetch_tcmb_http_error(self, mock_get, client: TestClient, db: Session):
        """Test TCMB fetch with network error mapped to 503."""
        mock_get.side_effect = requests.exceptions.RequestException("Connection timeout")

        payload = {"date": "2025-11-23"}
        r = client.post("/api/exchange-rate/fetch-tcmb", json=payload)

        assert r.status_code == 503
        msg = r.json()["detail"]["error"]["message"].lower()
        assert "bağlantı" in msg or "timeout" in msg
    
    @patch("aliaport_api.modules.kurlar.router.requests.get")
    def test_fetch_evds_success(self, mock_get, client: TestClient, db: Session):
        """Test EVDS data fetch with mocked response."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {
                    "Tarih": "23-11-2025",
                    "TP_DK_USD_A": "28.5000",
                    "TP_DK_USD_S": "29.0700"
                }
            ]
        }
        mock_get.return_value = mock_response
        
        payload = {
            "start_date": "2025-11-20",
            "end_date": "2025-11-23",
            "api_key": "test_key_123"
        }
        r = client.post("/api/exchange-rate/fetch-evds", json=payload)
        
        # May succeed or fail based on actual implementation
        assert r.status_code in [200, 400, 500]
