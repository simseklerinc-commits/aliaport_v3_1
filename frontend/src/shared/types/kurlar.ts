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
  Rate: number; // Alış kuru (serialized as number from backend)
  SellRate?: number; // Satış kuru (serialized as number from backend)
  RateDate: string; // ISO8601 date string (YYYY-MM-DD)
  Source?: string; // Kur kaynağı (TCMB, EVDS, vb.)
  CreatedAt: string; // ISO8601 datetime
}

/**
 * ExchangeRate oluşturma payload
 */
export interface CreateExchangeRatePayload {
  CurrencyFrom: string;
  CurrencyTo: string;
  Rate: number;
  SellRate?: number;
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
  RateDate?: string; // ISO8601 date string
  Source?: string;
}

/**
 * TCMB fetch request payload
 */
export interface FetchTCMBRequest {
  date?: string; // YYYY-MM-DD formatında tarih (opsiyonel)
}

/**
 * Bulk exchange rate creation payload
 */
export interface BulkExchangeRateRequest {
  rates: CreateExchangeRatePayload[];
}
