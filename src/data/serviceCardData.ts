// Service Card (Hizmet Kartı) Master Data
// SQL Tablo: dbo.service_card
// SON GÜNCELLEME: SQL şemasına tam uyumlu hale getirildi + Fiyatlandırma Kuralı eklendi

export interface ServiceCard {
  id: number;
  code: string;                      // VARCHAR(50) UNIQUE NOT NULL
  name: string;                      // NVARCHAR(200) NOT NULL
  description: string;               // NVARCHAR(500)
  accounting_code: string;           // VARCHAR(50)
  unit_id: number | null;            // FK → parameters.units
  vat_rate_id: number | null;        // FK → parameters.vat_rates
  vat_exemption_id: number;          // FK → parameters.vat_exemptions (default: 1 - İstisna Yok)
  group_id: number | null;           // FK → parameters.service_groups
  category_id: number | null;        // FK → parameters.service_categories
  pricing_rule_id: number | null;    // FK → parameters.pricing_rules
  // NOT: default_unit_price ve currency_code KALDIRILDI - Fiyat bilgisi sadece Tarife Yönetimi'nde!
  is_active: boolean;                // BIT
  metadata_json: string | null;      // NVARCHAR(MAX) - JSON data (tags, custom fields, etc.)
  created_at: string;                // DATETIME
  updated_at: string | null;         // DATETIME
  created_by: number;                // FK → users
  updated_by: number | null;         // FK → users
}

