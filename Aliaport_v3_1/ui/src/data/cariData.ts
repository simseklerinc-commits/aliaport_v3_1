// SQL tmm_cari tablosuna uygun cari master data
// YENİ YAPIDA: E-Fatura uyumlu, duplicate'ler temizlenmiş
// GÜNCELLEME: 19 Kasım 2024 - E-Fatura entegrasyonu için revize edildi

// ===== YENİ CARİ KART INTERFACE =====
export interface CariKart {
  // TEMEL BİLGİLER
  Id: number;
  Code: string;                      // Cari kodu
  Name: string;                      // Ünvan/Ad Soyad
  Active: boolean;
  AccountType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';  // YENİ! Müşteri/Tedarikçi/Her İkisi
  
  // VERGİ KİMLİK (Düzenlenmiş)
  TaxIdType: 'VKN' | 'TCKN';        // YENİ! Kimlik tipi
  TaxId: string;                     // YENİ! VKN veya TCKN (10 veya 11 haneli)
  TaxOffice?: string;                // Vergi dairesi (eski: VergiDairesi)
  
  // TİCARİ KİMLİK (YENİ!)
  MersisNo?: string;                 // 16 haneli Mersis no
  TradeRegistryNo?: string;          // Ticaret sicil no
  KepAddress?: string;               // KEP adresi
  
  // ADRES BİLGİLERİ (Düzenlenmiş)
  Address: string;                   // Açık adres (eski duplicate: Adres silindi)
  Neighborhood?: string;             // YENİ! Mahalle/Köy
  District?: string;                 // İlçe (eski: Town → rename)
  City: string;                      // İl
  PostalCode?: string;               // YENİ! Posta kodu (5 haneli)
  CountryCode: string;               // YENİ! ISO ülke kodu (TR, US, GB)
  
  // DETAYLI ADRES (İYİLEŞTİRME)
  Street?: string;                   // YENİ! Cadde/Sokak
  BuildingNo?: string;               // YENİ! Bina numarası
  BuildingName?: string;             // YENİ! Bina adı
  DoorNo?: string;                   // YENİ! Kapı no/Daire
  
  // İLETİŞİM (Düzenlenmiş)
  Phone?: string;                    // Telefon (eski: Tel1 → rename, duplicate Tel silindi)
  PhoneAlt?: string;                 // Alternatif telefon (eski: Tel2 → rename)
  Mobile?: string;                   // YENİ! Cep telefonu
  Email?: string;                    // E-posta
  Fax?: string;                      // YENİ! Faks
  Website?: string;                  // YENİ! Web sitesi
  
  // İRTİBAT KİŞİSİ (YENİ!)
  ContactPerson?: string;            // İrtibat kişisi adı
  ContactTitle?: string;             // İrtibat kişisi unvanı
  ContactEmail?: string;             // İrtibat kişisi e-posta
  ContactPhone?: string;             // İrtibat kişisi telefon
  
  // E-FATURA ÖZELLİKLERİ (YENİ - KRİTİK!)
  IsEInvoiceCustomer: boolean;       // E-Fatura mükellefi mi?
  EInvoiceType?: 'GB' | 'PK' | 'OK'; // GB: GİB, PK: Özel Entegratör, OK: Özel Kullanıcı
  EInvoiceAlias?: string;            // E-Fatura etiketi/alias
  AcceptsEArchive: boolean;          // E-Arşiv fatura kabul eder mi?
  SendMethod: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';  // Varsayılan gönderim yöntemi
  EInvoiceScenario?: 'TICARIFATURA' | 'TEMELFATURA' | 'YOLCUBERABERFATURA';
  
  // FİNANSAL (Düzenlenmiş)
  Currency: string;                  // Para birimi (eski duplicate: Para silindi)
  PaymentTermDays: number;           // Ödeme vadesi gün (eski duplicate: OdemeVadesiGun silindi)
  RiskLimit?: number;                // Risk limiti
  RiskCurrency?: string;             // Risk para birimi
  IBAN?: string;                     // IBAN
  DefaultPriceListId?: number;       // YENİ! Varsayılan fiyat listesi
  
