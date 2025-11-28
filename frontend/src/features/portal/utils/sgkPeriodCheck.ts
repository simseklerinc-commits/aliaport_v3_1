/**
 * SGK DÖNEM KONTROLÜ VE TARİH LOJİĞİ
 * 
 * Kurallar:
 * - Her ayın 26'sında bir ÖNCEKİ ayın SGK hizmet listesi yüklenir
 * - Eğer 26'sı hafta sonu veya resmi tatile denk gelirse, ilk çalışma gününe ertelenir
 * - Bugün 27 Kasım 2025 ise, Ekim 2025 yüklenmiş olmalı (26 Kasım'da yüklendi)
 * - Bugün 25 Kasım ise, henüz Eylül yüklenmiş olmalı (26 Kasım'da Ekim yüklenecek)
 */

import { isPublicHolidayTR, isWeekend, getNextWorkingDay } from '@/utils/holidaysTR';

export interface SgkPeriodStatus {
  // Yüklenmesi gereken dönemler
  requiredPeriods: string[]; // YYYYMM formatında
  
  // Mevcut yüklenmiş dönem (varsa)
  lastUploadedPeriod: string | null; // YYYYMM
  
  // Eksik dönem var mı?
  hasMissingPeriod: boolean;
  
  // Eksik dönem sayısı
  missingPeriodCount: number;
  
  // Eksik dönemler
  missingPeriods: string[]; // YYYYMM
  
  // Bir sonraki yükleme tarihi
  nextUploadDeadline: Date;
  
  // Bir sonraki yüklenecek dönem
  nextPeriodToUpload: string; // YYYYMM
  
  // Uyarı seviyesi
  alertLevel: 'none' | 'warning' | 'critical';
  
  // Kullanıcı dostu mesaj
  message: string;
}

/**
 * Bir tarih için 26. gün veya ilk çalışma gününü bulur
 */
async function getUploadDeadlineForMonth(year: number, month: number): Promise<Date> {
  // Ayın 26'sını oluştur
  const day26 = new Date(year, month - 1, 26);
  
  // Hafta sonu mı?
  if (isWeekend(day26)) {
    const nextWorking = await getNextWorkingDay(day26);
    return nextWorking || day26;
  }
  
  // Resmi tatil mi?
  const isHoliday = await isPublicHolidayTR(day26);
  if (isHoliday) {
    const nextWorking = await getNextWorkingDay(day26);
    return nextWorking || day26;
  }
  
  return day26;
}

/**
 * Belirli bir tarih için yüklenmesi gereken dönemleri hesaplar
 * @param currentDate Bugünün tarihi
 * @param companyStartDate Firma kayıt tarihi (created_at)
 */
export async function calculateRequiredPeriods(
  currentDate: Date,
  companyStartDate?: Date
): Promise<string[]> {
  const required: string[] = [];
  
  // Firma başlangıç tarihi yoksa, default olarak 12 ay öncesinden başla
  const startDate = companyStartDate || new Date(currentDate.getFullYear(), currentDate.getMonth() - 12, 1);
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentDay = currentDate.getDate();
  
  // Son 12 ay içindeki tüm dönemleri kontrol et
  for (let i = 12; i >= 0; i--) {
    const checkDate = new Date(currentYear, currentMonth - 1 - i, 1);
    const checkYear = checkDate.getFullYear();
    const checkMonth = checkDate.getMonth() + 1;
    
    // Eğer kontrol edilen dönem firma başlangıcından önceyse, atla
    if (checkDate < new Date(startDate.getFullYear(), startDate.getMonth(), 1)) {
      continue;
    }
    
    // Bu dönemin yükleme tarihi: BİR SONRAKİ AYIN 26'sı
    // Örneğin Ekim dönemi için yükleme tarihi = 26 Kasım
    const uploadMonth = checkMonth === 12 ? 1 : checkMonth + 1;
    const uploadYear = checkMonth === 12 ? checkYear + 1 : checkYear;
    const uploadDeadline = await getUploadDeadlineForMonth(uploadYear, uploadMonth);
    
    // Eğer yükleme tarihi geçmişse, bu dönem yüklenmiş olmalı
    if (currentDate >= uploadDeadline) {
      const period = `${checkYear}${String(checkMonth).padStart(2, '0')}`;
      required.push(period);
    }
  }
  
  return required;
}

