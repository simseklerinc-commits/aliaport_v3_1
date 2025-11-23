/**
 * WorkOrder Form Validation Schemas
 * Backend schema'ya uygun Zod validation
 * 
 * @see backend/aliaport_api/modules/isemri/schemas.py
 */

import { z } from 'zod';

/**
 * WorkOrder Type enum
 */
export const WorkOrderTypeEnum = z.enum(['HIZMET', 'MOTORBOT', 'BARINMA', 'DIGER']);

/**
 * WorkOrder Priority enum
 */
export const WorkOrderPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

/**
 * WorkOrder Status enum
 */
export const WorkOrderStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SAHADA',
  'TAMAMLANDI',
  'FATURALANDI',
  'KAPANDI',
  'REJECTED',
]);

/**
 * WorkOrderItem Type enum
 */
export const WorkOrderItemTypeEnum = z.enum(['WORKLOG', 'RESOURCE', 'SERVICE']);

// =====================
// WorkOrder Schemas
// =====================

/**
 * WorkOrder oluşturma şeması
 */
export const workOrderCreateSchema = z.object({
  CariId: z.number().int().positive('Cari ID gerekli'),
  CariCode: z.string().min(1, 'Cari kod gerekli').max(20, 'Cari kod en fazla 20 karakter'),
  CariTitle: z.string().min(1, 'Cari ünvan gerekli').max(255, 'Cari ünvan en fazla 255 karakter'),
  RequesterUserId: z.number().int().positive().optional(),
  RequesterUserName: z.string().max(100).optional(),
  Type: WorkOrderTypeEnum,
  ServiceCode: z.string().max(50).optional(),
  Action: z.string().max(100).optional(),
  Subject: z.string().min(3, 'Konu en az 3 karakter').max(120, 'Konu en fazla 120 karakter'),
  Description: z.string().max(500, 'Açıklama en fazla 500 karakter').optional(),
  Priority: WorkOrderPriorityEnum.default('MEDIUM'),
  PlannedStart: z.string().datetime().optional(),
  PlannedEnd: z.string().datetime().optional(),
  ActualStart: z.string().datetime().optional(),
  ActualEnd: z.string().datetime().optional(),
  Status: WorkOrderStatusEnum.default('DRAFT'),
  GateRequired: z.boolean().default(false),
  SahaKayitYetkisi: z.boolean().default(true),
  AttachmentsCount: z.number().int().min(0).default(0),
  HasSignature: z.boolean().default(false),
  IsCabatogeTrFlag: z.boolean().default(false),
  ApplyRuleAddons: z.boolean().default(true),
  SecurityExitTime: z.string().datetime().optional(),
  AttachedLetterApproved: z.boolean().default(false),
  Notes: z.string().optional(),
  IsActive: z.boolean().default(true),
});

export type WorkOrderCreateFormValues = z.infer<typeof workOrderCreateSchema>;

/**
 * WorkOrder güncelleme şeması (partial)
 */
export const workOrderUpdateSchema = workOrderCreateSchema.partial();

export type WorkOrderUpdateFormValues = z.infer<typeof workOrderUpdateSchema>;

/**
 * WorkOrder status change şeması
 */
export const workOrderStatusChangeSchema = z.object({
  Status: WorkOrderStatusEnum,
  Notes: z.string().max(500).optional(),
});

export type WorkOrderStatusChangeFormValues = z.infer<typeof workOrderStatusChangeSchema>;

// =====================
// WorkOrderItem Schemas
// =====================

/**
 * WorkOrderItem oluşturma şeması
 */
export const workOrderItemCreateSchema = z.object({
  WorkOrderId: z.number().int().positive('İş emri ID gerekli'),
  WoNumber: z.string().max(50, 'İş emri no en fazla 50 karakter'),
  ItemType: WorkOrderItemTypeEnum,
  ResourceCode: z.string().max(50).optional(),
  ResourceName: z.string().max(100).optional(),
  ServiceCode: z.string().max(50).optional(),
  ServiceName: z.string().max(100).optional(),
  StartTime: z.string().datetime().optional(),
  EndTime: z.string().datetime().optional(),
  DurationMinutes: z.number().int().min(0).optional(),
  Quantity: z.number().positive('Miktar pozitif olmalı'),
  Unit: z.string().min(1, 'Birim gerekli').max(20, 'Birim en fazla 20 karakter'),
  UnitPrice: z.number().min(0, 'Birim fiyat negatif olamaz'),
  Currency: z.string().min(3).max(3).default('TRY'),
  TotalAmount: z.number().min(0, 'Toplam tutar negatif olamaz'),
  VatRate: z.number().min(0).max(100, 'KDV oranı 0-100 arası').default(20),
  VatAmount: z.number().min(0, 'KDV tutarı negatif olamaz'),
  GrandTotal: z.number().min(0, 'Genel toplam negatif olamaz'),
  Notes: z.string().optional(),
  IsInvoiced: z.boolean().default(false),
  InvoiceId: z.number().int().positive().optional(),
});

export type WorkOrderItemCreateFormValues = z.infer<typeof workOrderItemCreateSchema>;

/**
 * WorkOrderItem güncelleme şeması (partial)
 */
export const workOrderItemUpdateSchema = workOrderItemCreateSchema
  .omit({ WorkOrderId: true, WoNumber: true })
  .partial();

export type WorkOrderItemUpdateFormValues = z.infer<typeof workOrderItemUpdateSchema>;

// =====================
// Custom Validations
// =====================

/**
 * Date range validation helper
 */
export const validateDateRange = (startDate?: string, endDate?: string): boolean => {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

/**
 * WorkOrder with date range validation
 */
export const workOrderCreateWithDatesSchema = workOrderCreateSchema.refine(
  (data) => validateDateRange(data.PlannedStart, data.PlannedEnd),
  {
    message: 'Planlanan başlangıç tarihi bitiş tarihinden önce olmalı',
    path: ['PlannedEnd'],
  }
).refine(
  (data) => validateDateRange(data.ActualStart, data.ActualEnd),
  {
    message: 'Gerçekleşen başlangıç tarihi bitiş tarihinden önce olmalı',
    path: ['ActualEnd'],
  }
);

/**
 * WorkOrderItem with calculated totals validation
 */
export const workOrderItemCreateWithCalculationSchema = workOrderItemCreateSchema.refine(
  (data) => {
    const expectedTotal = data.Quantity * data.UnitPrice;
    const tolerance = 0.01; // Floating point tolerance
    return Math.abs(data.TotalAmount - expectedTotal) < tolerance;
  },
  {
    message: 'Toplam tutar (Miktar × Birim Fiyat) ile eşleşmiyor',
    path: ['TotalAmount'],
  }
).refine(
  (data) => {
    const expectedVat = (data.TotalAmount * data.VatRate) / 100;
    const tolerance = 0.01;
    return Math.abs(data.VatAmount - expectedVat) < tolerance;
  },
  {
    message: 'KDV tutarı hesaplaması yanlış',
    path: ['VatAmount'],
  }
).refine(
  (data) => {
    const expectedGrandTotal = data.TotalAmount + data.VatAmount;
    const tolerance = 0.01;
    return Math.abs(data.GrandTotal - expectedGrandTotal) < tolerance;
  },
  {
    message: 'Genel toplam (Toplam + KDV) ile eşleşmiyor',
    path: ['GrandTotal'],
  }
);