  // MUHASEBE
  GlCode?: string;                   // Muhasebe hesap kodu
  SalesPersonId?: number;            // YENİ! Satış temsilcisi
  
  // NOTLAR VE METADATA
  Notes?: string;                    // YENİ! Genel notlar
  
  // SİSTEM
  CreatedAt: string;
  UpdatedAt?: string;
  CreatedBy?: number;                // YENİ! Oluşturan kullanıcı
  UpdatedBy?: number;                // YENİ! Güncelleyen kullanıcı
}

// ===== HELPER FONKSIYONLAR =====

/**
 * Eski cari data formatından yeni formata migration
 */
export function migrateLegacyCariData(oldData: any): CariKart {
  // VKN/TCKN ayrıştırma
  const taxIdValue = oldData.VknTckn || oldData.Vkn || oldData.Tckn || '';
  const taxIdType: 'VKN' | 'TCKN' = taxIdValue.length === 10 ? 'VKN' : 'TCKN';
  
  // Ülke kodu mapping
  const countryCodeMap: { [key: string]: string } = {
    'Türkiye': 'TR',
    'Turkey': 'TR',
    'ABD': 'US',
    'USA': 'US',
    'İngiltere': 'GB',
    'UK': 'GB',
    'Almanya': 'DE',
    'Fransa': 'FR',
    'İtalya': 'IT',
    'Yunanistan': 'GR',
  };
  const countryCode = countryCodeMap[oldData.Country] || 'TR';
  
  // Adres parse (basit versiyon)
  const addressParts = parseAddress(oldData.Address || oldData.Adres || '');
  
  return {
    // Temel
    Id: oldData.Id,
    Code: oldData.Code,
    Name: oldData.Name,
    Active: oldData.Active ?? true,
    AccountType: oldData.AccountType || 'CUSTOMER',
    
    // Vergi Kimlik
    TaxIdType: taxIdType,
    TaxId: taxIdValue,
    TaxOffice: oldData.VergiDairesi,
    
    // Ticari Kimlik
    MersisNo: oldData.MersisNo,
    TradeRegistryNo: oldData.TradeRegistryNo,
    KepAddress: oldData.KepAddress,
    
    // Adres
    Address: oldData.Address || oldData.Adres || '',
    Neighborhood: addressParts.neighborhood || oldData.Neighborhood,
    District: oldData.Town || oldData.District,
    City: oldData.City || '',
    PostalCode: oldData.PostalCode,
    CountryCode: countryCode,
    Street: addressParts.street || oldData.Street,
    BuildingNo: addressParts.buildingNo || oldData.BuildingNo,
    BuildingName: oldData.BuildingName,
    DoorNo: addressParts.doorNo || oldData.DoorNo,
    
    // İletişim
    Phone: oldData.Tel1 || oldData.Tel,
    PhoneAlt: oldData.Tel2,
    Mobile: oldData.Mobile,
    Email: oldData.Email,
    Fax: oldData.Fax,
    Website: oldData.Website,
    
    // İrtibat
    ContactPerson: oldData.ContactPerson,
    ContactTitle: oldData.ContactTitle,
    ContactEmail: oldData.ContactEmail,
    ContactPhone: oldData.ContactPhone,
    
    // E-Fatura
    IsEInvoiceCustomer: oldData.IsEInvoiceCustomer ?? false,
    EInvoiceType: oldData.EInvoiceType,
    EInvoiceAlias: oldData.EInvoiceAlias,
    AcceptsEArchive: oldData.AcceptsEArchive ?? true,
    SendMethod: oldData.SendMethod || 'E-ARSIV',
    EInvoiceScenario: oldData.EInvoiceScenario,
    
    // Finansal
    Currency: oldData.Currency || oldData.Para || 'TRY',
    PaymentTermDays: oldData.PaymentTermDays ?? oldData.OdemeVadesiGun ?? 0,
    RiskLimit: oldData.RiskLimit,
    RiskCurrency: oldData.RiskCurrency || oldData.Currency || 'TRY',
    IBAN: oldData.IBAN,
    DefaultPriceListId: oldData.DefaultPriceListId,
    
    // Muhasebe
    GlCode: oldData.GlCode,
    SalesPersonId: oldData.SalesPersonId,
    
    // Notlar
    Notes: oldData.Notes,
    
    // Sistem
    CreatedAt: oldData.CreatedAt,
    UpdatedAt: oldData.UpdatedAt,
    CreatedBy: oldData.CreatedBy,
    UpdatedBy: oldData.UpdatedBy,
  };
}

