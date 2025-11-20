// Cari Kart Validasyon Fonksiyonları

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

/**
 * VKN (Vergi Kimlik Numarası) Validasyonu
 * 10 haneli olmalı ve numerik olmalı
 */
export function validateVKN(vkn: string): boolean {
  if (!vkn || vkn.length !== 10) return false;
  return /^\d{10}$/.test(vkn);
}

/**
 * TCKN (TC Kimlik No) Validasyonu
 * 11 haneli olmalı ve numerik olmalı
 * İlk hane 0 olamaz
 */
export function validateTCKN(tckn: string): boolean {
  if (!tckn || tckn.length !== 11) return false;
  if (!/^\d{11}$/.test(tckn)) return false;
  if (tckn[0] === '0') return false;
  
  // TCKN algoritması kontrolü (opsiyonel - basitleştirilmiş)
  const digits = tckn.split('').map(Number);
  
  // 10. hane kontrolü
  const sum10 = (
    (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 -
    (digits[1] + digits[3] + digits[5] + digits[7])
  ) % 10;
  
  if (sum10 !== digits[9]) return false;
  
  // 11. hane kontrolü
  const sum11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  
  if (sum11 !== digits[10]) return false;
  
  return true;
}

/**
 * E-posta Validasyonu
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Opsiyonel alan
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Posta Kodu Validasyonu
 * Türkiye için 5 haneli
 */
export function validatePostalCode(postalCode: string, countryCode: string = 'TR'): boolean {
  if (!postalCode) return true; // Opsiyonel alan
  
  if (countryCode === 'TR') {
    return /^\d{5}$/.test(postalCode);
  }
  
  // Diğer ülkeler için genel kontrol
  return postalCode.length >= 4 && postalCode.length <= 10;
}

/**
 * IBAN Validasyonu (Basitleştirilmiş)
 */
export function validateIBAN(iban: string): boolean {
  if (!iban) return true; // Opsiyonel alan
  
  // Türkiye IBAN: TR + 2 kontrol hanesi + 24 hane = 26 karakter
  const cleanIBAN = iban.replace(/\s/g, '');
  
  if (cleanIBAN.startsWith('TR')) {
    return cleanIBAN.length === 26;
  }
  
  // Diğer ülkeler için genel kontrol
  return cleanIBAN.length >= 15 && cleanIBAN.length <= 34;
}

/**
 * Telefon Validasyonu (Basitleştirilmiş)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Opsiyonel alan
  
  // En az 10 karakter (rakam)
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10;
}

/**
 * Mersis No Validasyonu
 * 16 haneli olmalı
 */
export function validateMersisNo(mersisNo: string): boolean {
  if (!mersisNo) return true; // Opsiyonel alan
  return /^\d{16}$/.test(mersisNo);
}

/**
 * KEP Adresi Validasyonu
 * E-posta formatında olmalı ve @kep.tr ile bitmeli
 */
export function validateKEP(kep: string): boolean {
  if (!kep) return true; // Opsiyonel alan
  
  if (!validateEmail(kep)) return false;
  
  // KEP adresi genelde .kep.tr ile biter
  return kep.endsWith('.kep.tr');
}

/**
 * Cari Kart Tam Validasyonu
 */
export function validateCariKart(cari: any): ValidationResult {
  const errors: { [key: string]: string } = {};

  // Zorunlu alanlar
  if (!cari.Code?.trim()) {
    errors.Code = "Cari kodu zorunludur";
  }

  if (!cari.Name?.trim()) {
    errors.Name = "Ünvan/Ad Soyad zorunludur";
  }

  // Vergi Kimlik
  if (!cari.TaxId?.trim()) {
    errors.TaxId = "Vergi/TC Kimlik No zorunludur";
  } else {
    if (cari.TaxIdType === 'VKN') {
      if (!validateVKN(cari.TaxId)) {
        errors.TaxId = "Geçersiz VKN (10 haneli rakam olmalı)";
      }
    } else if (cari.TaxIdType === 'TCKN') {
      if (!validateTCKN(cari.TaxId)) {
        errors.TaxId = "Geçersiz TCKN (11 haneli geçerli TC Kimlik No olmalı)";
      }
    }
  }

  // Adres
  if (!cari.City?.trim()) {
    errors.City = "İl zorunludur";
  }

  if (!cari.CountryCode?.trim()) {
    errors.CountryCode = "Ülke kodu zorunludur";
  } else if (cari.CountryCode.length !== 2) {
    errors.CountryCode = "Ülke kodu 2 haneli ISO kodu olmalı (ör: TR)";
  }

  // Posta Kodu
  if (cari.PostalCode && !validatePostalCode(cari.PostalCode, cari.CountryCode)) {
    if (cari.CountryCode === 'TR') {
      errors.PostalCode = "Posta kodu 5 haneli olmalı";
    } else {
      errors.PostalCode = "Geçersiz posta kodu";
    }
  }

  // İletişim
  if (cari.Email && !validateEmail(cari.Email)) {
    errors.Email = "Geçersiz e-posta adresi";
  }

  if (cari.Phone && !validatePhone(cari.Phone)) {
    errors.Phone = "Geçersiz telefon numarası (en az 10 rakam)";
  }

  if (cari.Mobile && !validatePhone(cari.Mobile)) {
    errors.Mobile = "Geçersiz cep telefonu (en az 10 rakam)";
  }

  // IBAN
  if (cari.IBAN && !validateIBAN(cari.IBAN)) {
    errors.IBAN = "Geçersiz IBAN (TR için 26 karakter)";
  }

  // Ticari Kimlik
  if (cari.MersisNo && !validateMersisNo(cari.MersisNo)) {
    errors.MersisNo = "Mersis No 16 haneli olmalı";
  }

  if (cari.KepAddress && !validateKEP(cari.KepAddress)) {
    errors.KepAddress = "Geçersiz KEP adresi (.kep.tr ile bitmeli)";
  }

  // E-Fatura
  if (cari.IsEInvoiceCustomer && !cari.EInvoiceAlias?.trim()) {
    errors.EInvoiceAlias = "E-Fatura mükellefleri için alias zorunludur";
  }

  // Finansal
  if (cari.PaymentTermDays < 0) {
    errors.PaymentTermDays = "Ödeme vadesi negatif olamaz";
  }

  if (cari.RiskLimit && cari.RiskLimit < 0) {
    errors.RiskLimit = "Risk limiti negatif olamaz";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sadece değişen bir alanı validate et
 */
export function validateField(fieldName: string, value: any, cari?: any): string | null {
  switch (fieldName) {
    case 'Code':
      return !value?.trim() ? "Cari kodu zorunludur" : null;
    
    case 'Name':
      return !value?.trim() ? "Ünvan/Ad Soyad zorunludur" : null;
    
    case 'TaxId':
      if (!value?.trim()) return "Vergi/TC Kimlik No zorunludur";
      if (cari?.TaxIdType === 'VKN' && !validateVKN(value)) {
        return "Geçersiz VKN (10 haneli rakam olmalı)";
      }
      if (cari?.TaxIdType === 'TCKN' && !validateTCKN(value)) {
        return "Geçersiz TCKN (11 haneli geçerli TC Kimlik No olmalı)";
      }
      return null;
    
    case 'City':
      return !value?.trim() ? "İl zorunludur" : null;
    
    case 'CountryCode':
      if (!value?.trim()) return "Ülke kodu zorunludur";
      if (value.length !== 2) return "Ülke kodu 2 haneli ISO kodu olmalı";
      return null;
    
    case 'PostalCode':
      if (!value) return null;
      return validatePostalCode(value, cari?.CountryCode) ? null : "Geçersiz posta kodu";
    
    case 'Email':
      if (!value) return null;
      return validateEmail(value) ? null : "Geçersiz e-posta adresi";
    
    case 'Phone':
    case 'Mobile':
      if (!value) return null;
      return validatePhone(value) ? null : "Geçersiz telefon numarası";
    
    case 'IBAN':
      if (!value) return null;
      return validateIBAN(value) ? null : "Geçersiz IBAN";
    
    case 'MersisNo':
      if (!value) return null;
      return validateMersisNo(value) ? null : "Mersis No 16 haneli olmalı";
    
    case 'KepAddress':
      if (!value) return null;
      return validateKEP(value) ? null : "Geçersiz KEP adresi";
    
    case 'EInvoiceAlias':
      if (cari?.IsEInvoiceCustomer && !value?.trim()) {
        return "E-Fatura mükellefleri için alias zorunludur";
      }
      return null;
    
    case 'PaymentTermDays':
      return value < 0 ? "Ödeme vadesi negatif olamaz" : null;
    
    case 'RiskLimit':
      return value && value < 0 ? "Risk limiti negatif olamaz" : null;
    
    default:
      return null;
  }
}

/**
 * Hata mesajlarını temizle
 */
export function clearError(errors: { [key: string]: string }, fieldName: string): { [key: string]: string } {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
}

/**
 * Format helpers
 */
export function formatTaxId(value: string, type: 'VKN' | 'TCKN'): string {
  const digitsOnly = value.replace(/\D/g, '');
  const maxLength = type === 'VKN' ? 10 : 11;
  return digitsOnly.slice(0, maxLength);
}

export function formatPostalCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5);
}

export function formatIBAN(value: string): string {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  // TR için formatting: TR00 0000 0000 0000 0000 0000 00
  if (cleaned.startsWith('TR')) {
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  }
  return cleaned;
}

export function formatPhone(value: string): string {
  // Basit format: +90 532 123 45 67
  const digits = value.replace(/\D/g, '');
  
  if (digits.startsWith('90') && digits.length >= 12) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  
  return value;
}
