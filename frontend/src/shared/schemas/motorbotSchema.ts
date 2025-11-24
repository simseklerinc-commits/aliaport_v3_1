/**
 * Motorbot Form Validation Schema
 * Zod ile tanımlanmış validasyon kuralları
 */

import { z } from 'zod';

// Motorbot Schema
export const createMotorbotSchema = z.object({
  BotKodu: z
    .string()
    .min(1, 'Bot kodu zorunludur')
    .max(50, 'Bot kodu en fazla 50 karakter olabilir')
    .regex(/^[A-Z0-9_-]+$/, 'Bot kodu sadece büyük harf, rakam, tire ve alt çizgi içerebilir'),
  
  BotAdi: z
    .string()
    .min(1, 'Bot adı zorunludur')
    .max(100, 'Bot adı en fazla 100 karakter olabilir'),
  
  Tip: z.enum(['ROMORKÖR', 'PILOT', 'DESTEK'], {
    errorMap: () => ({ message: 'Bot tipi seçiniz' }),
  }),
  
  Kapasite: z
    .number()
    .positive('Kapasite pozitif olmalıdır')
    .max(1000, 'Kapasite en fazla 1000 olabilir'),
  
  CariId: z
    .number()
    .int()
    .positive('Cari seçiniz')
    .optional()
    .nullable(),
  
  IMO: z
    .string()
    .max(20, 'IMO en fazla 20 karakter olabilir')
    .optional(),
  
  MMSI: z
    .string()
    .max(20, 'MMSI en fazla 20 karakter olabilir')
    .optional(),
  
  Bayrak: z
    .string()
    .max(50, 'Bayrak en fazla 50 karakter olabilir')
    .optional(),
  
  IletisimBilgisi: z
    .string()
    .max(200, 'İletişim bilgisi en fazla 200 karakter olabilir')
    .optional(),
  
  Notlar: z
    .string()
    .max(1000, 'Notlar en fazla 1000 karakter olabilir')
    .optional(),
});

export const updateMotorbotSchema = createMotorbotSchema
  .partial()
  .extend({
    Id: z.number().int().positive(),
    AktifMi: z.boolean().optional(),
  });

// Motorbot Sefer Schema
export const createSeferSchema = z.object({
  MotorbotId: z
    .number()
    .int()
    .positive('Motorbot seçiniz'),
  
  BaslangicZamani: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih/saat giriniz' }
    ),
  
  BitisZamani: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih/saat giriniz' }
    ),
  
  BaslangicLokasyonu: z
    .string()
    .max(200, 'Başlangıç lokasyonu en fazla 200 karakter olabilir')
    .optional(),
  
  BitisLokasyonu: z
    .string()
    .max(200, 'Bitiş lokasyonu en fazla 200 karakter olabilir')
    .optional(),
  
  Durum: z.enum(['PLANLANDI', 'DEVAM_EDIYOR', 'TAMAMLANDI', 'IPTAL'], {
    errorMap: () => ({ message: 'Durum seçiniz' }),
  }),
  
  MusteriCariId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  
  GemiAdi: z
    .string()
    .max(100, 'Gemi adı en fazla 100 karakter olabilir')
    .optional(),
  
  Notlar: z
    .string()
    .max(1000, 'Notlar en fazla 1000 karakter olabilir')
    .optional(),
}).refine(
  (data) => {
    // Bitiş zamanı başlangıçtan önce olamaz
    if (data.BitisZamani) {
      const start = new Date(data.BaslangicZamani);
      const end = new Date(data.BitisZamani);
      return end >= start;
    }
    return true;
  },
  {
    message: 'Bitiş zamanı başlangıç zamanından önce olamaz',
    path: ['BitisZamani'],
  }
);

export const updateSeferSchema = createSeferSchema
  .partial()
  .extend({
    Id: z.number().int().positive(),
  });

export type CreateMotorbotFormData = z.infer<typeof createMotorbotSchema>;
export type UpdateMotorbotFormData = z.infer<typeof updateMotorbotSchema>;
export type CreateSeferFormData = z.infer<typeof createSeferSchema>;
export type UpdateSeferFormData = z.infer<typeof updateSeferSchema>;