/**
 * Adres parse fonksiyonu - Türkiye adres formatı için
 */
function parseAddress(address: string): {
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  doorNo?: string;
} {
  if (!address) return {};
  
  const result: any = {};
  
  // Mahalle parse: "ALSANCAK MAH." veya "ALSANCAK MAH Mah."
  const mahMatch = address.match(/([\wğüşıöçĞÜŞİÖÇ\s]+)\s+(MAH\.|Mah\.)/i);
  if (mahMatch) {
    result.neighborhood = mahMatch[1].trim() + ' MAH.';
  }
  
  // Cadde/Sokak parse: "ATATÜRK CAD." veya "1234 SK."
  const cadMatch = address.match(/([\wğüşıöçĞÜŞİÖÇ\s]+)\s+(CAD\.|Cad\.|CADDES İ)/i);
  const skMatch = address.match(/([\d]+)\s+(SK\.|Sk\.)/i);
  if (cadMatch) {
    result.street = cadMatch[1].trim() + ' CAD.';
  } else if (skMatch) {
    result.street = skMatch[1].trim() + ' SK.';
  }
  
  // Bina No parse: "No:378" veya "No: 378"
  const noMatch = address.match(/No:\s*(\d+)/i);
  if (noMatch) {
    result.buildingNo = noMatch[1];
  }
  
  // Daire parse: "Daire:52" veya "Daire: 52"
  const daireMatch = address.match(/Daire:\s*(\d+|[A-Z])/i);
  if (daireMatch) {
    result.doorNo = daireMatch[1];
  }
  
  return result;
}