/**
 * Bir sonraki yükleme tarihini hesaplar
 */
export async function getNextUploadDeadline(currentDate: Date): Promise<{
  deadline: Date;
  period: string;
}> {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Bu ayın 26'sını kontrol et
  const thisMonthDeadline = await getUploadDeadlineForMonth(currentYear, currentMonth);
  
  if (currentDate < thisMonthDeadline) {
    // Henüz bu ayın yükleme tarihi gelmemiş
    // Bu ayın 26'sında BİR ÖNCEKİ AY yüklenecek
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const period = `${prevYear}${String(prevMonth).padStart(2, '0')}`;
    return { deadline: thisMonthDeadline, period };
  }
  
  // Bir sonraki ayın 26'sı
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  
  const nextMonthDeadline = await getUploadDeadlineForMonth(nextYear, nextMonth);
  // Bir sonraki ayın 26'sında BU AY yüklenecek
  const period = `${currentYear}${String(currentMonth).padStart(2, '0')}`;
  
  return { deadline: nextMonthDeadline, period };
}

/**
 * Mevcut SGK dönem durumunu hesaplar
 */
export async function checkSgkPeriodStatus(
  currentDate: Date,
  lastUploadedPeriod?: string | null,
  companyStartDate?: Date
): Promise<SgkPeriodStatus> {
  // Yüklenmesi gereken tüm dönemleri hesapla
  const requiredPeriods = await calculateRequiredPeriods(currentDate, companyStartDate);
  
  // Bir sonraki yükleme deadline'ını bul
  const nextUpload = await getNextUploadDeadline(currentDate);
  
  // Son yüklenmiş dönemi normalize et
  const lastPeriod = lastUploadedPeriod || null;
  
  // Eksik dönemleri bul
  const missingPeriods = requiredPeriods.filter((period) => {
    if (!lastPeriod) return true;
    return period > lastPeriod;
  });
  
  const hasMissingPeriod = missingPeriods.length > 0;
  const missingCount = missingPeriods.length;
  
  // Uyarı seviyesi
  let alertLevel: 'none' | 'warning' | 'critical' = 'none';
  let message = 'SGK hizmet listeleri güncel';
  
  if (missingCount > 0) {
    const mostRecentRequired = requiredPeriods[requiredPeriods.length - 1];
    const mostRecentYear = mostRecentRequired.slice(0, 4);
    const mostRecentMonth = mostRecentRequired.slice(4, 6);
    
    if (missingCount >= 2) {
      alertLevel = 'critical';
      message = `SGK hizmet listeleri eksik! ${missingCount} dönem yüklenmemiş.`;
    } else {
      alertLevel = 'warning';
      message = `${mostRecentYear}-${mostRecentMonth} dönemi SGK hizmet listesi yüklenmemiş.`;
    }
  }
  
  return {
    requiredPeriods,
    lastUploadedPeriod: lastPeriod,
    hasMissingPeriod,
    missingPeriodCount: missingCount,
    missingPeriods,
    nextUploadDeadline: nextUpload.deadline,
    nextPeriodToUpload: nextUpload.period,
    alertLevel,
    message,
  };
}

/**
 * Dönem string'ini kullanıcı dostu formata çevirir
 * @param period YYYYMM formatında
 * @returns YYYY-MM formatında
 */
export function formatPeriod(period: string): string {
  if (!period || period.length !== 6) return '';
  return `${period.slice(0, 4)}-${period.slice(4, 6)}`;
}

/**
 * Ay numarasını Türkçe ay adına çevirir
 */
export function getMonthNameTR(monthNumber: string): string {
  const months: { [key: string]: string } = {
    '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
    '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
    '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık',
  };
  return months[monthNumber] || monthNumber;
}
