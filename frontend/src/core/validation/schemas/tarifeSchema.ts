import { z } from 'zod';

// PriceList (Tarife) şeması
export const priceListCreateSchema = z.object({
  Kod: z.string().min(3, 'Kod en az 3 karakter').max(50, 'Kod en fazla 50 karakter'),
  Ad: z.string().min(1, 'Ad zorunlu').max(200, 'Ad en fazla 200 karakter'),
  Aciklama: z.string().max(1000).optional(),
  ParaBirimi: z.string().max(10).optional(),
  GecerlilikBaslangic: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatında olmalı').optional(),
  GecerlilikBitis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatında olmalı').optional()
}).refine(
  (data) => {
    if (data.GecerlilikBaslangic && data.GecerlilikBitis) {
      return data.GecerlilikBaslangic <= data.GecerlilikBitis;
    }
    return true;
  },
  { message: 'Başlangıç tarihi bitiş tarihinden önce olmalı', path: ['GecerlilikBitis'] }
);

export type PriceListCreateFormValues = z.infer<typeof priceListCreateSchema>;

export const priceListUpdateSchema = priceListCreateSchema.partial().extend({
  Id: z.number().int().positive(),
  Durum: z.enum(['TASLAK', 'AKTIF', 'PASIF']).optional(),
  Versiyon: z.number().int().positive().optional(),
  AktifMi: z.boolean().optional()
});

export type PriceListUpdateFormValues = z.infer<typeof priceListUpdateSchema>;

// PriceListItem (Tarife Kalemi) şeması
export const priceListItemCreateSchema = z.object({
  PriceListId: z.number().int().positive('Tarife seçilmeli'),
  HizmetKodu: z.string().min(1, 'Hizmet kodu zorunlu').max(50),
  HizmetAdi: z.string().min(1, 'Hizmet adı zorunlu').max(200),
  Birim: z.string().max(20).optional(),
  BirimFiyat: z.number().min(0, 'Fiyat negatif olamaz'),
  KdvOrani: z.number().min(0).max(100).optional(),
  Aciklama: z.string().max(500).optional(),
  SiraNo: z.number().int().min(0).optional()
});

export type PriceListItemCreateFormValues = z.infer<typeof priceListItemCreateSchema>;

export const priceListItemUpdateSchema = priceListItemCreateSchema.partial().extend({
  Id: z.number().int().positive(),
  AktifMi: z.boolean().optional()
});

export type PriceListItemUpdateFormValues = z.infer<typeof priceListItemUpdateSchema>;
