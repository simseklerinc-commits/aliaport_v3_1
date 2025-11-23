import { z } from 'zod';

// Hizmet form şeması
export const hizmetCreateSchema = z.object({
  Kod: z.string().min(3, 'Kod en az 3 karakter').max(50, 'Kod en fazla 50 karakter'),
  Ad: z.string().min(1, 'Ad zorunlu').max(200, 'Ad en fazla 200 karakter'),
  Aciklama: z.string().max(1000, 'Açıklama en fazla 1000 karakter').optional(),
  MuhasebeKodu: z.string().max(50).optional(),
  GrupKod: z.string().max(50).optional(),
  Birim: z.string().max(20).optional(),
  Fiyat: z.number().min(0, 'Fiyat negatif olamaz').optional(),
  ParaBirimi: z.string().max(10).optional(),
  KdvOrani: z.number().min(0).max(100, 'KDV oranı 0-100 arası olmalı').optional(),
  SiraNo: z.number().int().min(0).optional()
});

export type HizmetCreateFormValues = z.infer<typeof hizmetCreateSchema>;

export const hizmetUpdateSchema = hizmetCreateSchema.partial().extend({
  Id: z.number().int().positive(),
  AktifMi: z.boolean().optional()
});

export type HizmetUpdateFormValues = z.infer<typeof hizmetUpdateSchema>;
