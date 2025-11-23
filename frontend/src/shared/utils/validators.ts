/**
 * SHARED UTILS - Validators
 * Validasyon yardımcı fonksiyonları
 */

/**
 * Email validasyonu
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Türkiye telefon numarası validasyonu
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // 10 veya 11 haneli olmalı
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return false;
  }

  // 11 haneli ise 0 ile başlamalı
  if (cleaned.length === 11 && !cleaned.startsWith('0')) {
    return false;
  }

  // 10 haneli ise 5 ile başlamalı (mobil)
  if (cleaned.length === 10 && !cleaned.startsWith('5')) {
    return false;
  }

  return true;
}

/**
 * TC Kimlik No validasyonu
 */
export function isValidTCKN(tckn: string): boolean {
  if (!tckn || tckn.length !== 11) {
    return false;
  }

  const digits = tckn.split('').map(Number);

  // İlk hane 0 olamaz
  if (digits[0] === 0) {
    return false;
  }

  // 10. hane kontrolü
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = (sum1 - sum2) % 10;

  if (digits[9] !== digit10) {
    return false;
  }

  // 11. hane kontrolü
  const sum3 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = sum3 % 10;

  return digits[10] === digit11;
}

/**
 * Vergi numarası validasyonu (10 hane)
 */
export function isValidTaxNumber(taxNumber: string): boolean {
  const cleaned = taxNumber.replace(/\D/g, '');
  return cleaned.length === 10;
}

/**
 * IBAN validasyonu
 */
export function isValidIBAN(iban: string): boolean {
  const cleaned = iban.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  // TR IBAN 26 karakter
  if (cleaned.length !== 26 || !cleaned.startsWith('TR')) {
    return false;
  }

  // Mod-97 kontrolü
  const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);
  const numericIBAN = rearranged
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? code - 55 : char;
    })
    .join('');

  // BigInt kullanarak mod 97
  const remainder = BigInt(numericIBAN) % BigInt(97);
  return remainder === BigInt(1);
}

/**
 * Zorunlu alan kontrolü
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

/**
 * Minimum uzunluk kontrolü
 */
export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Maksimum uzunluk kontrolü
 */
export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Sayı aralığı kontrolü
 */
export function isInRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * Pozitif sayı kontrolü
 */
export function isPositive(value: number): boolean {
  return value > 0;
}

/**
 * Geçerli URL kontrolü
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validasyon hata mesajları
 */
export const validationMessages = {
  required: 'Bu alan zorunludur',
  email: 'Geçerli bir email adresi giriniz',
  phone: 'Geçerli bir telefon numarası giriniz',
  tckn: 'Geçerli bir TC Kimlik No giriniz',
  taxNumber: 'Geçerli bir vergi numarası giriniz',
  iban: 'Geçerli bir IBAN giriniz',
  url: 'Geçerli bir URL giriniz',
  minLength: (min: number) => `En az ${min} karakter olmalıdır`,
  maxLength: (max: number) => `En fazla ${max} karakter olmalıdır`,
  positive: 'Pozitif bir sayı olmalıdır',
  inRange: (min: number, max: number) => `${min} ile ${max} arasında olmalıdır`,
};
