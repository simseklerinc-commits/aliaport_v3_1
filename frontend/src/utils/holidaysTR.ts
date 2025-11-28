/**
 * TÜRKİYE RESMİ TATİL KONTROLÜ
 * Nager.Date API kullanarak Türkiye resmi tatillerini sorgular
 * API: https://date.nager.at
 */

interface PublicHoliday {
  date: string; // ISO format: YYYY-MM-DD
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

const API_BASE = 'https://date.nager.at/api/v3';
const COUNTRY_CODE = 'TR';

// Cache için global store
const holidayCache: Map<number, PublicHoliday[]> = new Map();

/**
 * Belirtilen yıl için Türkiye resmi tatillerini getirir
 * @param year Yıl (örn: 2025)
 * @returns PublicHoliday dizisi
 */
export async function getPublicHolidaysTR(year: number): Promise<PublicHoliday[]> {
  // Cache kontrolü
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  try {
    const response = await fetch(`${API_BASE}/PublicHolidays/${year}/${COUNTRY_CODE}`);
    
    if (!response.ok) {
      console.warn(`[holidaysTR] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const holidays: PublicHoliday[] = await response.json();
    
    // Cache'e kaydet
    holidayCache.set(year, holidays);
    
    return holidays;
  } catch (error) {
    console.warn('[holidaysTR] API fetch failed:', error);
    return [];
  }
}

/**
 * Verilen tarihin Türkiye'de resmi tatil olup olmadığını kontrol eder
 * Sadece "Public" tipindeki tatilleri dikkate alır
 * @param date Tarih (Date object veya YYYY-MM-DD string)
 * @returns true = resmi tatil, false = çalışma günü
 */
export async function isPublicHolidayTR(date: string | Date): Promise<boolean> {
  try {
    // Tarihi normalize et (YYYY-MM-DD formatına)
    let dateStr: string;
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = date;
    }

    // Yılı çıkart
    const year = parseInt(dateStr.split('-')[0]);
    
    // O yılın tatillerini al
    const holidays = await getPublicHolidaysTR(year);
    
    // Sadece "Public" tipindeki tatilleri filtrele ve kontrol et
    const isHoliday = holidays.some(
      (holiday) => 
        holiday.date === dateStr && 
        holiday.types.includes('Public')
    );
    
    return isHoliday;
  } catch (error) {
    console.warn('[holidaysTR] isPublicHolidayTR failed:', error);
    return false;
  }
}

/**
 * Bir tarihin hafta sonu olup olmadığını kontrol eder
 * @param date Tarih (Date object veya YYYY-MM-DD string)
 * @returns true = hafta sonu (Cumartesi/Pazar), false = hafta içi
 */
export function isWeekend(date: string | Date): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const dayOfWeek = dateObj.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Pazar, 6 = Cumartesi
}

/**
 * Bir tarihin çalışma günü olup olmadığını kontrol eder
 * (Hafta sonu VE resmi tatil değilse = çalışma günü)
 * @param date Tarih
 * @returns true = çalışma günü, false = tatil/hafta sonu
 */
export async function isWorkingDay(date: string | Date): Promise<boolean> {
  if (isWeekend(date)) {
    return false;
  }
  
  const isHoliday = await isPublicHolidayTR(date);
  return !isHoliday;
}

/**
 * Belirli bir tarihten itibaren ilk çalışma gününü bulur
 * @param startDate Başlangıç tarihi
 * @param maxDaysToCheck Maksimum kontrol edilecek gün sayısı (default: 10)
 * @returns İlk çalışma günü veya null
 */
export async function getNextWorkingDay(
  startDate: Date, 
  maxDaysToCheck: number = 10
): Promise<Date | null> {
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < maxDaysToCheck; i++) {
    if (await isWorkingDay(currentDate)) {
      return new Date(currentDate);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return null;
}

/**
 * Cache'i temizler (test için kullanışlı)
 */
export function clearHolidayCache(): void {
  holidayCache.clear();
}

// ============================================
// DEMO VE TEST KULLANIMI
// ============================================

/**
 * 2025 yılı tatillerini listeler ve bugünün tatil olup olmadığını kontrol eder
 */
export async function demoHolidaysTR(): Promise<void> {
  console.log('=== TÜRKİYE RESMİ TATİLLER 2025 ===\n');
  
  // 2025 tatillerini al
  const holidays2025 = await getPublicHolidaysTR(2025);
  
  console.log(`Toplam ${holidays2025.length} resmi tatil:\n`);
  
  holidays2025.forEach((holiday) => {
    const types = holiday.types.join(', ');
    console.log(`📅 ${holiday.date} - ${holiday.localName} (${holiday.name})`);
    console.log(`   Tip: ${types}, Global: ${holiday.global ? 'Evet' : 'Hayır'}\n`);
  });
  
  // Bugünün tatil olup olmadığını kontrol et
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  console.log('=== BUGÜN KONTROL ===\n');
  console.log(`Tarih: ${todayStr}`);
  
  const isTodayHoliday = await isPublicHolidayTR(today);
  const isTodayWeekend = isWeekend(today);
  const isTodayWorking = await isWorkingDay(today);
  
  console.log(`Hafta sonu: ${isTodayWeekend ? 'Evet' : 'Hayır'}`);
  console.log(`Resmi tatil: ${isTodayHoliday ? 'Evet' : 'Hayır'}`);
  console.log(`Çalışma günü: ${isTodayWorking ? 'Evet' : 'Hayır'}`);
  
  // Bir sonraki çalışma gününü bul
  if (!isTodayWorking) {
    const nextWorking = await getNextWorkingDay(today);
    if (nextWorking) {
      console.log(`\nBir sonraki çalışma günü: ${nextWorking.toISOString().split('T')[0]}`);
    }
  }
}

// Uncomment to run demo:
// demoHolidaysTR();
