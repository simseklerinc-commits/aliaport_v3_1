// MOTORBOT SEFER DATA MODEL
// Motorbotların çıkış/dönüş kayıtları ve faturalandırma takibi

export interface MotorbotSefer {
  // TEMEL BİLGİLER
  Id: number;
  MotorbotId: number;          // Motorbot kartı referansı
  MotorbotCode: string;         // Motorbot kodu (MB-001)
  MotorbotName: string;         // Motorbot adı
  MotorbotOwner?: string;       // Tekne sahibi
  CariCode?: string;            // Cari kodu (CR-001)
  
  // ÇIKIŞ BİLGİLERİ
  DepartureDate: string;        // Çıkış tarihi (ISO: 2024-11-19)
  DepartureTime: string;        // Çıkış saati (HH:mm: 14:30)
  DepartureNote?: string;       // Çıkış açıklaması
  
  // DÖNÜŞ BİLGİLERİ (Opsiyonel - henüz dönmemişse boş)
  ReturnDate?: string;          // Dönüş tarihi (ISO)
  ReturnTime?: string;          // Dönüş saati (HH:mm)
  ReturnNote?: string;          // Dönüş açıklaması
  
  // SÜRE HESAPLAMA
  Duration?: number;            // Sefer süresi (dakika cinsinden)
  Status: 'DEPARTED' | 'RETURNED';  // Durum: Çıkışta / Döndü
  
  // FİYATLANDIRMA
  UnitPrice: number;            // Birim fiyat (Tarife'den: 10 USD)
  Currency: string;             // Para birimi (USD, EUR, TRY)
  VatRate: number;              // KDV oranı (18%)
  VatAmount: number;            // KDV tutarı
  TotalPrice: number;           // KDV dahil toplam
  
  // FATURALANDIRMA TAKİBİ
  IsInvoiced: boolean;          // Faturalandı mı?
  InvoiceId?: number;           // Hangi faturaya eklendi
  InvoiceDate?: string;         // Fatura tarihi
  InvoicePeriod?: string;       // Fatura dönemi (2024-11-14)
  
  // SİSTEM
  CreatedAt: string;            // Kayıt tarihi
  CreatedBy?: number;           // Kaydı yapan kullanıcı
  UpdatedAt?: string;           // Güncelleme tarihi
  UpdatedBy?: number;           // Güncelleyen kullanıcı
}

// SEFER DURUMU
export type SeferStatus = 'DEPARTED' | 'RETURNED';

// FATURA DÖNEMİ
export interface FaturaDonemi {
  Period: string;               // 2024-11-14
  StartDate: string;            // Dönem başlangıcı
  EndDate: string;              // Dönem bitişi
  Day: 7 | 14 | 21 | 28 | 30 | 31;  // Fatura günü
  SeferCount: number;           // Toplam sefer sayısı
  TotalAmount: number;          // Toplam tutar
  IsInvoiced: boolean;          // Faturalandı mı?
}

// ===== HELPER FONKSIYONLAR =====

/**
 * Sefer süresi hesapla (dakika)
 */
export function calculateDuration(
  departureDate: string,
  departureTime: string,
  returnDate?: string,
  returnTime?: string
): number | undefined {
  if (!returnDate || !returnTime) return undefined;
  
  const departure = new Date(`${departureDate}T${departureTime}:00`);
  const returnDT = new Date(`${returnDate}T${returnTime}:00`);
  
  const diffMs = returnDT.getTime() - departure.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return diffMinutes > 0 ? diffMinutes : 0;
}

/**
 * KDV ve toplam fiyat hesapla
 */
export function calculatePricing(unitPrice: number, vatRate: number) {
  const vatAmount = unitPrice * (vatRate / 100);
  const totalPrice = unitPrice + vatAmount;
  
  return {
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
  };
}

/**
 * Bir tarihin hangi fatura dönemine ait olduğunu bul
 */
