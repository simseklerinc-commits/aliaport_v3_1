// Number & currency formatting & parsing helpers

// =====================
// Format: Number → Display
// =====================

export function formatNumber(value: number | string | null | undefined, locale = 'tr-TR', maximumFractionDigits = 2) {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(num);
}

export function formatCurrency(amount: number | string | null | undefined, currency: string = 'TRY', locale = 'tr-TR') {
  if (amount === null || amount === undefined || amount === '') return '-';
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num);
}

export function formatPercentage(value: number | string | null | undefined, locale = 'tr-TR', maximumFractionDigits = 2) {
  if (value === null || value === undefined || value === '') return '-';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits }).format(num / 100);
}

export function safeParseFloat(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === 'number' ? value : Number(value);
  return isNaN(num) ? fallback : num;
}

// =====================
// Parse: Form Input → Number
// =====================

/**
 * Parse decimal string to number (handles comma/dot separators)
 * 
 * @example
 * parseDecimal('1.234,56') → 1234.56 (TR locale)
 * parseDecimal('1,234.56') → 1234.56 (EN locale)
 * parseDecimal('1234.56') → 1234.56
 */
export function parseDecimal(value: string | null | undefined, locale: 'tr-TR' | 'en-US' = 'tr-TR'): number | null {
  if (!value || value === '') return null;
  
  // TR locale: binlik ayırıcı nokta (.), ondalık ayırıcı virgül (,)
  // EN locale: binlik ayırıcı virgül (,), ondalık ayırıcı nokta (.)
  let normalized = value.trim();
  
  if (locale === 'tr-TR') {
    // Binlik ayırıcı noktaları kaldır, virgülü noktaya çevir
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    // Binlik ayırıcı virgülleri kaldır
    normalized = normalized.replace(/,/g, '');
  }
  
  const num = Number(normalized);
  return isNaN(num) ? null : num;
}

/**
 * Parse currency string to number (removes currency symbols and formats)
 * 
 * @example
 * parseCurrency('₺1.234,56') → 1234.56
 * parseCurrency('$1,234.56') → 1234.56
 * parseCurrency('1.234,56 TRY') → 1234.56
 */
export function parseCurrency(value: string | null | undefined, locale: 'tr-TR' | 'en-US' = 'tr-TR'): number | null {
  if (!value || value === '') return null;
  
  // Para birimi sembolleri ve harfleri kaldır
  let cleaned = value.replace(/[₺$€£¥\s]/g, '').replace(/[A-Z]{3}/g, '').trim();
  
  return parseDecimal(cleaned, locale);
}

/**
 * Parse percentage string to number
 * 
 * @example
 * parsePercentage('20%') → 20
 * parsePercentage('20.5%') → 20.5
 * parsePercentage('20,5%') → 20.5 (TR locale)
 */
export function parsePercentage(value: string | null | undefined, locale: 'tr-TR' | 'en-US' = 'tr-TR'): number | null {
  if (!value || value === '') return null;
  
  // Yüzde sembolünü kaldır
  const cleaned = value.replace('%', '').trim();
  
  return parseDecimal(cleaned, locale);
}

/**
 * Parse integer string to number
 * 
 * @example
 * parseInteger('1.234') → 1234 (TR locale - nokta binlik ayırıcı)
 * parseInteger('1,234') → 1234 (EN locale - virgül binlik ayırıcı)
 */
export function parseInteger(value: string | null | undefined, locale: 'tr-TR' | 'en-US' = 'tr-TR'): number | null {
  if (!value || value === '') return null;
  
  let cleaned = value.trim();
  
  // Binlik ayırıcıları kaldır
  if (locale === 'tr-TR') {
    cleaned = cleaned.replace(/\./g, '');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

// =====================
// Validation Helpers
// =====================

/**
 * Check if string is valid number
 */
export function isValidNumber(value: string | null | undefined, locale: 'tr-TR' | 'en-US' = 'tr-TR'): boolean {
  const num = parseDecimal(value, locale);
  return num !== null;
}

/**
 * Round number to specified decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
