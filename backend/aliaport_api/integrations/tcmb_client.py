"""
TCMB (Türkiye Cumhuriyet Merkez Bankası) Client
Günlük döviz kurlarını TCMB XML API'den çekme
"""

import requests
import re
from datetime import date, datetime
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class TCMBClient:
    """
    TCMB XML API Client
    
    API Endpoint: https://www.tcmb.gov.tr/kurlar/today.xml
    Döküman: https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Doviz+Kurlari
    
    XML Format:
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
        ...
    </Tarih_Date>
    """
    
    BASE_URL = "https://www.tcmb.gov.tr/kurlar"
    TIMEOUT = 10  # seconds
    
    # İlgilendiğimiz döviz kodları
    TARGET_CURRENCIES = ["USD", "EUR", "GBP"]
    
    def __init__(self):
        self.session = requests.Session()
        # TCMB bazı User-Agent'ları blokluyor, curl UA kullan
        self.session.headers.update({
            'User-Agent': 'curl/8.0'
        })
        self.session.headers.update({
            "User-Agent": "Aliaport/3.1 (Liman Yönetim Sistemi)",
            "Accept": "application/xml, text/xml"
        })
    
    def get_daily_rates(self, target_date: Optional[date] = None) -> List[Dict]:
        """
        Günlük döviz kurlarını çek
        
        Args:
            target_date: Hangi tarih için kur? (None = bugün)
        
        Returns:
            List[Dict]: Kur listesi
            [
                {
                    "doviz_kodu": "USD",
                    "alis": 32.50,
                    "satis": 32.60,
                    "efektif_alis": 32.45,
                    "efektif_satis": 32.65
                },
                ...
            ]
        
        Raises:
            TCMBAPIError: API çağrısı başarısız olursa
        """
        try:
            # TCMB today.xml her zaman en güncel kuru döndürür
            # Tarihsel veriler için /kurlar/YYYYMM/DDMMYYYY.xml formatı kullanılabilir
            # Ama günlük sync için today.xml güvenilir
            url = f"{self.BASE_URL}/today.xml"
            
            logger.info(f"TCMB API çağrısı: {url}")
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            # XML yerine regex ile parse (TCMB User-Agent kontrolü yapıyor)
            xml_text = response.text
            
            # HTML error page check
            if "<html" in xml_text.lower() or "page not found" in xml_text.lower():
                raise TCMBAPIError("TCMB API HTML error page döndürdü (User-Agent block olabilir)")
            
            rates = []
            
            # Her döviz için regex ile Currency bloğunu bul
            for currency_code in self.TARGET_CURRENCIES:
                pattern = (
                    rf'<Currency[^>]*Kod="{currency_code}"[^>]*>'
                    r'.*?<ForexBuying>([\d.]+)</ForexBuying>'
                    r'.*?<ForexSelling>([\d.]+)</ForexSelling>'
                    r'.*?<BanknoteBuying>([\d.]+)</BanknoteBuying>'
                    r'.*?<BanknoteSelling>([\d.]+)</BanknoteSelling>'
                )
                
                match = re.search(pattern, xml_text, re.DOTALL)
                
                if match:
                    try:
                        rate = {
                            "doviz_kodu": currency_code,
                            "alis": float(match.group(1)),
                            "satis": float(match.group(2)),
                            "efektif_alis": float(match.group(3)),
                            "efektif_satis": float(match.group(4))
                        }
                        
                        rates.append(rate)
                        logger.debug(f"{currency_code}: Alış={rate['alis']}, Satış={rate['satis']}")
                    
                    except ValueError as e:
                        logger.warning(f"{currency_code} parse hatası: {e}")
                        continue
                else:
                    logger.warning(f"{currency_code} için TCMB XML'de eşleşme yok")
            
            if not rates:
                raise TCMBAPIError(f"TCMB API'den kur alınamadı: {target_date}")
            
            logger.info(f"✅ TCMB'den {len(rates)} kur alındı")
            return rates
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ TCMB API error: {e}")
            raise TCMBAPIError(f"TCMB API çağrısı başarısız: {str(e)}") from e
        
        except re.error as e:
            logger.error(f"❌ TCMB regex parse error: {e}")
            raise TCMBAPIError(f"TCMB regex parse hatası: {str(e)}") from e
    
    def get_today_url(self) -> str:
        """
        Bugünkü kurlar için URL
        
        Returns:
            str: TCMB today.xml URL
        """
        return f"{self.BASE_URL}/today.xml"


class TCMBAPIError(Exception):
    """TCMB API hatası"""
    pass
