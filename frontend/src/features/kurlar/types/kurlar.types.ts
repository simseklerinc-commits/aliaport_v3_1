// Kurlar (Exchange Rate) TypeScript types - Backend schema alignment
// Backend: app/models_kurlar.py, app/schemas_kurlar.py

export interface ExchangeRate {
  Id: number;
  CurrencyFrom: string;  // Required (e.g., 'USD', 'EUR')
  CurrencyTo: string;  // Required (e.g., 'TRY')
  Rate: number;  // Buy Rate (Döviz Alış)
  SellRate?: number;  // Sell Rate (Döviz Satış)
  RateDate: string;  // Required (Date)
  Source?: string;  // 'TCMB', 'EVDS', etc.
  CreatedAt?: string;
}

export interface ExchangeRateCreate {
  CurrencyFrom: string;
  CurrencyTo: string;
  Rate: number;
  SellRate?: number;
  RateDate: string;
  Source?: string;
}

export interface ExchangeRateUpdate {
  Id: number;
  CurrencyFrom?: string;
  CurrencyTo?: string;
  Rate?: number;
  SellRate?: number;
  RateDate?: string;
  Source?: string;
}

export interface PaginatedExchangeRateResponse {
  items: ExchangeRate[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  rate: number;
  converted_amount: number;
  rate_date: string;
}
