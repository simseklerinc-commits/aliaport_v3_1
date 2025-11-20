// Price List (Tarife Listesi) Master Data
// SQL Tablolar: dbo.price_list, dbo.price_list_item

export interface PriceList {
  id: number;
  code: string;
  name: string;
  currency: string; // TRY, USD, EUR
  status: 'AKTIF' | 'PASIF' | 'TASLAK';
  valid_from: string; // date
  valid_to: string | null; // date
  is_active: boolean;
  created_at: string;
  // Otomatik seçim için
  period?: 'YIL' | 'AY' | 'GUN'; // Periyot
  length_min?: number; // Minimum metre
  length_max?: number; // Maximum metre
  boat_type?: 'MOTORBOT' | 'YELKEN' | 'GENEL'; // Tekne tipi
}

export interface PriceListItem {
  id: number;
  price_list_id: number;
  service_card_id: number;
  currency: string;
  unit_price: number; // 1 birim için fiyat
  is_active: boolean;
}

export const priceListMasterData: PriceList[] = [
  // ===== AKTİF TARİFE (2025) =====
  {
    id: 1,
    code: "2025-GENEL-TRY",
    name: "2025 Genel Tarife",
    currency: "TRY",
    status: "AKTIF",
    valid_from: "2025-01-01",
    valid_to: "2025-12-31",
    is_active: true,
    created_at: "2024-11-15T10:00:00Z",
  },
  
  // ===== TASLAK TARİFELER =====
  {
    id: 6,
    code: "2026-GENEL-TRY-TASLAK",
    name: "2026 Genel Tarife (Taslak)",
    currency: "TRY",
    status: "TASLAK",
    valid_from: "2026-01-01",
    valid_to: "2026-12-31",
    is_active: false,
    created_at: "2024-11-18T14:30:00Z",
  },
  {
    id: 7,
    code: "2025-OZEL-USD-TASLAK",
    name: "2025 Özel Tarife USD (Taslak)",
    currency: "USD",
    status: "TASLAK",
    valid_from: "2025-06-01",
    valid_to: "2025-12-31",
    is_active: false,
    created_at: "2024-11-17T09:00:00Z",
  },
  
  // ===== PASİF TARİFELER =====
  {
    id: 2,
    code: "2024-GENEL-TRY",
    name: "2024 Genel Tarife",
    currency: "TRY",
    status: "PASIF",
    valid_from: "2024-01-01",
    valid_to: "2024-12-31",
    is_active: false,
    created_at: "2023-11-15T10:00:00Z",
  },
  {
    id: 3,
    code: "2023-GENEL-USD",
    name: "2023 Genel Tarife",
    currency: "USD",
    status: "PASIF",
    valid_from: "2023-01-01",
    valid_to: "2023-12-31",
    is_active: false,
    created_at: "2022-11-15T10:00:00Z",
  },
  {
    id: 4,
    code: "2022-GENEL-EUR",
    name: "2022 Genel Tarife",
    currency: "EUR",
    status: "PASIF",
    valid_from: "2022-01-01",
    valid_to: "2022-12-31",
    is_active: false,
    created_at: "2021-11-15T10:00:00Z",
  },
  {
    id: 5,
    code: "2021-GENEL-TRY",
    name: "2021 Genel Tarife",
    currency: "TRY",
    status: "PASIF",
    valid_from: "2021-01-01",
    valid_to: "2021-12-31",
    is_active: false,
    created_at: "2020-11-15T10:00:00Z",
  },
];