export function getFaturaDonemi(date: string): { day: number; period: string } {
  const d = new Date(date);
  const day = d.getDate();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  
  let invoiceDay: number;
  
  if (day <= 7) {
    invoiceDay = 7;
  } else if (day <= 14) {
    invoiceDay = 14;
  } else if (day <= 21) {
    invoiceDay = 21;
  } else if (day <= 28) {
    invoiceDay = 28;
  } else {
    // Son gün (30 veya 31)
    const lastDay = new Date(year, month, 0).getDate();
    invoiceDay = lastDay;
  }
  
  const periodStr = `${year}-${String(month).padStart(2, '0')}-${String(invoiceDay).padStart(2, '0')}`;
  
  return { day: invoiceDay, period: periodStr };
}

/**
 * Tarih aralığındaki seferleri filtrele
 */
export function filterSefersByDateRange(
  seferler: MotorbotSefer[],
  startDate: string,
  endDate: string
): MotorbotSefer[] {
  return seferler.filter((sefer) => {
    const seferDate = sefer.DepartureDate;
    return seferDate >= startDate && seferDate <= endDate;
  });
}

/**
 * Faturalanmamış seferleri getir
 */
export function getUninvoicedSefers(seferler: MotorbotSefer[]): MotorbotSefer[] {
  return seferler.filter((sefer) => !sefer.IsInvoiced && sefer.Status === 'RETURNED');
}

/**
 * Motorbota göre seferleri grupla
 */
export function groupSefersByMotorbot(seferler: MotorbotSefer[]): { [motorbotId: number]: MotorbotSefer[] } {
  return seferler.reduce((acc, sefer) => {
    if (!acc[sefer.MotorbotId]) {
      acc[sefer.MotorbotId] = [];
    }
    acc[sefer.MotorbotId].push(sefer);
    return acc;
  }, {} as { [motorbotId: number]: MotorbotSefer[] });
}

/**
 * Fatura dönemine göre seferleri grupla
 */
export function groupSefersByPeriod(seferler: MotorbotSefer[]): { [period: string]: MotorbotSefer[] } {
  return seferler.reduce((acc, sefer) => {
    const { period } = getFaturaDonemi(sefer.DepartureDate);
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(sefer);
    return acc;
  }, {} as { [period: string]: MotorbotSefer[] });
}

/**
 * Dönem için özet bilgi
 */
export function getPeriodSummary(period: string, seferler: MotorbotSefer[]): FaturaDonemi {
  const periodSefers = seferler.filter((s) => getFaturaDonemi(s.DepartureDate).period === period);
  
  const totalAmount = periodSefers.reduce((sum, sefer) => sum + sefer.TotalPrice, 0);
  const isInvoiced = periodSefers.length > 0 && periodSefers.every((s) => s.IsInvoiced);
  
  // Dönem aralığını hesapla
  const [year, month, day] = period.split('-').map(Number);
  let startDay = 1;
  
  if (day === 7) startDay = 1;
  else if (day === 14) startDay = 8;
  else if (day === 21) startDay = 15;
  else if (day === 28) startDay = 22;
  else startDay = 29;
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endDate = period;
  
  return {
    Period: period,
    StartDate: startDate,
    EndDate: endDate,
    Day: day as any,
    SeferCount: periodSefers.length,
    TotalAmount: parseFloat(totalAmount.toFixed(2)),
    IsInvoiced: isInvoiced,
  };
}

/**
 * Sefer özeti istatistikleri
 */
