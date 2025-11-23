"""
EVDS (Elektronik Veri Dağıtım Sistemi) Client
TCMB EVDS API ile kur çekme (fallback)
"""

import requests
from datetime import date, datetime
from typing import List, Dict, Optional
import logging
import os

logger = logging.getLogger(__name__)


class EVDSClient:
    """
    EVDS API Client (TCMB Fallback)
    
    API Endpoint: https://evds2.tcmb.gov.tr/service/evds/
    Döküman: https://evds2.tcmb.gov.tr/help/videos/EVDS_Web_Servis_Kullanim_Kilavuzu.pdf
    
    API Key: EVDS'den alınmalı (https://evds2.tcmb.gov.tr/)
    
    Örnek Response:
    {
        "items": [
            {
                "Tarih": "23-11-2025",
                "TP_DK_USD_A": "32.5000",
                "TP_DK_USD_S": "32.6000",
                ...
            }
        ]
    }
    """
    
    BASE_URL = "https://evds2.tcmb.gov.tr/service/evds"
    TIMEOUT = 15  # seconds
    
    # EVDS seri kodları (döviz kurları)
    SERIES_CODES = {
        "USD": {
            "alis": "TP.DK.USD.A",
            "satis": "TP.DK.USD.S",
            "efektif_alis": "TP.DK.USD.A.YTL",
            "efektif_satis": "TP.DK.USD.S.YTL"
        },
        "EUR": {
            "alis": "TP.DK.EUR.A",
            "satis": "TP.DK.EUR.S",
            "efektif_alis": "TP.DK.EUR.A.YTL",
            "efektif_satis": "TP.DK.EUR.S.YTL"
        },
        "GBP": {
            "alis": "TP.DK.GBP.A",
            "satis": "TP.DK.GBP.S",
            "efektif_alis": "TP.DK.GBP.A.YTL",
            "efektif_satis": "TP.DK.GBP.S.YTL"
        }
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: EVDS API key (None ise environment'tan alır)
        """
        self.api_key = api_key or os.getenv("EVDS_API_KEY")
        if not self.api_key:
            raise ValueError("EVDS_API_KEY gerekli (environment variable veya constructor)")
        
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Aliaport/3.1 (Liman Yönetim Sistemi)",
            "Accept": "application/json"
        })
    
    def get_daily_rates(self, target_date: Optional[date] = None) -> List[Dict]:
        """
        Günlük döviz kurlarını çek
        
        Args:
            target_date: Hangi tarih için kur? (None = bugün)
        
        Returns:
            List[Dict]: Kur listesi (TCMB client ile aynı format)
        
        Raises:
            EVDSAPIError: API çağrısı başarısız olursa
        """
        target_date = target_date or date.today()
        
        try:
            logger.info(f"EVDS API çağrısı: {target_date}")
            
            rates = []
            
            # Her döviz için ayrı ayrı çek
            for currency_code, series in self.SERIES_CODES.items():
                try:
                    rate_data = self._fetch_currency_rate(currency_code, series, target_date)
                    if rate_data:
                        rates.append(rate_data)
                except Exception as e:
                    logger.error(f"{currency_code} için EVDS hatası: {e}")
                    continue
            
            if not rates:
                raise EVDSAPIError(f"EVDS API'den kur alınamadı: {target_date}")
            
            logger.info(f"✅ EVDS'den {len(rates)} kur alındı")
            return rates
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ EVDS API error: {e}")
            raise EVDSAPIError(f"EVDS API çağrısı başarısız: {str(e)}") from e
    
    def _fetch_currency_rate(
        self, 
        currency_code: str, 
        series: Dict[str, str], 
        target_date: date
    ) -> Optional[Dict]:
        """
        Tek bir döviz için EVDS'den kur çek
        
        Args:
            currency_code: Döviz kodu (USD, EUR, GBP)
            series: EVDS seri kodları dict
            target_date: Hedef tarih
        
        Returns:
            Dict: Kur verisi veya None
        """
        # EVDS date format: DD-MM-YYYY
        date_str = target_date.strftime("%d-%m-%Y")
        
        # Seri kodlarını birleştir (tire ile)
        series_str = "-".join([
            series["alis"],
            series["satis"],
            series["efektif_alis"],
            series["efektif_satis"]
        ])
        
        # EVDS API: GET /service/evds/series=SERIE1-SERIE2&startDate=...
        # Doğru format: https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.A-TP.DK.USD.S&key=...&type=json
        params = {
            "key": self.api_key,
            "type": "json",
            "startDate": date_str,
            "endDate": date_str
        }
        
        # URL'de series path'e dahil, params'da değil
        url = f"{self.BASE_URL}/series={series_str}"
        
        response = self.session.get(url, params=params, timeout=self.TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        
        # EVDS response parse
        if "items" not in data or not data["items"]:
            logger.warning(f"{currency_code} için EVDS'den veri yok")
            return None
        
        item = data["items"][0]  # İlk (ve tek) tarih
        
        try:
            rate = {
                "doviz_kodu": currency_code,
                "alis": float(item.get(series["alis"].replace(".", "_"), 0)),
                "satis": float(item.get(series["satis"].replace(".", "_"), 0)),
                "efektif_alis": float(item.get(series["efektif_alis"].replace(".", "_"), 0)),
                "efektif_satis": float(item.get(series["efektif_satis"].replace(".", "_"), 0))
            }
            
            logger.debug(f"{currency_code}: Alış={rate['alis']}, Satış={rate['satis']}")
            return rate
        
        except (ValueError, KeyError) as e:
            logger.error(f"{currency_code} EVDS parse hatası: {e}")
            return None


class EVDSAPIError(Exception):
    """EVDS API hatası"""
    pass
