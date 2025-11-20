// Parameters Module Master Data
// SQL Tabloları: parameters_units, parameters_vat_rates, parameters_vat_exemptions,
//                parameters_service_groups, parameters_service_categories

// ============================================
// BİRİMLER (Units)
// ============================================
export interface ParameterUnit {
  id: number;
  code: string;
  name: string;
  symbol: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const parameterUnitsMasterData: ParameterUnit[] = [
  { id: 1, code: "ADET", name: "Adet", symbol: "Ad", is_active: true, display_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 2, code: "GUN", name: "Gün", symbol: "Gn", is_active: true, display_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 3, code: "AY", name: "Ay", symbol: "Ay", is_active: true, display_order: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 4, code: "YIL", name: "Yıl", symbol: "Yıl", is_active: true, display_order: 4, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 5, code: "M", name: "Metre", symbol: "m", is_active: true, display_order: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 6, code: "M2", name: "Metrekare", symbol: "m²", is_active: true, display_order: 6, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 7, code: "M3", name: "Metreküp", symbol: "m³", is_active: true, display_order: 7, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 8, code: "KG", name: "Kilogram", symbol: "kg", is_active: true, display_order: 8, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 9, code: "LT", name: "Litre", symbol: "ℓ", is_active: true, display_order: 9, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 10, code: "SAAT", name: "Saat", symbol: "Sa", is_active: true, display_order: 10, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 11, code: "PAKET", name: "Paket", symbol: "Pkt", is_active: true, display_order: 11, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 12, code: "SET", name: "Set", symbol: "Set", is_active: true, display_order: 12, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 13, code: "TON", name: "Ton", symbol: "t", is_active: true, display_order: 13, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 14, code: "KM", name: "Kilometre", symbol: "km", is_active: false, display_order: 14, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 15, code: "MIL", name: "Deniz Mili", symbol: "nm", is_active: true, display_order: 15, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

// ============================================
// PARA BİRİMLERİ (Currencies)
// ============================================
export interface ParameterCurrency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
  display_order: number;
}

export const currencyMasterData: ParameterCurrency[] = [
  { id: 1, code: "TRY", name: "Türk Lirası", symbol: "₺", is_active: true, display_order: 1 },
  { id: 2, code: "USD", name: "Amerikan Doları", symbol: "$", is_active: true, display_order: 2 },
  { id: 3, code: "EUR", name: "Euro", symbol: "€", is_active: true, display_order: 3 },
  { id: 4, code: "GBP", name: "İngiliz Sterlini", symbol: "£", is_active: true, display_order: 4 },
];

// ============================================
// KDV ORANLARI (VAT Rates)
// ============================================
export interface ParameterVatRate {
  id: number;
  code: string;
  name: string;
  rate: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const parameterVatRatesMasterData: ParameterVatRate[] = [
  { id: 1, code: "KDV20", name: "Standart KDV (%20)", rate: 20.00, is_active: true, display_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 2, code: "KDV10", name: "İndirimli KDV (%10)", rate: 10.00, is_active: true, display_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 3, code: "KDV1", name: "Özel KDV (%1)", rate: 1.00, is_active: true, display_order: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 4, code: "KDV0", name: "Sıfır KDV (%0)", rate: 0.00, is_active: true, display_order: 4, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 5, code: "KDV18", name: "Eski Standart KDV (%18) - PASİF", rate: 18.00, is_active: false, display_order: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

// ============================================
// KDV İSTİSNALARI (VAT Exemptions)
// ============================================
export interface ParameterVatExemption {
  id: number;
  code: string;
  name: string;
  description: string | null;
  force_zero_vat: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const parameterVatExemptionsMasterData: ParameterVatExemption[] = [
  { 
    id: 1, 
    code: "NONE", 
    name: "İstisna Yok", 
    description: "Normal KDV uygulanır", 
    force_zero_vat: false, 
    is_active: true, 
    display_order: 1, 
    created_at: "2024-01-01", 
    updated_at: "2024-01-01" 
  },
  { 
    id: 2, 
    code: "17/4-G", 
    name: "KDVK 17/4-G (İhracat İstisnası)", 
    description: "3065 sayılı KDV Kanunu madde 17/4-g - İhracat teslimleri ve bu teslimlere ilişkin hizmetler", 
    force_zero_vat: true, 
    is_active: true, 
    display_order: 2, 
    created_at: "2024-01-01", 
    updated_at: "2024-01-01" 
  },
  { 
    id: 3, 
    code: "17/4-C", 
    name: "KDVK 17/4-C (Deniz Taşımacılığı)", 
    description: "3065 sayılı KDV Kanunu madde 17/4-c - Deniz, hava ve demiryolu taşıma araçlarının tamir, bakım ve tadili", 
    force_zero_vat: true, 
    is_active: true, 
    display_order: 3, 
    created_at: "2024-01-01", 
    updated_at: "2024-01-01" 
  },
  { 
    id: 4, 
    code: "13/D", 
    name: "KDVK 13/D (Diğer İstisna)", 
    description: "3065 sayılı KDV Kanunu madde 13/d - Diğer istisna durumları", 
    force_zero_vat: true, 
    is_active: true, 
    display_order: 4, 
    created_at: "2024-01-01", 
    updated_at: "2024-01-01" 
  },
  { 
    id: 5, 
    code: "17/4-A", 
    name: "KDVK 17/4-A (Transit Taşıma)", 
    description: "3065 sayılı KDV Kanunu madde 17/4-a - Transit taşıma ve geçici ithalat", 
    force_zero_vat: true, 
    is_active: true, 
    display_order: 5, 
    created_at: "2024-01-01", 
    updated_at: "2024-01-01" 
  },
];

// ============================================
// HİZMET GRUPLARI (Service Groups)
// ============================================
export interface ParameterServiceGroup {
  id: number;
  code: string;
  name: string;
  description: string | null;
  parent_group_id: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const parameterServiceGroupsMasterData: ParameterServiceGroup[] = [
  { id: 1, code: "BARINMA", name: "Barınma Hizmetleri", description: "Tekne barınma ve liman hizmetleri", parent_group_id: null, is_active: true, display_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 2, code: "ENERJI", name: "Enerji & İkmal", description: "Elektrik, su, yakıt ikmal hizmetleri", parent_group_id: null, is_active: true, display_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 3, code: "BAKIM", name: "Bakım & Onarım", description: "Tekne bakım, onarım ve işçilik hizmetleri", parent_group_id: null, is_active: true, display_order: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 4, code: "TERSANE", name: "Tersane Hizmetleri", description: "Kaldırma, indirme, depolama hizmetleri", parent_group_id: null, is_active: true, display_order: 4, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 5, code: "SEFER", name: "Sefer Hizmetleri", description: "Motorbot sefer operasyonları", parent_group_id: null, is_active: true, display_order: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 6, code: "DANISMANLIK", name: "Danışmanlık & Broker", description: "Teknik danışmanlık ve broker hizmetleri", parent_group_id: null, is_active: false, display_order: 6, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

// ============================================
// HİZMET KATEGORİLERİ (Service Categories)
// ============================================
export interface ParameterServiceCategory {
  id: number;
  code: string;
  name: string;
  group_id: number;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const parameterServiceCategoriesMasterData: ParameterServiceCategory[] = [
  // BARINMA kategorileri
  { id: 1, code: "MB-YILLIK", name: "Motorbot Yıllık Barınma", group_id: 1, description: "Motorbot için yıllık dönem barınma", is_active: true, display_order: 1, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 2, code: "MB-AYLIK", name: "Motorbot Aylık Barınma", group_id: 1, description: "Motorbot için aylık dönem barınma", is_active: true, display_order: 2, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 3, code: "MB-GUNLUK", name: "Motorbot Günlük Barınma (Misafir)", group_id: 1, description: "Günlük misafir tekne barınması", is_active: true, display_order: 3, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 4, code: "YL-YILLIK", name: "Yelkenli Yıllık Barınma", group_id: 1, description: "Yelkenli tekne yıllık barınma", is_active: true, display_order: 4, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 5, code: "YL-AYLIK", name: "Yelkenli Aylık Barınma", group_id: 1, description: "Yelkenli tekne aylık barınma", is_active: true, display_order: 5, created_at: "2024-01-01", updated_at: "2024-01-01" },
  
  // ENERJİ kategorileri
  { id: 6, code: "ELEKTRIK", name: "Elektrik Hizmeti", group_id: 2, description: "Tekne başı elektrik kullanımı", is_active: true, display_order: 6, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 7, code: "SU", name: "Su İkmal Hizmeti", group_id: 2, description: "Tekne su ikmal hizmeti", is_active: true, display_order: 7, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 8, code: "YAKIT", name: "Yakıt İkmal Hizmeti", group_id: 2, description: "Motorin/Benzin ikmal", is_active: true, display_order: 8, created_at: "2024-01-01", updated_at: "2024-01-01" },
  
  // BAKIM kategorileri
  { id: 9, code: "BAKIM-GENEL", name: "Genel Bakım & Onarım", group_id: 3, description: "Rutin bakım ve onarım işleri", is_active: true, display_order: 9, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 10, code: "BAKIM-MOTOR", name: "Motor Bakım", group_id: 3, description: "Motor bakım ve onarım", is_active: true, display_order: 10, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 11, code: "BAKIM-BOYA", name: "Boya & Cila", group_id: 3, description: "Tekne boya ve cila işleri", is_active: true, display_order: 11, created_at: "2024-01-01", updated_at: "2024-01-01" },
  
  // TERSANE kategorileri
  { id: 12, code: "KALDIRMA", name: "Kaldırma & İndirme (Haul-out)", group_id: 4, description: "Tekne kaldırma ve indirme", is_active: true, display_order: 12, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 13, code: "DEPOLAMA", name: "Kara Depolama", group_id: 4, description: "Tekne kara depolama (sezonluk)", is_active: true, display_order: 13, created_at: "2024-01-01", updated_at: "2024-01-01" },
  
  // SEFER kategorileri
  { id: 14, code: "SEFER-YOLCU", name: "Yolcu Sefer", group_id: 5, description: "Motorbot yolcu taşıma seferi", is_active: true, display_order: 14, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 15, code: "SEFER-YUK", name: "Yük Sefer", group_id: 5, description: "Motorbot yük taşıma seferi", is_active: true, display_order: 15, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

// ============================================
// FİYATLANDIRMA KURALLARI (Pricing Rules)
// ============================================
export interface ParameterPricingRule {
  id: number;
  code: string;
  name: string;
  description: string | null;
  min_quantity: number; // Minimum miktar (paket için)
  calculation_type: "STANDARD" | "PACKAGE_EXCESS"; // STANDARD: Normal hesaplama, PACKAGE_EXCESS: Paket + Aşan
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const parameterPricingRulesMasterData: ParameterPricingRule[] = [
  {
    id: 1,
    code: "STD-1",
    name: "Standart (1 Birim)",
    description: "Normal fiyatlandırma - Her birim için aynı fiyat (Örn: Elektrik 15 TRY/saat → 3.5 saat = 52.50 TRY)",
    min_quantity: 1,
    calculation_type: "STANDARD",
    is_active: true,
    display_order: 1,
    created_at: "2024-01-01",
    updated_at: "2024-01-01"
  },
  {
    id: 2,
    code: "PKG-4H",
    name: "Paket (4 Saat Minimum)",
    description: "İlk 4 saat paket fiyat, aşan kısım birim fiyat (Örn: 4 saat = 150 USD, 4.5 saat = 150 + 0.5×37.50 = 168.75 USD)",
    min_quantity: 4,
    calculation_type: "PACKAGE_EXCESS",
    is_active: true,
    display_order: 2,
    created_at: "2024-01-01",
    updated_at: "2024-01-01"
  },
  {
    id: 3,
    code: "PKG-8H",
    name: "Paket (8 Saat Minimum)",
    description: "İlk 8 saat paket fiyat, aşan kısım birim fiyat",
    min_quantity: 8,
    calculation_type: "PACKAGE_EXCESS",
    is_active: true,
    display_order: 3,
    created_at: "2024-01-01",
    updated_at: "2024-01-01"
  },
  {
    id: 4,
    code: "PKG-1DAY",
    name: "Paket (1 Gün Minimum)",
    description: "İlk 1 gün paket fiyat, aşan kısım birim fiyat",
    min_quantity: 1,
    calculation_type: "PACKAGE_EXCESS",
    is_active: true,
    display_order: 4,
    created_at: "2024-01-01",
    updated_at: "2024-01-01"
  },
  {
    id: 5,
    code: "PKG-7DAY",
    name: "Paket (7 Gün/Haftalık Minimum)",
    description: "İlk 7 gün paket fiyat, aşan kısım birim fiyat",
    min_quantity: 7,
    calculation_type: "PACKAGE_EXCESS",
    is_active: true,
    display_order: 5,
    created_at: "2024-01-01",
    updated_at: "2024-01-01"
  },
];