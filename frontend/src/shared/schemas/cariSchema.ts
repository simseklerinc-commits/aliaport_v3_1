/**
 * Cari Form Validation Schema
 * Zod ile tanımlanmış validasyon kuralları
 */

import { z } from 'zod';

// TCKN validasyonu (11 haneli)
const tcknSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return /^\d{11}$/.test(val);
    },
    { message: 'TCKN 11 haneli olmalıdır' }
  );

// Vergi No validasyonu (10 haneli)
const vergiNoSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return /^\d{10}$/.test(val);
    },
    { message: 'Vergi No 10 haneli olmalıdır' }
  );

// Email validasyonu
const emailSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    },
    { message: 'Geçerli bir e-posta adresi giriniz' }
  );

// Telefon validasyonu (10 haneli, başında 0 olmadan)
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return /^[1-9]\d{9}$/.test(val.replace(/[\s()-]/g, ''));
    },
    { message: 'Geçerli bir telefon numarası giriniz (10 hane)' }
  );

// IBAN validasyonu (TR ile başlayan 26 karakter)
const ibanSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const cleaned = val.replace(/\s/g, '');
      return /^TR\d{24}$/.test(cleaned);
    },
    { message: 'Geçerli bir IBAN giriniz (TR ile başlayan 26 karakter)' }
  );

export const createCariSchema = z
  .object({
    CariKod: z
      .string()
      .min(1, 'Cari kodu zorunludur')
      .max(50, 'Cari kodu en fazla 50 karakter olabilir'),
    
    Unvan: z
      .string()
      .min(1, 'Ünvan zorunludur')
      .max(200, 'Ünvan en fazla 200 karakter olabilir'),
    
    CariTip: z.enum(['GERCEK', 'TUZEL'], {
      errorMap: () => ({ message: 'Cari tipi seçiniz' }),
    }),
    
    Rol: z.enum(['MUSTERI', 'TEDARIKCI', 'DIGER'], {
      errorMap: () => ({ message: 'Rol seçiniz' }),
    }),
    
    Eposta: emailSchema,
    Telefon: phoneSchema,
    VergiNo: vergiNoSchema,
    Tckn: tcknSchema,
    
    Ulke: z.string().max(100).optional(),
    Il: z.string().max(100).optional(),
    Ilce: z.string().max(100).optional(),
    Adres: z.string().max(500).optional(),
    IletisimKisi: z.string().max(200).optional(),
    Iban: ibanSchema,
    
    VadeGun: z
      .number()
      .int('Vade günü tam sayı olmalıdır')
      .min(0, 'Vade günü negatif olamaz')
      .max(365, 'Vade günü en fazla 365 gün olabilir')
      .optional()
      .nullable(),
    
    ParaBirimi: z.string().max(10).optional(),
    Notlar: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      // Gerçek kişi ise TCKN zorunlu
      if (data.CariTip === 'GERCEK' && !data.Tckn) {
        return false;
      }
      return true;
    },
    {
      message: 'Gerçek kişi için TCKN zorunludur',
      path: ['Tckn'],
    }
  )
  .refine(
    (data) => {
      // Tüzel kişi ise Vergi No zorunlu
      if (data.CariTip === 'TUZEL' && !data.VergiNo) {
        return false;
      }
      return true;
    },
    {
      message: 'Tüzel kişi için Vergi No zorunludur',
      path: ['VergiNo'],
    }
  );

export const updateCariSchema = createCariSchema
  .partial()
  .extend({
    Id: z.number().int().positive(),
    AktifMi: z.boolean().optional(),
  });

export type CreateCariFormData = z.infer<typeof createCariSchema>;
export type UpdateCariFormData = z.infer<typeof updateCariSchema>;