export function getSeferStats(seferler: MotorbotSefer[]) {
  const total = seferler.length;
  const departed = seferler.filter((s) => s.Status === 'DEPARTED').length;
  const returned = seferler.filter((s) => s.Status === 'RETURNED').length;
  const invoiced = seferler.filter((s) => s.IsInvoiced).length;
  const uninvoiced = seferler.filter((s) => !s.IsInvoiced && s.Status === 'RETURNED').length;
  
  const totalRevenue = seferler
    .filter((s) => s.IsInvoiced)
    .reduce((sum, sefer) => sum + sefer.TotalPrice, 0);
  
  const pendingRevenue = seferler
    .filter((s) => !s.IsInvoiced && s.Status === 'RETURNED')
    .reduce((sum, sefer) => sum + sefer.TotalPrice, 0);
  
  return {
    total,
    departed,
    returned,
    invoiced,
    uninvoiced,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    pendingRevenue: parseFloat(pendingRevenue.toFixed(2)),
  };
}

/**
 * Aktif çıkışları (denizde olan) getir
 */
export function getActiveDepartures(seferler: MotorbotSefer[] = motorbotSeferData): MotorbotSefer[] {
  return seferler.filter((s) => s.Status === 'DEPARTED');
}

// ===== MASTER DATA (MOCK) =====
export const motorbotSeferData: MotorbotSefer[] = [
  // CR-001 - Ahmet Yılmaz (MB-001 SEALION) - 1-7 Kasım arası
  {
    Id: 1,
    MotorbotId: 1,
    MotorbotCode: "MB-001",
    MotorbotName: "SEALION",
    MotorbotOwner: "Ahmet Yılmaz",
    CariCode: "CR-001",
    
    DepartureDate: "2025-11-02",
    DepartureTime: "08:30",
    DepartureNote: "Yakıt ikmali yapıldı",
    
    ReturnDate: "2025-11-02",
    ReturnTime: "17:45",
    ReturnNote: "Sorunsuz dönüş",
    
    Duration: 555, // 9 saat 15 dakika
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-07",
    
    CreatedAt: "2025-11-02T08:30:00",
    CreatedBy: 101,
  },
  {
    Id: 2,
    MotorbotId: 1,
    MotorbotCode: "MB-001",
    MotorbotName: "SEALION",
    MotorbotOwner: "Ahmet Yılmaz",
    CariCode: "CR-001",
    
    DepartureDate: "2025-11-04",
    DepartureTime: "10:15",
    DepartureNote: "Rutin çıkış",
    
    ReturnDate: "2025-11-04",
    ReturnTime: "16:30",
    ReturnNote: "Normal dönüş",
    
    Duration: 375, // 6 saat 15 dakika
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-07",
    
    CreatedAt: "2025-11-04T10:15:00",
    CreatedBy: 101,
  },
  {
    Id: 3,
    MotorbotId: 1,
    MotorbotCode: "MB-001",
    MotorbotName: "SEALION",
    MotorbotOwner: "Ahmet Yılmaz",
    CariCode: "CR-001",
    
    DepartureDate: "2025-11-06",
    DepartureTime: "09:00",
    DepartureNote: "Sabah çıkışı",
    
    ReturnDate: "2025-11-06",
    ReturnTime: "18:20",
    ReturnNote: "Akşam dönüş",
    
    Duration: 560, // 9 saat 20 dakika
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-07",
    
    CreatedAt: "2025-11-06T09:00:00",
    CreatedBy: 102,
  },
  
  // CR-002 - Mehmet Kaya (MB-002 DOLPHIN) - 8-14 Kasım arası
  {
    Id: 4,
    MotorbotId: 2,
    MotorbotCode: "MB-002",
    MotorbotName: "DOLPHIN",
    MotorbotOwner: "Mehmet Kaya",
    CariCode: "CR-002",
    
    DepartureDate: "2025-11-09",
    DepartureTime: "07:45",
    DepartureNote: "Erken çıkış",
    
    ReturnDate: "2025-11-09",
    ReturnTime: "19:15",
    ReturnNote: "Başarılı dönüş",
    
    Duration: 690, // 11 saat 30 dakika
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-14",
    
    CreatedAt: "2025-11-09T07:45:00",
    CreatedBy: 101,
  },
  {
    Id: 5,
    MotorbotId: 2,
    MotorbotCode: "MB-002",
    MotorbotName: "DOLPHIN",
    MotorbotOwner: "Mehmet Kaya",
    CariCode: "CR-002",
    
    DepartureDate: "2025-11-11",
    DepartureTime: "08:30",
    DepartureNote: "Orta hafta",
    
    ReturnDate: "2025-11-11",
    ReturnTime: "17:00",
    ReturnNote: "Sorunsuz",
    
    Duration: 510,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-14",
    
    CreatedAt: "2025-11-11T08:30:00",
    CreatedBy: 102,
  },
  {
    Id: 6,
    MotorbotId: 2,
    MotorbotCode: "MB-002",
    MotorbotName: "DOLPHIN",
    MotorbotOwner: "Mehmet Kaya",
    CariCode: "CR-002",
    
    DepartureDate: "2025-11-13",
    DepartureTime: "09:15",
    DepartureNote: "Hafta sonu öncesi",
    
    ReturnDate: "2025-11-13",
    ReturnTime: "16:45",
    ReturnNote: "Normal dönüş",
    
    Duration: 450,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-14",
    
    CreatedAt: "2025-11-13T09:15:00",
    CreatedBy: 101,
  },

  // CR-003 - Ayşe Demir (MB-003 ORCA) - 15-21 Kasım arası
  {
    Id: 7,
    MotorbotId: 3,
    MotorbotCode: "MB-003",
    MotorbotName: "ORCA",
    MotorbotOwner: "Ayşe Demir",
    CariCode: "CR-003",
    
    DepartureDate: "2025-11-16",
    DepartureTime: "08:00",
    DepartureNote: "Hafta başı",
    
    ReturnDate: "2025-11-16",
    ReturnTime: "18:30",
    ReturnNote: "Tamamlandı",
    
    Duration: 630,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-21",
    
    CreatedAt: "2025-11-16T08:00:00",
    CreatedBy: 101,
  },
  {
    Id: 8,
    MotorbotId: 3,
    MotorbotCode: "MB-003",
    MotorbotName: "ORCA",
    MotorbotOwner: "Ayşe Demir",
    CariCode: "CR-003",
    
    DepartureDate: "2025-11-18",
    DepartureTime: "07:30",
    DepartureNote: "Erken sefer",
    
    ReturnDate: "2025-11-18",
    ReturnTime: "19:00",
    ReturnNote: "Başarılı",
    
    Duration: 690,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-21",
    
    CreatedAt: "2025-11-18T07:30:00",
    CreatedBy: 102,
  },
  {
    Id: 9,
    MotorbotId: 3,
    MotorbotCode: "MB-003",
    MotorbotName: "ORCA",
    MotorbotOwner: "Ayşe Demir",
    CariCode: "CR-003",
    
    DepartureDate: "2025-11-20",
    DepartureTime: "10:00",
    DepartureNote: "Öğleden önce",
    
    ReturnDate: "2025-11-20",
    ReturnTime: "17:15",
    ReturnNote: "Sorunsuz dönüş",
    
    Duration: 435,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-21",
    
    CreatedAt: "2025-11-20T10:00:00",
    CreatedBy: 101,
  },

  // CR-004 - Can Öztürk (MB-004 SHARK) - 22-28 Kasım arası
  {
    Id: 10,
    MotorbotId: 4,
    MotorbotCode: "MB-004",
    MotorbotName: "SHARK",
    MotorbotOwner: "Can Öztürk",
    CariCode: "CR-004",
    
    DepartureDate: "2025-11-23",
    DepartureTime: "08:45",
    DepartureNote: "Hafta sonu sonrası",
    
    ReturnDate: "2025-11-23",
    ReturnTime: "18:00",
    ReturnNote: "Normal",
    
    Duration: 555,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-28",
    
    CreatedAt: "2025-11-23T08:45:00",
    CreatedBy: 102,
  },
  {
    Id: 11,
    MotorbotId: 4,
    MotorbotCode: "MB-004",
    MotorbotName: "SHARK",
    MotorbotOwner: "Can Öztürk",
    CariCode: "CR-004",
    
    DepartureDate: "2025-11-25",
    DepartureTime: "09:30",
    DepartureNote: "Orta hafta",
    
    ReturnDate: "2025-11-25",
    ReturnTime: "16:30",
    ReturnNote: "Tamamlandı",
    
    Duration: 420,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-28",
    
    CreatedAt: "2025-11-25T09:30:00",
    CreatedBy: 101,
  },
  {
    Id: 12,
    MotorbotId: 4,
    MotorbotCode: "MB-004",
    MotorbotName: "SHARK",
    MotorbotOwner: "Can Öztürk",
    CariCode: "CR-004",
    
    DepartureDate: "2025-11-27",
    DepartureTime: "08:00",
    DepartureNote: "Hafta sonu öncesi",
    
    ReturnDate: "2025-11-27",
    ReturnTime: "17:45",
    ReturnNote: "Başarılı dönüş",
    
    Duration: 585,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-28",
    
    CreatedAt: "2025-11-27T08:00:00",
    CreatedBy: 102,
  },

  // CR-001 - Ahmet Yılmaz (MB-001 SEALION) - 8-14 Kasım arası (ikinci dönem)
  {
    Id: 13,
    MotorbotId: 1,
    MotorbotCode: "MB-001",
    MotorbotName: "SEALION",
    MotorbotOwner: "Ahmet Yılmaz",
    CariCode: "CR-001",
    
    DepartureDate: "2025-11-10",
    DepartureTime: "08:15",
    DepartureNote: "İkinci dönem başlangıç",
    
    ReturnDate: "2025-11-10",
    ReturnTime: "17:30",
    ReturnNote: "Sorunsuz",
    
    Duration: 555,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-14",
    
    CreatedAt: "2025-11-10T08:15:00",
    CreatedBy: 101,
  },
  {
    Id: 14,
    MotorbotId: 1,
    MotorbotCode: "MB-001",
    MotorbotName: "SEALION",
    MotorbotOwner: "Ahmet Yılmaz",
    CariCode: "CR-001",
    
    DepartureDate: "2025-11-12",
    DepartureTime: "09:45",
    DepartureNote: "Orta dönem",
    
    ReturnDate: "2025-11-12",
    ReturnTime: "18:15",
    ReturnNote: "Normal dönüş",
    
    Duration: 510,
    Status: "RETURNED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    InvoicePeriod: "2025-11-14",
    
    CreatedAt: "2025-11-12T09:45:00",
    CreatedBy: 101,
  },

  // Henüz dönmemiş seferler (denizde)
  {
    Id: 15,
    MotorbotId: 1,
    MotorbotCode: "MB-001",
    MotorbotName: "SEALION",
    MotorbotOwner: "Ahmet Yılmaz",
    CariCode: "CR-001",
    
    DepartureDate: "2025-11-19",
    DepartureTime: "11:30",
    DepartureNote: "Bugünkü sefer",
    
    Status: "DEPARTED",
    
    UnitPrice: 10.00,
    Currency: "USD",
    VatRate: 18,
    VatAmount: 1.80,
    TotalPrice: 11.80,
    
    IsInvoiced: false,
    
    CreatedAt: "2025-11-19T11:30:00",
    CreatedBy: 102,
  },
];

// Export helper fonksiyon
export const getSeferById = (id: number): MotorbotSefer | undefined => {
  return motorbotSeferData.find((s) => s.Id === id);
};

export const getSefersByMotorbot = (motorbotId: number): MotorbotSefer[] => {
  return motorbotSeferData.filter((s) => s.MotorbotId === motorbotId);
};

export const getTodaySefers = (): MotorbotSefer[] => {
  const today = new Date().toISOString().split('T')[0];
  return motorbotSeferData.filter((s) => s.DepartureDate === today);
};