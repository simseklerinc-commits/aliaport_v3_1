/**
 * WorkOrder (İş Emri) Form Validation Schema
 * Zod ile tanımlanmış validasyon kuralları
 */

import { z } from 'zod';

// WorkOrder Schema
export const createWorkOrderSchema = z.object({
  IsEmriNo: z
    .string()
    .min(1, 'İş emri no zorunludur')
    .max(50, 'İş emri no en fazla 50 karakter olabilir')
    .regex(/^[A-Z0-9_-]+$/, 'İş emri no sadece büyük harf, rakam, tire ve alt çizgi içerebilir'),
  
  CariId: z
    .number()
    .int()
    .positive('Cari seçiniz'),
  
  BarinmaId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  
  IsEmriTarihi: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih giriniz' }
    ),
  
  TahminiBaslangic: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih giriniz' }
    ),
  
  TahminiBitis: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih giriniz' }
    ),
  
  GercekBaslangic: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih/saat giriniz' }
    ),
  
  GercekBitis: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Geçerli bir tarih/saat giriniz' }
    ),
  
  Durum: z.enum(['TASLAK', 'ONAYLANDI', 'DEVAM_EDIYOR', 'TAMAMLANDI', 'IPTAL'], {
    errorMap: () => ({ message: 'Durum seçiniz' }),
  }),
  
  Oncelik: z.enum(['DUSUK', 'NORMAL', 'YUKSEK', 'ACIl'], {
    errorMap: () => ({ message: 'Öncelik seçiniz' }),
  }),
  
  Aciklama: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional(),
  
  Notlar: z
    .string()
    .max(1000, 'Notlar en fazla 1000 karakter olabilir')
    .optional(),
});

export const updateWorkOrderSchema = createWorkOrderSchema
  .partial()
  .extend({
    Id: z.number().int().positive(),
  });

// WorkOrderItem Schema
export const createWorkOrderItemSchema = z.object({
  WorkOrderId: z
    .number()
    .int()
    .positive('İş emri seçiniz'),
  
  HizmetKodu: z
    .string()
    .min(1, 'Hizmet kodu zorunludur')
    .max(50, 'Hizmet kodu en fazla 50 karakter olabilir'),
  
  HizmetAdi: z
    .string()
    .min(1, 'Hizmet adı zorunludur')
    .max(200, 'Hizmet adı en fazla 200 karakter olabilir'),
  
  Miktar: z
    .number()
    .positive('Miktar pozitif olmalıdır')
    .max(999999, 'Miktar çok büyük'),
  
  Birim: z.enum(['ADET', 'KG', 'TON', 'M3', 'SAAT', 'GUN'], {
    errorMap: () => ({ message: 'Birim seçiniz' }),
  }),
  
  BirimFiyat: z
    .number()
    .nonnegative('Birim fiyat negatif olamaz'),
  
  Tutar: z
    .number()
    .nonnegative('Tutar negatif olamaz'),
  
  Notlar: z
    .string()
    .max(500, 'Notlar en fazla 500 karakter olabilir')
    .optional(),
}).refine(
  (data) => {
    // Tutar = Miktar * BirimFiyat kontrolü
    const expectedTutar = data.Miktar * data.BirimFiyat;
    const diff = Math.abs(data.Tutar - expectedTutar);
    return diff < 0.01; // Floating point toleransı
  },
  {
    message: 'Tutar, miktar × birim fiyat değerine eşit olmalıdır',
    path: ['Tutar'],
  }
);

export const updateWorkOrderItemSchema = createWorkOrderItemSchema
  .partial()
  .extend({
    Id: z.number().int().positive(),
  });

export type CreateWorkOrderFormData = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderFormData = z.infer<typeof updateWorkOrderSchema>;
export type CreateWorkOrderItemFormData = z.infer<typeof createWorkOrderItemSchema>;
export type UpdateWorkOrderItemFormData = z.infer<typeof updateWorkOrderItemSchema>;
