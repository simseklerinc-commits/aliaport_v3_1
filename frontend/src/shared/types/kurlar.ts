/**
 * Kurlar (Exchange Rates) Type Definitions
 * Backend source: aliaport_api/modules/kurlar/schemas.py
 */

/**
 * ExchangeRate (Döviz Kuru) entity
 */
export interface ExchangeRate {
  Id: number;
  CurrencyFrom: string; // Para birimi kaynak (ör: USD, EUR)
  CurrencyTo: string; // Para birimi hedef (ör: TRY)
  Rate: number; // Döviz Alış Kuru (Forex Buying)
  SellRate?: number; // Döviz Satış Kuru (Forex Selling)
  BanknoteBuyingRate?: number; // Efektif Alış Kuru (Banknote Buying)
  BanknoteSellRate?: number; // Efektif Satış Kuru (Banknote Selling)
  RateDate: string; // ISO8601 date string (YYYY-MM-DD)
  Source?: string; // Kur kaynağı (EVDS, TCMB, MANUEL)
  CreatedAt: string; // ISO8601 datetime
  UpdatedAt?: string; // ISO8601 datetime - Son güncelleme zamanı
}

/**
 * ExchangeRate oluşturma payload
 */
export interface CreateExchangeRatePayload {
  CurrencyFrom: string;
  CurrencyTo: string;
  Rate: number;
  SellRate?: number;
  BanknoteBuyingRate?: number;
  BanknoteSellRate?: number;
  RateDate: string; // ISO8601 date string (YYYY-MM-DD)
  Source?: string;
}

/**
 * ExchangeRate güncelleme payload (partial)
 */
export interface UpdateExchangeRatePayload {
  CurrencyFrom?: string;
  CurrencyTo?: string;
  Rate?: number;
  SellRate?: number;
  BanknoteBuyingRate?: number;
  BanknoteSellRate?: number;
  RateDate?: string; // ISO8601 date string
  Source?: string;
}

/**
 * EVDS/TCMB API fetch request payload
 */
export interface FetchAPIRequest {
  date?: string; // YYYY-MM-DD formatında tarih (opsiyonel)
  currencies?: string[]; // Çekilecek dövizler (opsiyonel)
}

/**
 * TCMB fetch request (geriye dönük uyumluluk)
 * @deprecated EVDS artık primary source, FetchAPIRequest kullanın
 */
export interface FetchTCMBRequest extends FetchAPIRequest {}

/**
 * Bulk exchange rate creation payload
 */
export interface BulkExchangeRateRequest {
  rates: CreateExchangeRatePayload[];
}
