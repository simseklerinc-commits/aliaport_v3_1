/**
 * SHARED UTILS - Formatters
 * Veri formatlama yardımcı fonksiyonları
 */

/**
 * Para birimi formatla
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'TRY',
  locale: string = 'tr-TR'
): string {
  if (amount === null || amount === undefined) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Sayı formatla
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2,
  locale: string = 'tr-TR'
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Tarih formatla
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'long' | 'datetime' = 'short',
  locale: string = 'tr-TR'
): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(dateObj);

    case 'long':
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);

    case 'datetime':
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);

    default:
      return dateObj.toLocaleDateString(locale);
  }
}

/**
 * Telefon formatla
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) {
    return '-';
  }

  // Sadece rakamları al
  const cleaned = phone.replace(/\D/g, '');

  // Türkiye telefon formatı: 0 (5XX) XXX XX XX
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.substring(0, 1)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9)}`;
  }

  // 10 haneli: (5XX) XXX XX XX
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`;
  }

  return phone;
}

/**
 * IBAN formatla
 */
export function formatIBAN(iban: string | null | undefined): string {
  if (!iban) {
    return '-';
  }

  // Sadece harfleri ve rakamları al
  const cleaned = iban.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  // 4'lü gruplar halinde formatla
  return cleaned.match(/.{1,4}/g)?.join(' ') || iban;
}

/**
 * Dosya boyutu formatla
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) {
    return '-';
  }

  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Yüzde formatla
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return `%${formatNumber(value, decimals)}`;
}

/**
 * Boolean değeri Türkçe'ye çevir
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return value ? 'Evet' : 'Hayır';
}

/**
 * Aktif/Pasif durumu formatla
 */
export function formatStatus(isActive: boolean | null | undefined): string {
  if (isActive === null || isActive === undefined) {
    return '-';
  }

  return isActive ? 'Aktif' : 'Pasif';
}
