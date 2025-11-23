# Aliaport Frontend – Form Validation Plan (Stub)

## Amaç
Tüm formlarda tutarlı, yeniden kullanılabilir ve backend hata kodları ile entegre doğrulama altyapısı kurmak.

## Teknolojiler
- React Hook Form (performanslı, kontrollü olmayan yaklaşım)
- Zod (şema tanımları + runtime validation + tip inference)

## Temel Prensipler
1. Şema → `schemas/<domain>/<entity>.schema.ts` (örn: `schemas/cari/cari.schema.ts`).
2. Her şema Zod ile tanımlanır ve `infer` ile TS tipi üretilir.
3. Backend error.code eşleştirme: alan bazlı validation sonrası backend generic hata → toast, field spesifik → field error.
4. Async validation (örn: duplicate code) `onBlur` ile API çağrısı + error injection.

## Örnek Şema
```typescript
import { z } from 'zod';

export const workOrderSchema = z.object({
  cari_code: z.string().min(1).max(20),
  subject: z.string().min(3).max(120),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
  type: z.enum(['HIZMET','MOTORBOT','BARINMA','DIGER']),
});

export type WorkOrderForm = z.infer<typeof workOrderSchema>;
```

## React Hook Form Entegrasyonu
```typescript
const { register, handleSubmit, formState: { errors }, setError } = useForm<WorkOrderForm>({
  resolver: zodResolver(workOrderSchema)
});

async function onSubmit(values: WorkOrderForm) {
  const resp = await apiClient.request('/work-order', { method: 'POST', body: values });
  if (!resp.success) {
    if (resp.error.field) {
      setError(resp.error.field as keyof WorkOrderForm, { message: resp.error.message });
    } else {
      // global toast
    }
  }
}
```

## Backend Hata Kodları Mapping Örnekleri
- `CARI_DUPLICATE_CODE` → `code` alanına setError
- `WO_INVALID_STATUS_TRANSITION` → global alert (iş kuralları)
- `VALIDATION_ERROR` → backend `details` içindeki field bazlı hata listesi iterate edilip setError yapılır.

## Açık Sorular (Planlanacak)
- Global toast sistemi (Zustand store?)
- Alan odaklı async debounce kontrol (örn: cari kodu sorgulama)
- Form draft autosave mekanizması?

## Sonraki Adım
1. Zod + RHF paketlerinin eklenmesi.
2. Ortak `FormErrorMessage` component.
3. Backend error.details formatı için parser helper.

Son Güncelleme: 23 Kasım 2025