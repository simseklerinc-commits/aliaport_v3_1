import pytest
from aliaport_api.integrations.tcmb_client import TCMBClient, TCMBAPIError
import requests

class DummyResponse:
    def __init__(self, text: str, status_code: int = 200):
        self.text = text
        self.status_code = status_code
    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")

XML_TEMPLATE = """
<Tarih_Date Tarih="23.11.2025" Date="11/23/2025" Bulten_No="2025/225">
    <Currency CrossOrder="0" Kod="USD" CurrencyCode="USD">
        <Unit>1</Unit>
        <Isim>ABD DOLARI</Isim>
        <CurrencyName>US DOLLAR</CurrencyName>
        <ForexBuying>32.5000</ForexBuying>
        <ForexSelling>32.6000</ForexSelling>
        <BanknoteBuying>32.4500</BanknoteBuying>
        <BanknoteSelling>32.6500</BanknoteSelling>
    </Currency>
    <Currency CrossOrder="0" Kod="EUR" CurrencyCode="EUR">
        <Unit>1</Unit>
        <Isim>EURO</Isim>
        <CurrencyName>EURO</CurrencyName>
        <ForexBuying>35.7000</ForexBuying>
        <ForexSelling>35.8200</ForexSelling>
        <BanknoteBuying>35.6500</BanknoteBuying>
        <BanknoteSelling>35.8700</BanknoteSelling>
    </Currency>
    <Currency CrossOrder="0" Kod="GBP" CurrencyCode="GBP">
        <Unit>1</Unit>
        <Isim>İNGİLİZ STERLİNİ</Isim>
        <CurrencyName>POUND</CurrencyName>
        <ForexBuying>41.1000</ForexBuying>
        <ForexSelling>41.2500</ForexSelling>
        <BanknoteBuying>41.0500</BanknoteBuying>
        <BanknoteSelling>41.3000</BanknoteSelling>
    </Currency>
</Tarih_Date>
""".strip()


def patch_get(monkeypatch, text: str, status: int = 200):
    def fake_get(self, url, timeout):
        assert "today.xml" in url
        return DummyResponse(text=text, status_code=status)
    monkeypatch.setattr(requests.Session, "get", fake_get)


class TestTCMBClient:
    def test_success_all_three(self, monkeypatch):
        patch_get(monkeypatch, XML_TEMPLATE)
        client = TCMBClient()
        rates = client.get_daily_rates()
        assert len(rates) == 3
        codes = {r["doviz_kodu"] for r in rates}
        assert codes == {"USD", "EUR", "GBP"}
        assert all("alis" in r and "satis" in r for r in rates)

    def test_missing_one_currency(self, monkeypatch):
        # Remove entire GBP block to simulate missing currency
        parts = XML_TEMPLATE.split("\n")
        filtered = []
        skip = False
        for line in parts:
            if 'Kod="GBP"' in line:
                skip = True
            if skip:
                if '</Currency>' in line:
                    skip = False
                continue
            filtered.append(line)
        xml_missing = "\n".join(filtered)
        patch_get(monkeypatch, xml_missing)
        client = TCMBClient()
        rates = client.get_daily_rates()
        codes = {r["doviz_kodu"] for r in rates}
        assert "GBP" not in codes
        assert len(rates) == 2

    def test_no_rates_raises(self, monkeypatch):
        empty_xml = "<Tarih_Date></Tarih_Date>"
        patch_get(monkeypatch, empty_xml)
        client = TCMBClient()
        with pytest.raises(TCMBAPIError):
            client.get_daily_rates()

    def test_html_error_page(self, monkeypatch):
        html_text = "<html><head><title>Blocked</title></head><body>User-Agent blocked</body></html>"
        patch_get(monkeypatch, html_text)
        client = TCMBClient()
        with pytest.raises(TCMBAPIError):
            client.get_daily_rates()

    def test_network_error(self, monkeypatch):
        def fake_get(self, url, timeout):
            raise requests.exceptions.RequestException("timeout")
        monkeypatch.setattr(requests.Session, "get", fake_get)
        client = TCMBClient()
        with pytest.raises(TCMBAPIError):
            client.get_daily_rates()
