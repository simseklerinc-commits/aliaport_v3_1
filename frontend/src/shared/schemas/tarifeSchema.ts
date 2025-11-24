/**
 * Tarife (Price List) Form Validation Schema
 * Zod ile tanımlanmış validasyon kuralları
 */

import { z } from 'zod';

// Pozitif sayı validasyonu
const positiveNumber = z
  .number()
  .positive('Değer pozitif olmalıdır')
  .finite('Geçerli bir sayı giriniz');

// Para birimi enum
const currencyEnum = z.enum(['TRY', 'USD', 'EUR', 'GBP'], {
  errorMap: () => ({ message: 'Para birimi seçiniz' }),
});

// Birim enum
const unitEnum = z.enum(['ADET', 'KG', 'TON', 'M3', 'SAAT', 'GUN'], {
  errorMap: () => ({ message: 'Birim seçiniz' }),
});

// PriceList Schema
export const createPriceListSchema = z.object({
  ListeKodu: z
    .string()
    .min(1, 'Liste kodu zorunludur')
    .max(50, 'Liste kodu en fazla 50 karakter olabilir')
    .regex(/^[A-Z0-9_-]+$/, 'Liste kodu sadece büyük harf, rakam, tire ve alt çizgi içerebilir'),
  
  ListeAdi: z
    .string()
    .min(1, 'Liste adı zorunludur')
    .max(200, 'Liste adı en fazla 200 karakter olabilir'),
  
  Aciklama: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional(),
  
  ParaBirimi: currencyEnum,
  
  GecerlilikBaslangic: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih giriniz' }
    ),
  
  GecerlilikBitis: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih giriniz' }
    ),
  
  Notlar: z
    .string()
    .max(1000, 'Notlar en fazla 1000 karakter olabilir')
    .optional(),
}).refine(
  (data) => {
    // Bitiş tarihi başlangıçtan önce olamaz
    if (data.GecerlilikBitis) {
      const start = new Date(data.GecerlilikBaslangic);
      const end = new Date(data.GecerlilikBitis);
      return end >= start;
    }
    return true;
  },
  {
    message: 'Bitiş tarihi başlangıç tarihinden önce olamaz',
    path: ['GecerlilikBitis'],
  }
);

export const updatePriceListSchema = createPriceListSchema
  .partial()
  .extend({
    Id: z.number().int().positive(),
    AktifMi: z.boolean().optional(),
  });

// PriceListItem Schema
export const createPriceListItemSchema = z.object({
  FiyatListesiId: z.number().int().positive('Fiyat listesi seçiniz'),
  
  HizmetKodu: z
    .string()
    .min(1, 'Hizmet kodu zorunludur')
    .max(50, 'Hizmet kodu en fazla 50 karakter olabilir'),
  
  HizmetAdi: z
    .string()
    .min(1, 'Hizmet adı zorunludur')
    .max(200, 'Hizmet adı en fazla 200 karakter olabilir'),
  
  Birim: unitEnum,
  
  BirimFiyat: positiveNumber,
  
  MinimumMiktar: z
    .number()
    .min(0, 'Minimum miktar negatif olamaz')
    .optional()
    .nullable(),
  
  Notlar: z
    .string()
    .max(500, 'Notlar en fazla 500 karakter olabilir')
    .optional(),
});

export const updatePriceListItemSchema = createPriceListItemSchema
  .partial()
  .extend({
    Id: z.number().int().positive(),
  });

export type CreatePriceListFormData = z.infer<typeof createPriceListSchema>;
export type UpdatePriceListFormData = z.infer<typeof updatePriceListSchema>;
export type CreatePriceListItemFormData = z.infer<typeof createPriceListItemSchema>;
export type UpdatePriceListItemFormData = z.infer<typeof updatePriceListItemSchema>;
