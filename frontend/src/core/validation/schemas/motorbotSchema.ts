/**
 * Motorbot & MbTrip Form Validation Schemas
 * Backend schema'ya uygun Zod validation
 * 
 * @see backend/aliaport_api/modules/motorbot/schemas.py
 */

import { z } from 'zod';

/**
 * Motorbot Durum enum
 */
export const MotorbotDurumEnum = z.enum(['AKTIF', 'PASIF', 'BAKIMDA']);

/**
 * MbTrip Durum enum
 */
export const MbTripDurumEnum = z.enum(['PLANLANDI', 'DEVAM_EDIYOR', 'TAMAMLANDI', 'IPTAL']);

/**
 * MbTrip Fatura Durumu enum
 */
export const MbTripFaturaDurumuEnum = z.enum(['FATURA_BEKLIYOR', 'FATURALANDI', 'ODENDI']);

// =====================
// Motorbot Schemas
// =====================

/**
 * Motorbot oluşturma şeması
 */
export const motorbotCreateSchema = z.object({
  Kod: z.string().min(3, 'Kod en az 3 karakter').max(50, 'Kod en fazla 50 karakter'),
  Ad: z.string().min(1, 'Ad zorunlu').max(200, 'Ad en fazla 200 karakter'),
  Plaka: z.string().max(20, 'Plaka en fazla 20 karakter').optional(),
  KapasiteTon: z.number().min(0, 'Kapasite negatif olamaz').optional(),
  MaxHizKnot: z.number().min(0, 'Maksimum hız negatif olamaz').optional(),
  OwnerCariId: z.number().int().positive().optional(),
  OwnerCariKod: z.string().max(50).optional(),
  Durum: MotorbotDurumEnum.default('AKTIF'),
  AlisTarihi: z.string().date().optional(), // YYYY-MM-DD format
  Notlar: z.string().max(1000).optional(),
});

export type MotorbotCreateFormValues = z.infer<typeof motorbotCreateSchema>;

/**
 * Motorbot güncelleme şeması (partial)
 */
export const motorbotUpdateSchema = motorbotCreateSchema.partial();

export type MotorbotUpdateFormValues = z.infer<typeof motorbotUpdateSchema>;

// =====================
// MbTrip Schemas
// =====================

/**
 * MbTrip oluşturma şeması
 */
export const mbTripCreateSchema = z.object({
  MotorbotId: z.number().int().positive('Motorbot ID gerekli'),
  SeferTarihi: z.string().date('Geçerli tarih formatı: YYYY-MM-DD'),
  CikisZamani: z.string().datetime().optional(),
  DonusZamani: z.string().datetime().optional(),
  KalkisIskele: z.string().max(100, 'Kalkış iskelesi en fazla 100 karakter').optional(),
  VarisIskele: z.string().max(100, 'Varış iskelesi en fazla 100 karakter').optional(),
  CariId: z.number().int().positive().optional(),
  CariKod: z.string().max(50).optional(),
  YukAciklama: z.string().max(500, 'Yük açıklaması en fazla 500 karakter').optional(),
  Notlar: z.string().max(1000).optional(),
  Durum: MbTripDurumEnum.default('PLANLANDI'),
  FaturaDurumu: MbTripFaturaDurumuEnum.optional(),
});

export type MbTripCreateFormValues = z.infer<typeof mbTripCreateSchema>;

/**
 * MbTrip güncelleme şeması (partial)
 */
export const mbTripUpdateSchema = mbTripCreateSchema.partial();

export type MbTripUpdateFormValues = z.infer<typeof mbTripUpdateSchema>;

// =====================
// Custom Validations
// =====================

/**
 * Motorbot kapasite ve hız validasyonu
 */
export const motorbotCreateWithLimitsSchema = motorbotCreateSchema.refine(
  (data) => {
    if (data.KapasiteTon !== undefined && data.KapasiteTon > 1000) {
      return false;
    }
    return true;
  },
  {
    message: 'Kapasite 1000 tondan fazla olamaz',
    path: ['KapasiteTon'],
  }
).refine(
  (data) => {
    if (data.MaxHizKnot !== undefined && data.MaxHizKnot > 100) {
      return false;
    }
    return true;
  },
  {
    message: 'Maksimum hız 100 knottan fazla olamaz',
    path: ['MaxHizKnot'],
  }
);

/**
 * MbTrip sefer zaman validasyonu
 */
export const mbTripCreateWithTimeValidationSchema = mbTripCreateSchema.refine(
  (data) => {
    if (!data.CikisZamani || !data.DonusZamani) return true;
    return new Date(data.CikisZamani) < new Date(data.DonusZamani);
  },
  {
    message: 'Çıkış zamanı dönüş zamanından önce olmalı',
    path: ['DonusZamani'],
  }
).refine(
  (data) => {
    // Sefer tarihi ile çıkış zamanı aynı gün olmalı
    if (!data.CikisZamani) return true;
    const seferDate = new Date(data.SeferTarihi);
    const cikisDate = new Date(data.CikisZamani);
    return (
      seferDate.getFullYear() === cikisDate.getFullYear() &&
      seferDate.getMonth() === cikisDate.getMonth() &&
      seferDate.getDate() === cikisDate.getDate()
    );
  },
  {
    message: 'Çıkış zamanı sefer tarihi ile aynı gün olmalı',
    path: ['CikisZamani'],
  }
);

/**
 * MbTrip iskele validasyonu (en az biri dolu olmalı)
 */
export const mbTripWithIskeleSchema = mbTripCreateSchema.refine(
  (data) => {
    return data.KalkisIskele || data.VarisIskele;
  },
  {
    message: 'Kalkış veya varış iskelesinden en az biri belirtilmeli',
    path: ['KalkisIskele'],
  }
);

/**
 * Motorbot sahiplik validasyonu
 */
export const motorbotWithOwnerSchema = motorbotCreateSchema.refine(
  (data) => {
    // OwnerCariId varsa OwnerCariKod da olmalı
    if (data.OwnerCariId && !data.OwnerCariKod) {
      return false;
    }
    return true;
  },
  {
    message: 'Cari ID belirtilmişse Cari Kod da belirtilmeli',
    path: ['OwnerCariKod'],
  }
);
