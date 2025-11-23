import { FieldErrors } from 'react-hook-form';
import { ErrorResponse } from '../types/responses';

/**
 * Backend ErrorCode → form field name mapping helper.
 * Bazı error kodları spesifik form alanlarına map edilebilir.
 */

const ERROR_FIELD_MAP: Record<string, string> = {
  CARI_DUPLICATE_CODE: 'CariKod',
  HIZMET_DUPLICATE_CODE: 'Kod',
  TARIFE_DUPLICATE_CODE: 'Kod',
  PARAMETRE_DUPLICATE_CODE: 'Kod',
  // Daha fazlası gerektiğinde eklenebilir
};

export function mapBackendErrorToField(errorResponse: ErrorResponse): { field?: string; message: string } {
  const code = errorResponse.error?.code;
  const message = errorResponse.error?.message || 'İşlem sırasında hata oluştu';
  
  if (!code) return { message };
  
  const field = ERROR_FIELD_MAP[code];
  return { field, message };
}

/**
 * Form error'ları merge ederken backend hatasını belirli alana enjekte et.
 */
export function injectBackendError<T extends Record<string, any>>(
  formErrors: FieldErrors<T>,
  backendError?: ErrorResponse
): FieldErrors<T> {
  if (!backendError) return formErrors;
  
  const mapped = mapBackendErrorToField(backendError);
  if (!mapped.field) return formErrors; // Generic error, form alanına ait değil
  
  return {
    ...formErrors,
    [mapped.field]: {
      type: 'backend',
      message: mapped.message
    }
  } as FieldErrors<T>;
}