// ===== MASTER DATA (YENİ FORMAT) =====
export const cariMasterData: CariKart[] = [
  {
    Id: 1,
    Code: "01.001",
    Name: "A-TIM TEKNIK GEMI TAMIR DONATIM VE ULUSLARARASI KUMANYACILIK PAZARLAMA GIDA SANAYİ TİCARET ANONIM ŞİRKETİ",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "VKN",
    TaxId: "0010812829",
    TaxOffice: "KORDON VERGİ DAİRESİ BAŞKANLIĞI",
    
    Address: "ALSANCAK MAH. Mah. ATATÜRK CAD. KAVALALI IS MERKEZI No:378 Daire:52 KONAK/İZMİR",
    Neighborhood: "ALSANCAK MAH.",
    Street: "ATATÜRK CAD.",
    BuildingNo: "378",
    BuildingName: "KAVALALI IS MERKEZI",
    DoorNo: "52",
    District: "KONAK",
    City: "İzmir",
    PostalCode: "35210",
    CountryCode: "TR",
    
    Phone: undefined,
    Email: undefined,
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 30,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 2,
    Code: "01.002",
    Name: "A.RIZA KINAY VAPUR ACENTELIGI VE TİCARET ANONIM ŞİRKETİ",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "VKN",
    TaxId: "0520053140",
    TaxOffice: "BOĞAZİÇİ KURUMLAR VERGİ DAİRESİ BAŞKANLIĞI",
    
    Address: "BAL MUMCU MAH.MORBA Mah. SAN SK.KOZA IS MRK. No:5 Daire:C BEŞİKTAŞ",
    Neighborhood: "BAL MUMCU MAH.",
    Street: "MORBA SAN SK.",
    BuildingNo: "5",
    BuildingName: "KOZA IS MRK.",
    DoorNo: "C",
    District: "BEŞİKTAŞ",
    City: "İstanbul",
    PostalCode: "34357",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 30,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 3,
    Code: "01.003",
    Name: "ADAMAR DIS TİCARET VE DENIZCILIK HIZMETLERI SANAYİ TİCARET ANONIM ŞİRKETİ",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "VKN",
    TaxId: "0071368781",
    TaxOffice: "ALİAĞA VERGİ DAİRESİ",
    
    Address: "ÇORAKLAR MAH. Mah. 5003 SK. No:26 Daire:1 ALİAĞA/İZMİR",
    Neighborhood: "ÇORAKLAR MAH.",
    Street: "5003 SK.",
    BuildingNo: "26",
    DoorNo: "1",
    District: "ALİAĞA",
    City: "İzmir",
    PostalCode: "35800",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 30,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 4,
    Code: "01.004",
    Name: "ADEN ENDÜSTRIYEL IMALAT MONTAJ SANAYİ VE TİCARET ANONIM ŞİRKETİ",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "VKN",
    TaxId: "1020034901",
    TaxOffice: "ÇANKAYA VERGİ DAİRESİ",
    
    Address: "KIZILIRMAK MAH. Mah. DUMLUPINAR BLV. NEXTLEVEL No:3 A Daire:10 ÇANKAYA",
    Neighborhood: "KIZILIRMAK MAH.",
    Street: "DUMLUPINAR BLV.",
    BuildingNo: "3",
    BuildingName: "NEXTLEVEL",
    DoorNo: "10",
    District: "ÇANKAYA",
    City: "Ankara",
    PostalCode: "06510",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 30,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 5,
    Code: "01.005",
    Name: "AK GEMI TASIMACILIGI SANAYİ VE TİCARET ANONIM ŞİRKETİ",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "VKN",
    TaxId: "0130035430",
    TaxOffice: "ANADOLU KURUMLAR VERGİ DAİRESİ BAŞKANLIĞI",
    
    Address: "KISIKLI MAH. Mah. ALEMDAG CAD. AKAR GROUP No:19 Daire: ÜSKÜDAR",
    Neighborhood: "KISIKLI MAH.",
    Street: "ALEMDAG CAD.",
    BuildingNo: "19",
    BuildingName: "AKAR GROUP",
    District: "ÜSKÜDAR",
    City: "İstanbul",
    PostalCode: "34692",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 30,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 100,
    Code: "01.100",
    Name: "NIHAL AKILLI",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "19508756708",
    TaxOffice: "ALİAĞA VERGİ DAİRESİ",
    
    Address: "SAMURLU MAH. Mah. 1248 SK. No:16 A Daire:1 ALİAĞA/İZMİR",
    Neighborhood: "SAMURLU MAH.",
    Street: "1248 SK.",
    BuildingNo: "16",
    DoorNo: "1",
    District: "ALİAĞA",
    City: "İzmir",
    PostalCode: "35800",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 124,
    Code: "01.124",
    Name: "OKAN AGIR",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "52897184936",
    TaxOffice: "ALİAĞA VERGİ DAİRESİ",
    
    Address: "SAMURLU MAH. Mah. 1244 SK. No:18 H Daire: ALİAĞA/İZMİR",
    Neighborhood: "SAMURLU MAH.",
    Street: "1244 SK.",
    BuildingNo: "18",
    DoorNo: "H",
    District: "ALİAĞA",
    City: "İzmir",
    PostalCode: "35800",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 148,
    Code: "01.148",
    Name: "ÖMÜR GÜMUSSOY",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "4250104898",
    TaxOffice: "KONAK VERGİ DAİRESİ",
    
    Address: "PIRI REIS MAH. Mah. 200 SK. No:181 Daire: KONAK/İZMİR",
    Neighborhood: "PIRI REIS MAH.",
    Street: "200 SK.",
    BuildingNo: "181",
    District: "KONAK",
    City: "İzmir",
    PostalCode: "35210",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 154,
    Code: "01.154",
    Name: "MEHMET AKARSU",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "33653034580",
    TaxOffice: "NAZİLLİ VERGİ DAİRESİ",
    
    Address: "",
    District: undefined,
    City: "Aydın",
    PostalCode: "09800",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 157,
    Code: "01.157",
    Name: "MURAT TURUNÇEL",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "11528535820",
    TaxOffice: "ALİAĞA VERGİ DAİRESİ",
    
    Address: "KÜLTÜR MAH. Mah. 214 SK. No: Daire:8 Aliağa",
    Neighborhood: "KÜLTÜR MAH.",
    Street: "214 SK.",
    DoorNo: "8",
    District: "ALİAĞA",
    City: "İzmir",
    PostalCode: "35800",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 161,
    Code: "01.161",
    Name: "ÖMÜR GÜMÜŞSOY",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "15802737542",
    TaxOffice: "KONAK VERGİ DAİRESİ",
    
    Address: "PIRI REIS MAH. Mah. 200 SK. No:181 Daire: KONAK/İZMİR",
    Neighborhood: "PIRI REIS MAH.",
    Street: "200 SK.",
    BuildingNo: "181",
    District: "KONAK",
    City: "İzmir",
    PostalCode: "35210",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 206,
    Code: "01.206",
    Name: "FIGEN GÜNES",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "24473130712",
    TaxOffice: "ÇİĞLİ VERGİ DAİRESİ",
    
    Address: "NERGIZ MAH. Mah. 2004 SK. No:28 A Daire: KARŞIYAKA/İZMİR",
    Neighborhood: "NERGIZ MAH.",
    Street: "2004 SK.",
    BuildingNo: "28",
    DoorNo: "A",
    District: "KARŞIYAKA",
    City: "İzmir",
    PostalCode: "35550",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
  {
    Id: 232,
    Code: "01.232",
    Name: "YILDIRAY ÖZASIL",
    Active: true,
    AccountType: "CUSTOMER",
    
    TaxIdType: "TCKN",
    TaxId: "16097677902",
    TaxOffice: "BALÇOVA VERGİ DAİRESİ",
    
    Address: "SITELER MAH Mah. 237 SK No:28 Daire: GÜZELBAHÇE/İZMİR",
    Neighborhood: "SITELER MAH.",
    Street: "237 SK.",
    BuildingNo: "28",
    District: "GÜZELBAHÇE",
    City: "İzmir",
    PostalCode: "35310",
    CountryCode: "TR",
    
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
    
    CreatedAt: "2024-01-01T00:00:00",
  },
];

// ===== HELPER FONKSIYONLAR (EXPORT) =====

export const getCariByCode = (code: string): CariKart | undefined => {
  return cariMasterData.find(c => c.Code === code);
};

export const getCariById = (id: number): CariKart | undefined => {
  return cariMasterData.find(c => c.Id === id);
};

export const searchCari = (searchTerm: string): CariKart[] => {
  const term = searchTerm.toLowerCase();
  return cariMasterData.filter(c => 
    c.Code.toLowerCase().includes(term) ||
    c.Name.toLowerCase().includes(term) ||
    (c.TaxId && c.TaxId.includes(term)) ||
    (c.City && c.City.toLowerCase().includes(term))
  );
};

export const getActiveCari = (): CariKart[] => {
  return cariMasterData.filter(c => c.Active);
};

export const getEInvoiceCustomers = (): CariKart[] => {
  return cariMasterData.filter(c => c.IsEInvoiceCustomer);
};

export const getEArchiveCustomers = (): CariKart[] => {
  return cariMasterData.filter(c => c.AcceptsEArchive && !c.IsEInvoiceCustomer);
};

// İstatistik fonksiyonu
export const getCariStats = () => {
  const total = cariMasterData.length;
  const active = cariMasterData.filter(c => c.Active).length;
  const eInvoice = cariMasterData.filter(c => c.IsEInvoiceCustomer).length;
  const eArchive = cariMasterData.filter(c => c.AcceptsEArchive && !c.IsEInvoiceCustomer).length;
  const corporate = cariMasterData.filter(c => c.TaxIdType === 'VKN').length;
  const individual = cariMasterData.filter(c => c.TaxIdType === 'TCKN').length;
  
  return {
    total,
    active,
    passive: total - active,
    eInvoice,
    eArchive,
    paper: total - eInvoice - eArchive,
    corporate,
    individual,
  };
};
