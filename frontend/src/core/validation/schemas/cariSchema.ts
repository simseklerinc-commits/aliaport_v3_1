import { z } from 'zod';

// Cari oluşturma formu için Zod şeması
export const cariCreateSchema = z.object({
  CariKod: z.string().min(3, 'Cari kod en az 3 karakter').max(50, 'Cari kod en fazla 50 karakter'),
  Unvan: z.string().min(1, 'Unvan zorunlu').max(200, 'Unvan en fazla 200 karakter'),
  CariTip: z.enum(['GERCEK', 'TUZEL'], { required_error: 'Cari tip seçilmeli' }),
  Rol: z.enum(['MUSTERI', 'TEDARIKCI', 'DIGER'], { required_error: 'Rol seçilmeli' }),
  Eposta: z.string().email('Geçerli e-posta değil').optional().or(z.literal('').transform(() => undefined)),
  Telefon: z.string().max(50, 'Telefon en fazla 50 karakter').optional(),
  VergiNo: z.string().max(20, 'Vergi no en fazla 20 karakter').optional(),
  Tckn: z.string().length(11, 'TCKN 11 haneli olmalı').optional(),
  Ulke: z.string().max(50).optional(),
  Il: z.string().max(50).optional(),
  Ilce: z.string().max(50).optional(),
  Adres: z.string().max(500).optional(),
  IletisimKisi: z.string().max(100).optional(),
  Iban: z.string().max(34).optional(),
  VadeGun: z.number().int().min(0).max(180).optional(),
  ParaBirimi: z.string().max(10).optional(),
  Notlar: z.string().max(1000).optional()
});

export type CariCreateFormValues = z.infer<typeof cariCreateSchema>;