export const priceListItemMasterData: PriceListItem[] = [
  // ===== 2025 Genel Tarife (TRY) - ID: 1 =====
  { id: 1, price_list_id: 1, service_card_id: 1, currency: "TRY", unit_price: 3000, is_active: true }, // MB-BAR-001 Yıllık
  { id: 2, price_list_id: 1, service_card_id: 2, currency: "TRY", unit_price: 3500, is_active: true }, // YL-BAR-001 Yıllık
  { id: 3, price_list_id: 1, service_card_id: 3, currency: "TRY", unit_price: 350, is_active: true }, // MB-BAR-002 Aylık
  { id: 4, price_list_id: 1, service_card_id: 4, currency: "TRY", unit_price: 50, is_active: true }, // MB-BAR-003 Günlük
  { id: 5, price_list_id: 1, service_card_id: 5, currency: "TRY", unit_price: 15, is_active: true }, // ELK-001 Elektrik
  { id: 6, price_list_id: 1, service_card_id: 6, currency: "TRY", unit_price: 800, is_active: true }, // SU-001 Su
  { id: 7, price_list_id: 1, service_card_id: 7, currency: "TRY", unit_price: 45, is_active: true }, // YAKIT-001 Yakıt
  { id: 8, price_list_id: 1, service_card_id: 8, currency: "TRY", unit_price: 250, is_active: true }, // BAKIM-001 Bakım
  { id: 9, price_list_id: 1, service_card_id: 9, currency: "TRY", unit_price: 5000, is_active: true }, // KALDIRMA-001
  { id: 10, price_list_id: 1, service_card_id: 10, currency: "TRY", unit_price: 100, is_active: false }, // DEPO-001 (PASİF)
  { id: 70, price_list_id: 1, service_card_id: 11, currency: "USD", unit_price: 10.00, is_active: true }, // MB-SEFER-001 Motorbot Sefer ($10/sefer)
  
  // ===== 2026 Genel Tarife TASLAK (TRY) - ID: 6 =====
  { id: 50, price_list_id: 6, service_card_id: 1, currency: "TRY", unit_price: 3300, is_active: true },
  { id: 51, price_list_id: 6, service_card_id: 2, currency: "TRY", unit_price: 3850, is_active: true },
  { id: 52, price_list_id: 6, service_card_id: 3, currency: "TRY", unit_price: 385, is_active: true },
  { id: 53, price_list_id: 6, service_card_id: 4, currency: "TRY", unit_price: 55, is_active: true },
  { id: 54, price_list_id: 6, service_card_id: 5, currency: "TRY", unit_price: 16.5, is_active: true },
  { id: 55, price_list_id: 6, service_card_id: 6, currency: "TRY", unit_price: 880, is_active: true },
  { id: 56, price_list_id: 6, service_card_id: 7, currency: "TRY", unit_price: 49.5, is_active: true },
  { id: 57, price_list_id: 6, service_card_id: 8, currency: "TRY", unit_price: 275, is_active: true },
  { id: 58, price_list_id: 6, service_card_id: 9, currency: "TRY", unit_price: 5500, is_active: true },
  { id: 59, price_list_id: 6, service_card_id: 10, currency: "TRY", unit_price: 110, is_active: true },
  
  // ===== 2025 Özel Tarife TASLAK (USD) - ID: 7 =====
  { id: 60, price_list_id: 7, service_card_id: 1, currency: "USD", unit_price: 100, is_active: true },
  { id: 61, price_list_id: 7, service_card_id: 2, currency: "USD", unit_price: 120, is_active: true },
  { id: 62, price_list_id: 7, service_card_id: 3, currency: "USD", unit_price: 12, is_active: true },
  { id: 63, price_list_id: 7, service_card_id: 4, currency: "USD", unit_price: 2, is_active: true },
  { id: 64, price_list_id: 7, service_card_id: 5, currency: "USD", unit_price: 0.5, is_active: true },
  { id: 65, price_list_id: 7, service_card_id: 6, currency: "USD", unit_price: 25, is_active: true },
  { id: 66, price_list_id: 7, service_card_id: 7, currency: "USD", unit_price: 1.5, is_active: true },
  { id: 67, price_list_id: 7, service_card_id: 8, currency: "USD", unit_price: 8, is_active: true },
  { id: 68, price_list_id: 7, service_card_id: 9, currency: "USD", unit_price: 150, is_active: true },
  { id: 69, price_list_id: 7, service_card_id: 10, currency: "USD", unit_price: 3, is_active: true },
  
  // ===== 2024 Genel Tarife (TRY) - ID: 2 =====
  { id: 11, price_list_id: 2, service_card_id: 1, currency: "TRY", unit_price: 2500, is_active: false },
  { id: 12, price_list_id: 2, service_card_id: 2, currency: "TRY", unit_price: 2800, is_active: false },
  { id: 13, price_list_id: 2, service_card_id: 3, currency: "TRY", unit_price: 300, is_active: false },
  { id: 14, price_list_id: 2, service_card_id: 4, currency: "TRY", unit_price: 45, is_active: false },
  { id: 15, price_list_id: 2, service_card_id: 5, currency: "TRY", unit_price: 12, is_active: false },
  
  // ===== 2023 Genel Tarife (USD) - ID: 3 =====
  { id: 16, price_list_id: 3, service_card_id: 1, currency: "USD", unit_price: 120, is_active: false },
  { id: 17, price_list_id: 3, service_card_id: 5, currency: "USD", unit_price: 0.6, is_active: false },
  { id: 18, price_list_id: 3, service_card_id: 6, currency: "USD", unit_price: 30, is_active: false },
  
  // ===== 2022 Genel Tarife (EUR) - ID: 4 =====
  { id: 19, price_list_id: 4, service_card_id: 1, currency: "EUR", unit_price: 150, is_active: false },
  { id: 20, price_list_id: 4, service_card_id: 5, currency: "EUR", unit_price: 0.8, is_active: false },
  
  // ===== 2021 Genel Tarife (TRY) - ID: 5 =====
  { id: 21, price_list_id: 5, service_card_id: 1, currency: "TRY", unit_price: 2000, is_active: false },
  { id: 22, price_list_id: 5, service_card_id: 2, currency: "TRY", unit_price: 2200, is_active: false },
  { id: 23, price_list_id: 5, service_card_id: 3, currency: "TRY", unit_price: 250, is_active: false },
];