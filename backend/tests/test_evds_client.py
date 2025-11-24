import pytest
import requests
from datetime import date
from aliaport_api.integrations.evds_client import EVDSClient, EVDSAPIError

class DummyJSONResponse:
    def __init__(self, data: dict, status_code: int = 200):
        self._data = data
        self.status_code = status_code
    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")
    def json(self):
        return self._data

SUCCESS_ITEM_MAP = {
    "USD": {
        "TP_DK_USD_A": "32.5000",
        "TP_DK_USD_S": "32.6000",
        "TP_DK_USD_A_YTL": "32.4500",
        "TP_DK_USD_S_YTL": "32.6500",
    },
    "EUR": {
        "TP_DK_EUR_A": "35.7000",
        "TP_DK_EUR_S": "35.8200",
        "TP_DK_EUR_A_YTL": "35.6500",
        "TP_DK_EUR_S_YTL": "35.8700",
    },
    "GBP": {
        "TP_DK_GBP_A": "41.1000",
        "TP_DK_GBP_S": "41.2500",
        "TP_DK_GBP_A_YTL": "41.0500",
        "TP_DK_GBP_S_YTL": "41.3000",
    },
}


def make_response_for(url: str, params: dict, missing: set = None, bad: set = None):
    # url contains series=SERIES_STR; determine currency by presence of USD/EUR/GBP
    for code in ["USD","EUR","GBP"]:
        if code in url:
            if missing and code in missing:
                return DummyJSONResponse({"items": []})
            item_map = SUCCESS_ITEM_MAP[code].copy()
            if bad and code in bad:
                # Corrupt one value to trigger parse failure and skip
                item_map[next(iter(item_map.keys()))] = "NOT_A_FLOAT"
            return DummyJSONResponse({"items": [item_map]})
    return DummyJSONResponse({"items": []})


def patch_session_get(monkeypatch, missing=None, bad=None, network=False):
    def fake_get(self, url, params=None, timeout=None):
        if network:
            raise requests.exceptions.RequestException("network error")
        return make_response_for(url, params or {}, missing=missing, bad=bad)
    monkeypatch.setattr(requests.Session, "get", fake_get)


class TestEVDSClient:
    def test_success_all_three(self, monkeypatch):
        patch_session_get(monkeypatch)
        client = EVDSClient(api_key="DUMMY")
        rates = client.get_daily_rates(date.today())
        assert len(rates) == 3
        codes = {r["doviz_kodu"] for r in rates}
        assert codes == {"USD","EUR","GBP"}
        assert all("alis" in r and "efektif_satis" in r for r in rates)

    def test_missing_one_currency(self, monkeypatch):
        patch_session_get(monkeypatch, missing={"GBP"})
        client = EVDSClient(api_key="DUMMY")
        rates = client.get_daily_rates(date.today())
        codes = {r["doviz_kodu"] for r in rates}
        assert "GBP" not in codes
        assert len(rates) == 2

    def test_all_missing_raises(self, monkeypatch):
        patch_session_get(monkeypatch, missing={"USD","EUR","GBP"})
        client = EVDSClient(api_key="DUMMY")
        with pytest.raises(EVDSAPIError):
            client.get_daily_rates(date.today())

    def test_network_error(self, monkeypatch):
        patch_session_get(monkeypatch, network=True)
        client = EVDSClient(api_key="DUMMY")
        with pytest.raises(EVDSAPIError):
            client.get_daily_rates(date.today())

    def test_parse_error_skips_currency(self, monkeypatch):
        patch_session_get(monkeypatch, bad={"EUR"})
        client = EVDSClient(api_key="DUMMY")
        rates = client.get_daily_rates(date.today())
        codes = {r["doviz_kodu"] for r in rates}
        assert "EUR" not in codes  # parse failure skipped
        assert len(rates) == 2
