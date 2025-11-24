import { UseFormReturn } from 'react-hook-form';
import { ApiError } from '@/lib/api/client';
import type { StandardEnvelope } from '@/lib/types/database';

interface BackendFieldError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

interface UseFormErrorsOptions {
  mapCodes?: Record<string, string>; // Override veya ek mesajlar
  defaultField?: string; // Field gelmezse nereye yazılsın (örn: 'root')
}

/**
 * useFormErrors
 * Backend standard zarfındaki error.code / error.field değerlerini otomatik RHF setError'a aktarır.
 * Çoklu validation detayları varsa details.validation array'i beklenir.
 */
export function useFormErrors<TFieldValues>(form: UseFormReturn<TFieldValues>, options: UseFormErrorsOptions = {}) {
  const { mapCodes = {}, defaultField = 'root' } = options;

  function applyApiError(err: unknown) {
    // ApiError üzerinden gelen envelope
    if (err instanceof ApiError) {
      const payload = err.data as StandardEnvelope<any> | undefined;
      const backendError: BackendFieldError | undefined = (payload as any)?.error || (err.data as any)?.error;

      // Tekil field hatası
      if (backendError) {
        const field = (backendError.field as keyof TFieldValues) || (defaultField as any);
        const message = mapCodes[backendError.code] || backendError.message || 'Geçersiz değer';
        form.setError(field, { type: backendError.code, message });
      }

      // Çoklu doğrulama detayları (ör: details.validation = [{ field, message, code }])
      const validations = (backendError?.details as any)?.validation;
      if (Array.isArray(validations)) {
        validations.forEach((v: any) => {
          const field = (v.field as keyof TFieldValues) || (defaultField as any);
          const message = mapCodes[v.code] || v.message || 'Geçersiz değer';
          form.setError(field, { type: v.code, message });
        });
      }
      return;
    }

    // Generic JS Error
    if (err instanceof Error) {
      form.setError(defaultField as any, { type: 'GENERAL', message: err.message });
      return;
    }

    // Bilinmeyen tip
    form.setError(defaultField as any, { type: 'UNKNOWN', message: 'Beklenmeyen hata oluştu.' });
  }

  /** Temizle (submit öncesi veya route değişiminde) */
  function clearErrors(fields?: (keyof TFieldValues)[]) {
    if (fields && fields.length) {
      fields.forEach(f => form.clearErrors(f));
    } else {
      form.clearErrors();
    }
  }

  return { applyApiError, clearErrors };
}

/** Örnek kodlar için hazır mapping */
export const DEFAULT_ERROR_CODE_MAP: Record<string, string> = {
  CARI_DUPLICATE_CODE: 'Bu cari kodu zaten kullanılıyor.',
  MOTORBOT_DUPLICATE_CODE: 'Motorbot kodu benzersiz olmalı.',
  PARAMETRE_DUPLICATE_CODE: 'Parametre kodu zaten mevcut.',
  DATABASE_ERROR: 'Veritabanı hatası, lütfen tekrar deneyin.',
  INTERNAL_SERVER_ERROR: 'Sunucu hatası oluştu.',
};