export const serviceCardMasterData: ServiceCard[] = [
  // ===== BARINMA HİZMETLERİ =====
  {
    id: 1,
    code: "MB-BAR-001",
    name: "Motorbot Barınma Hizmeti (Yıllık)",
    description: "Motorbot yıllık barınma hizmeti. Boy bazlı tarife uygulanır.",
    accounting_code: "600.10.001",
    unit_id: 4, // Yıl
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 1, // Barınma Hizmetleri
    category_id: 1, // Yıllık Barınma
    pricing_rule_id: 1, // Standart - Minimum 1 Yıl
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["motorbot", "yıllık", "barınma"],
      service_type: "RECURRING",
      billing_cycle: "ANNUAL",
    }),
    created_at: "2024-01-15T09:00:00",
    updated_at: "2024-11-20T14:30:00",
    created_by: 1,
    updated_by: 1,
  },
  {
    id: 2,
    code: "YL-BAR-001",
    name: "Yelkenli Barınma Hizmeti (Yıllık)",
    description: "Yelkenli yat yıllık barınma hizmeti. Boy bazlı fiyatlandırma.",
    accounting_code: "600.10.002",
    unit_id: 4, // Yıl
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 1, // Barınma Hizmetleri
    category_id: 1, // Yıllık Barınma
    pricing_rule_id: 1, // Standart - Minimum 1 Yıl
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["yelkenli", "yıllık", "barınma"],
      service_type: "RECURRING",
      billing_cycle: "ANNUAL",
    }),
    created_at: "2024-01-15T09:15:00",
    updated_at: "2024-11-20T14:30:00",
    created_by: 1,
    updated_by: 1,
  },
  {
    id: 3,
    code: "MB-BAR-002",
    name: "Motorbot Barınma Hizmeti (Aylık)",
    description: "Motorbot aylık barınma hizmeti. Esnek süre seçenekleri.",
    accounting_code: "600.10.003",
    unit_id: 3, // Ay
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 1, // Barınma Hizmetleri
    category_id: 2, // Aylık Barınma
    pricing_rule_id: 2, // Paket+Aşan - Minimum 3 Ay
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["motorbot", "aylık", "barınma"],
      service_type: "RECURRING",
      billing_cycle: "MONTHLY",
      min_months: 3,
    }),
    created_at: "2024-01-15T09:30:00",
    updated_at: "2024-11-20T14:30:00",
    created_by: 1,
    updated_by: 1,
  },
  {
    id: 4,
    code: "MB-BAR-003",
    name: "Motorbot Barınma Hizmeti (Günlük)",
    description: "Motorbot günlük barınma hizmeti (misafir tekne). Kısa süreli konaklama.",
    accounting_code: "600.10.004",
    unit_id: 2, // Gün
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 1, // Barınma Hizmetleri
    category_id: 3, // Günlük Barınma
    pricing_rule_id: null, // Kural yok - Standart birim x fiyat
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["motorbot", "günlük", "barınma", "misafir"],
      service_type: "ONE_TIME",
      billing_cycle: "DAILY",
    }),
    created_at: "2024-01-15T09:45:00",
    updated_at: null,
    created_by: 1,
    updated_by: null,
  },

  // ===== ENERJİ VE İKMAL HİZMETLERİ =====
  {
    id: 5,
    code: "ELK-001",
    name: "Elektrik Hizmeti",
    description: "Tekne başı elektrik kullanım hizmeti. Saatlik ölçüm.",
    accounting_code: "600.20.001",
    unit_id: 10, // Saat
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 2, // Enerji ve İkmal
    category_id: 4, // Elektrik
    pricing_rule_id: null, // Kural yok
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["elektrik", "enerji"],
      service_type: "METERED",
      unit_of_measure: "kWh",
    }),
    created_at: "2024-01-20T10:00:00",
    updated_at: null,
    created_by: 1,
    updated_by: null,
  },
  {
    id: 6,
    code: "SU-001",
    name: "Su Hizmeti",
    description: "Tekne su ikmal hizmeti. Ton bazında ücretlendirme.",
    accounting_code: "600.20.002",
    unit_id: 13, // Ton
    vat_rate_id: 2, // %10
    vat_exemption_id: 1, // İstisna Yok
    group_id: 2, // Enerji ve İkmal
    category_id: 5, // Su
    pricing_rule_id: null, // Kural yok
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["su", "ikmal"],
      service_type: "METERED",
      unit_of_measure: "ton",
    }),
    created_at: "2024-01-20T10:15:00",
    updated_at: null,
    created_by: 1,
    updated_by: null,
  },
  {
    id: 7,
    code: "YAKIT-001",
    name: "Yakıt İkmal Hizmeti",
    description: "Motorin/benzin ikmal hizmeti. Litre bazlı satış.",
    accounting_code: "600.20.003",
    unit_id: 9, // Litre
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 2, // Enerji ve İkmal
    category_id: 6, // Yakıt
    pricing_rule_id: 3, // Paket+Aşan - Minimum 100 Litre
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["yakıt", "motorin", "ikmal"],
      service_type: "METERED",
      fuel_type: "DIESEL",
      min_order: 100,
    }),
    created_at: "2024-01-20T10:30:00",
    updated_at: "2024-10-15T16:45:00",
    created_by: 1,
    updated_by: 2,
  },

  // ===== BAKIM VE ONARIM HİZMETLERİ =====
  {
    id: 8,
    code: "BAKIM-001",
    name: "Genel Bakım ve Onarım",
    description: "Tekne bakım ve onarım işçilik hizmeti. Saat bazlı ücretlendirme.",
    accounting_code: "600.30.001",
    unit_id: 10, // Saat
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 3, // Bakım ve Onarım
    category_id: 7, // Genel Bakım
    pricing_rule_id: 4, // Paket+Aşan - Minimum 4 Saat
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["bakım", "onarım", "işçilik"],
      service_type: "LABOR",
      min_hours: 4,
    }),
    created_at: "2024-02-01T11:00:00",
    updated_at: null,
    created_by: 1,
    updated_by: null,
  },
  {
    id: 9,
    code: "KALDIRMA-001",
    name: "Kaldırma ve İndirme",
    description: "Tekne kaldırma (haul-out) ve indirme hizmeti. Boy bazlı fiyatlandırma.",
    accounting_code: "600.30.002",
    unit_id: 1, // Adet
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 3, // Bakım ve Onarım
    category_id: 8, // Kaldırma/İndirme
    pricing_rule_id: null, // Kural yok
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["kaldırma", "haul-out", "tersane"],
      service_type: "ONE_TIME",
      includes: ["kaldırma", "indirme", "basınçlı yıkama"],
    }),
    created_at: "2024-02-01T11:15:00",
    updated_at: null,
    created_by: 1,
    updated_by: null,
  },
  {
    id: 10,
    code: "DEPO-001",
    name: "Kara Depolama",
    description: "Tekne kara depolama hizmeti (sezonluk - PASİF). Günlük ücretlendirme.",
    accounting_code: "600.30.003",
    unit_id: 2, // Gün
    vat_rate_id: 1, // %20
    vat_exemption_id: 1, // İstisna Yok
    group_id: 3, // Bakım ve Onarım
    category_id: 9, // Depolama
    pricing_rule_id: 5, // Paket+Aşan - Minimum 30 Gün
    is_active: false, // PASİF
    metadata_json: JSON.stringify({
      tags: ["depolama", "kara", "sezonluk"],
      service_type: "SEASONAL",
      min_days: 30,
      status_reason: "Kış sezonu için kapatıldı",
    }),
    created_at: "2024-02-01T11:30:00",
    updated_at: "2024-09-30T17:00:00",
    created_by: 1,
    updated_by: 2,
  },

  // ===== ÖZEL HİZMETLER =====
  {
    id: 11,
    code: "MB-SEFER-001",
    name: "Motorbot Sefer Hizmeti",
    description: "Motorbot çıkış/dönüş sefer hizmeti. Sefer başına sabit ücretlendirme.",
    accounting_code: "600.40.001",
    unit_id: 1, // Adet
    vat_rate_id: 2, // %18
    vat_exemption_id: 1, // İstisna Yok
    group_id: 4, // Özel Hizmetler
    category_id: 10, // Diğer
    pricing_rule_id: null, // Kural yok - Sefer başına
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["motorbot", "sefer", "çıkış", "dönüş"],
      service_type: "PER_TRIP",
      notes: "Her sefer (çıkış+dönüş) için tek fiyat uygulanır",
    }),
    created_at: "2025-11-01T10:00:00",
    updated_at: null,
    created_by: 1,
    updated_by: null,
  },
  {
    id: 12,
    code: "ISTISNA-TEST",
    name: "KDV İstisna Test Hizmeti",
    description: "KDV istisna testi için örnek hizmet kartı.",
    accounting_code: "600.99.001",
    unit_id: 1, // Adet
    vat_rate_id: 4, // %0 (Otomatik)
    vat_exemption_id: 2, // İhracat İstisnası (force_zero_vat = true)
    group_id: 4, // Özel Hizmetler
    category_id: 10, // Diğer
    pricing_rule_id: null,
    is_active: true,
    metadata_json: JSON.stringify({
      tags: ["test", "istisna", "ihracat"],
      service_type: "SPECIAL",
      notes: "KDV istisna mantığını test etmek için",
    }),
    created_at: "2024-11-01T12:00:00",
    updated_at: null,
    created_by: 1,
    updated_by: null,
  },
];