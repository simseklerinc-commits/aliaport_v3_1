"""
EVDS (Elektronik Veri Dağıtım Sistemi) Client
TCMB EVDS API - Resmi Web Servis Entegrasyonu

Resmi Döküman: https://evds2.tcmb.gov.tr/help/videos/EVDS_Web_Servis_Kullanim_Kilavuzu.pdf
API Endpoint: https://evds2.tcmb.gov.tr/service/evds/
API Key: https://evds2.tcmb.gov.tr/ adresinden ücretsiz alınır

EVDS Avantajları:
- TCMB XML'den daha güvenilir (resmi veri kaynağı)
- Tarihsel veri desteği (son 5 yıl)
- Çoklu seri çekme (batch request)
- JSON/XML format desteği
- Rate limiting: 1000 request/day (free tier)
"""

import requests
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional
import logging
import os

logger = logging.getLogger(__name__)


class EVDSClient:
    """
    TCMB EVDS (Elektronik Veri Dağıtım Sistemi) API Client
    
    API Structure:
    - Base: https://evds2.tcmb.gov.tr/service/evds/
    - Format: /series={SERIES_CODE}&startDate={DD-MM-YYYY}&endDate={DD-MM-YYYY}&type=json&key={API_KEY}
    
    Response Format:
    {
        "totalCount": 1,
        "items": [
            {
                "Tarih": "24-11-2025",
                "TP_DK_USD_A": "34.5678",      # USD Döviz Alış
                "TP_DK_USD_S": "34.6789",      # USD Döviz Satış
                "TP_DK_EUR_A": "37.1234",      # EUR Döviz Alış
                "TP_DK_EUR_S": "37.2345"       # EUR Döviz Satış
                ...
            }
        ]
    }
    
    Seri Kodları (EVDS Standart):
    - TP.DK.{CURRENCY}.A: Döviz Alış (Forex Buying)
    - TP.DK.{CURRENCY}.S: Döviz Satış (Forex Selling)
    - TP.DK.{CURRENCY}.A.YTL: Efektif Alış (Banknote Buying)
    - TP.DK.{CURRENCY}.S.YTL: Efektif Satış (Banknote Selling)
    """
    
    BASE_URL = "https://evds2.tcmb.gov.tr/service/evds"
    TIMEOUT = 20  # seconds (EVDS bazen yavaş olabiliyor)
    
    # EVDS Resmi Seri Kodları (Güncel Döviz Kurları)
    # Kaynak: TCMB EVDS - Döviz Kurları Grubu
    SERIES_CODES = {
        "USD": {
            "doviz_alis": "TP.DK.USD.A",           # Döviz Alış
            "doviz_satis": "TP.DK.USD.S",          # Döviz Satış
            "efektif_alis": "TP.DK.USD.A.YTL",     # Efektif Alış (Banknot)
            "efektif_satis": "TP.DK.USD.S.YTL"     # Efektif Satış (Banknot)
        },
        "EUR": {
            "doviz_alis": "TP.DK.EUR.A",
            "doviz_satis": "TP.DK.EUR.S",
            "efektif_alis": "TP.DK.EUR.A.YTL",
            "efektif_satis": "TP.DK.EUR.S.YTL"
        },
        "GBP": {
            "doviz_alis": "TP.DK.GBP.A",
            "doviz_satis": "TP.DK.GBP.S",
            "efektif_alis": "TP.DK.GBP.A.YTL",
            "efektif_satis": "TP.DK.GBP.S.YTL"
        },
        "CHF": {
            "doviz_alis": "TP.DK.CHF.A",
            "doviz_satis": "TP.DK.CHF.S",
            "efektif_alis": "TP.DK.CHF.A.YTL",
            "efektif_satis": "TP.DK.CHF.S.YTL"
        },
        "JPY": {
            "doviz_alis": "TP.DK.JPY.A",
            "doviz_satis": "TP.DK.JPY.S",
            "efektif_alis": "TP.DK.JPY.A.YTL",
            "efektif_satis": "TP.DK.JPY.S.YTL"
        }
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        EVDS Client initialization
        
        Args:
            api_key: EVDS API key (None ise .env'den EVDS_API_KEY kullanılır)
        
        Raises:
            ValueError: API key bulunamazsa
        """
        self.api_key = api_key or os.getenv("EVDS_API_KEY")
        if not self.api_key:
            raise ValueError(
                "EVDS_API_KEY gerekli!\n"
                "1. https://evds2.tcmb.gov.tr/ adresinden ücretsiz kayıt\n"
                "2. API Key al\n"
                "3. .env dosyasına ekle: EVDS_API_KEY=your_key_here"
            )
        
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Aliaport/3.1 (Liman Yönetim Sistemi) - EVDS API Client",
            "Accept": "application/json",
            "Accept-Language": "tr-TR"
        })
        
        logger.info("✅ EVDS Client initialized (API Key: %s...)", self.api_key[:8])
    
    def get_daily_rates(
        self, 
        target_date: Optional[date] = None,
        currencies: Optional[List[str]] = None,
        auto_fallback: bool = True
    ) -> List[Dict]:
        """
        Günlük döviz kurlarını EVDS API'den çek
        
        EVDS Batch Request kullanarak tek sorguda tüm kurları alır (performans optimizasyonu)
        EVDS hafta sonu/tatil için son yayınlanan kuru otomatik bulur (max 10 gün geriye)
        
        Args:
            target_date: Hangi tarih için kur? (None = bugün)
            currencies: Hangi dövizler? (None = hepsi: USD, EUR, GBP, CHF, JPY)
            auto_fallback: Tatil günleri için otomatik geriye gitsin mi? (True)
        
        Returns:
            List[Dict]: Kur listesi
            [
                {
                    "doviz_kodu": "USD",
                    "alis": 34.5678,
                    "satis": 34.6789,
                    "efektif_alis": 34.5000,
                    "efektif_satis": 34.7000,
                    "tarih": "2025-11-22"  # Son yayınlanan tarih
                },
                ...
            ]
        
        Raises:
            EVDSAPIError: API çağrısı başarısız olursa
        """
        target_date = target_date or date.today()
        currencies = currencies or list(self.SERIES_CODES.keys())
        
        # Hafta sonu/tatil kontrolü: Son yayınlanan kuru bul
        if auto_fallback:
            actual_date = self._find_last_published_date(target_date)
            if actual_date != target_date:
                logger.info(f"📅 {target_date} tatil/hafta sonu - son yayın: {actual_date}")
            target_date = actual_date
        
        try:
            logger.info(f"📡 EVDS API çağrısı: {target_date} - {currencies}")
            
            # Batch request: Tüm serileri tek sorguda çek
            all_series = []
            for currency in currencies:
                if currency not in self.SERIES_CODES:
                    logger.warning(f"⚠️  {currency} için EVDS seri kodu tanımlı değil, atlandı")
                    continue
                
                series = self.SERIES_CODES[currency]
                all_series.extend([
                    series["doviz_alis"],
                    series["doviz_satis"],
                    series["efektif_alis"],
                    series["efektif_satis"]
                ])
            
            if not all_series:
                raise EVDSAPIError("Hiçbir geçerli döviz kodu bulunamadı")
            
            # EVDS API Call (Batch)
            data = self._fetch_evds_data(all_series, target_date, target_date)
            
            # Parse response
            rates = self._parse_evds_response(data, currencies, target_date)
            
            logger.info(f"✅ EVDS'den {len(rates)} kur alındı")
            return rates
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ EVDS API network error: {e}")
            raise EVDSAPIError(f"EVDS API network hatası: {str(e)}") from e
        except Exception as e:
            logger.error(f"❌ EVDS API error: {e}", exc_info=True)
            raise EVDSAPIError(f"EVDS API hatası: {str(e)}") from e
    
    def get_historical_rates(
        self,
        start_date: date,
        end_date: date,
        currencies: Optional[List[str]] = None
    ) -> Dict[date, List[Dict]]:
        """
        Tarihsel döviz kurlarını çek (grafik, analiz için)
        
        Args:
            start_date: Başlangıç tarihi
            end_date: Bitiş tarihi
            currencies: Hangi dövizler? (None = USD, EUR, GBP)
        
        Returns:
            Dict[date, List[Dict]]: Tarihe göre gruplandırılmış kurlar
            {
                date(2025, 11, 24): [
                    {"doviz_kodu": "USD", "alis": 34.56, ...},
                    {"doviz_kodu": "EUR", "alis": 37.12, ...}
                ],
                ...
            }
        """
        currencies = currencies or ["USD", "EUR", "GBP"]
        
        # EVDS max range: 1 yıl (best practice)
        if (end_date - start_date).days > 365:
            logger.warning("⚠️  EVDS API: Maksimum 1 yıllık veri çekiliyor")
            start_date = end_date - timedelta(days=365)
        
        try:
            all_series = []
            for currency in currencies:
                if currency in self.SERIES_CODES:
                    series = self.SERIES_CODES[currency]
                    all_series.extend([
                        series["doviz_alis"],
                        series["doviz_satis"],
                        series["efektif_alis"],
                        series["efektif_satis"]
                    ])
            
            data = self._fetch_evds_data(all_series, start_date, end_date)
            
            # Parse ve tarihe göre grupla
            historical = {}
            for item in data.get("items", []):
                item_date = datetime.strptime(item["Tarih"], "%d-%m-%Y").date()
                rates = self._parse_evds_item(item, currencies)
                historical[item_date] = rates
            
            logger.info(f"✅ EVDS tarihsel veri: {len(historical)} gün, {len(currencies)} döviz")
            return historical
        
        except Exception as e:
            logger.error(f"❌ EVDS historical data error: {e}")
            raise EVDSAPIError(f"EVDS tarihsel veri hatası: {str(e)}") from e
    
    def _fetch_evds_data(
        self,
        series_codes: List[str],
        start_date: date,
        end_date: date
    ) -> Dict:
        """
        EVDS API'ye batch request gönder
        
        Args:
            series_codes: EVDS seri kodları listesi
            start_date: Başlangıç tarihi
            end_date: Bitiş tarihi
        
        Returns:
            Dict: EVDS API response
        
        Raises:
            EVDSAPIError: API hatası
        """
        # EVDS date format: DD-MM-YYYY
        start_str = start_date.strftime("%d-%m-%Y")
        end_str = end_date.strftime("%d-%m-%Y")
        
        # Seri kodlarını birleştir (tire ile)
        series_param = "-".join(series_codes)
        
        # EVDS API URL yapısı:
        # https://evds2.tcmb.gov.tr/service/evds/series=SERIE1-SERIE2&startDate=DD-MM-YYYY&endDate=DD-MM-YYYY&type=json&key=API_KEY
        url = f"{self.BASE_URL}/series={series_param}"
        
        params = {
            "startDate": start_str,
            "endDate": end_str,
            "type": "json",
            "key": self.api_key
        }
        
        logger.debug(f"EVDS Request: {url} (serileri: {len(series_codes)})")
        
        response = self.session.get(url, params=params, timeout=self.TIMEOUT)
        
        # HTTP error check
        if response.status_code != 200:
            error_msg = f"EVDS API HTTP {response.status_code}"
            try:
                error_data = response.json()
                if "message" in error_data:
                    error_msg = f"{error_msg}: {error_data['message']}"
            except:
                error_msg = f"{error_msg}: {response.text[:200]}"
            
            raise EVDSAPIError(error_msg)
        
        data = response.json()
        
        # Response validation
        if "items" not in data:
            raise EVDSAPIError(f"EVDS API geçersiz response: {data}")
        
        if not data["items"]:
            logger.warning(f"⚠️  EVDS'den veri yok: {start_date} - {end_date}")
        
        return data
    
    def _parse_evds_response(
        self,
        data: Dict,
        currencies: List[str],
        target_date: date
    ) -> List[Dict]:
        """
        EVDS API response'u parse et
        
        Args:
            data: EVDS API JSON response
            currencies: Parse edilecek döviz kodları
            target_date: Hedef tarih (validation için)
        
        Returns:
            List[Dict]: Parse edilmiş kur listesi
        """
        if not data.get("items"):
            return []
        
        # İlk (ve muhtemelen tek) item'ı al
        item = data["items"][0]
        
        return self._parse_evds_item(item, currencies)
    
    def _parse_evds_item(self, item: Dict, currencies: List[str]) -> List[Dict]:
        """
        Tek bir EVDS item'ı parse et
        
        Args:
            item: EVDS API item (Tarih + seri değerleri)
            currencies: Parse edilecek döviz kodları
        
        Returns:
            List[Dict]: Kur listesi
        """
        rates = []
        
        for currency_code in currencies:
            if currency_code not in self.SERIES_CODES:
                continue
            
            series = self.SERIES_CODES[currency_code]
            
            try:
                # EVDS JSON key format: "TP.DK.USD.A" -> "TP_DK_USD_A"
                # (noktalar alt çizgiye dönüşüyor)
                def series_to_key(serie: str) -> str:
                    return serie.replace(".", "_")
                
                alis_key = series_to_key(series["doviz_alis"])
                satis_key = series_to_key(series["doviz_satis"])
                efektif_alis_key = series_to_key(series["efektif_alis"])
                efektif_satis_key = series_to_key(series["efektif_satis"])
                
                # Değerleri oku (yoksa None)
                alis = item.get(alis_key)
                satis = item.get(satis_key)
                efektif_alis = item.get(efektif_alis_key)
                efektif_satis = item.get(efektif_satis_key)
                
                # En az bir değer varsa ekle
                if alis or satis:
                    rate = {
                        "doviz_kodu": currency_code,
                        "alis": float(alis) if alis else None,
                        "satis": float(satis) if satis else None,
                        "efektif_alis": float(efektif_alis) if efektif_alis else None,
                        "efektif_satis": float(efektif_satis) if efektif_satis else None,
                        "tarih": item.get("Tarih", "")  # DD-MM-YYYY format
                    }
                    
                    rates.append(rate)
                    logger.debug(
                        f"{currency_code}: Alış={rate['alis']:.4f if rate['alis'] else 'N/A'}, "
                        f"Satış={rate['satis']:.4f if rate['satis'] else 'N/A'}"
                    )
            
            except (ValueError, TypeError) as e:
                logger.warning(f"⚠️  {currency_code} parse hatası: {e}")
                continue
        
        return rates
    
    def _find_last_published_date(self, target_date: date, max_days: int = 10) -> date:
        """
        EVDS'de son yayınlanan kur tarihini bul (hafta sonu/tatil kontrolü)
        
        EVDS hafta sonları ve resmi tatillerde kur yayınlamaz.
        Geriye doğru max_days gün kontrol eder.
        
        Args:
            target_date: Hedef tarih
            max_days: Maksimum kaç gün geriye bakılacak (default: 10)
        
        Returns:
            date: Son yayınlanan kur tarihi
        """
        current_date = target_date
        test_series = [self.SERIES_CODES["USD"]["doviz_alis"]]  # USD test için yeterli
        
        for _ in range(max_days):
            # Cumartesi (5) ve Pazar (6) atla
            if current_date.weekday() >= 5:
                current_date = current_date - timedelta(days=1)
                continue
            
            try:
                # EVDS API'ye sor
                data = self._fetch_evds_data(test_series, current_date, current_date)
                
                if data.get("items") and data["items"]:
                    # Veri var, bu tarih yayınlanmış
                    logger.debug(f"✅ EVDS son yayın tarihi bulundu: {current_date}")
                    return current_date
            
            except Exception as e:
                logger.debug(f"⚠️  {current_date} için EVDS verisi yok: {e}")
            
            # Bir gün geriye git
            current_date = current_date - timedelta(days=1)
        
        # Bulunamadı, hedef tarihi dön
        logger.warning(f"⚠️  {max_days} gün içinde EVDS verisi bulunamadı, {target_date} kullanılıyor")
        return target_date
    
    def test_connection(self) -> bool:
        """
        EVDS API bağlantısını test et
        
        Returns:
            bool: Bağlantı başarılı mı?
        """
        try:
            # Basit bir test query: bugün için USD (auto_fallback ile)
            test_series = [self.SERIES_CODES["USD"]["doviz_alis"]]
            today = date.today()
            actual_date = self._find_last_published_date(today)
            
            data = self._fetch_evds_data(test_series, actual_date, actual_date)
            
            if data.get("items"):
                logger.info(f"✅ EVDS API bağlantı testi başarılı (tarih: {actual_date})")
                return True
            else:
                logger.warning("⚠️  EVDS API bağlantı testi: Veri yok")
                return False
        
        except Exception as e:
            logger.error(f"❌ EVDS API bağlantı testi başarısız: {e}")
            return False


class EVDSAPIError(Exception):
    """EVDS API hatası"""
    pass
