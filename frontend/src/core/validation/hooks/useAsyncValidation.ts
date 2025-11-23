import { useCallback, useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/client';
import { isErrorResponse } from '../../types/responses';

interface AsyncValidationOptions {
  debounceMs?: number;
  skipIfEmpty?: boolean;
}

/**
 * Async field validation hook - Backend'e uzaktan kontrol için.
 * Örnek kullanım: Unique Kod kontrolü (Cari, Hizmet, Tarife).
+ * 
+ * ✅ DEBOUNCE IMPLEMENTED: debounceMs parametresi ile setTimeout kullanılarak
+ * kullanıcı yazmayı bitirdikten sonra validation tetiklenir.
 */
export function useAsyncValidation<T = boolean>(
  validatorFn: (value: string) => Promise<T>,
  options: AsyncValidationOptions = {}
) {
  const { debounceMs = 500, skipIfEmpty = true } = options;
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Debounce için timeout ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Cleanup için abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Component unmount'da cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const validate = useCallback(
    async (value: string): Promise<boolean> => {
            // Önceki timeout'u iptal et
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
            }
      
            // Önceki request'i iptal et
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }

      if (skipIfEmpty && !value.trim()) {
        setValidationError(null);
          setIsValidating(false);
        return true;
      }

      // Debounce başladı - loading state göster
      setIsValidating(true);
      setValidationError(null);

      return new Promise((resolve) => {
        // Debounce timeout
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            // Yeni abort controller
            abortControllerRef.current = new AbortController();
            
            const result = await validatorFn(value);
            
            // Boolean dönüyorsa true = valid, false = invalid
            if (typeof result === 'boolean') {
              if (!result) {
                setValidationError('Geçersiz değer');
              }
              setIsValidating(false);
              resolve(result);
              return;
            }
            
            // Custom obje döndürülebilir: { valid: boolean, message?: string }
            const customResult = result as any;
            if (customResult && typeof customResult.valid === 'boolean') {
              if (!customResult.valid) {
                setValidationError(customResult.message || 'Geçersiz değer');
              }
              setIsValidating(false);
              resolve(customResult.valid);
              return;
            }
            
            setIsValidating(false);
            resolve(true);
          } catch (err: any) {
            // Abort edilmişse hata gösterme
            if (err?.name === 'AbortError') {
              resolve(false);
              return;
            }
            
            setValidationError('Doğrulama hatası');
            setIsValidating(false);
            resolve(false);
          }
        }, debounceMs);
      });
    },
    [validatorFn, skipIfEmpty, debounceMs]
  );

  return { validate, isValidating, validationError };
}

/**
 * Unique kod kontrolü için hazır validator factory.
 * Backend endpoint: GET /api/{module}/check-code?code={value}
 * Response: { exists: boolean }
 */
export function createUniqueCodeValidator(module: 'cari' | 'hizmet' | 'tarife' | 'parametre') {
  return async (code: string): Promise<{ valid: boolean; message?: string }> => {
    const resp = await apiClient.request<{ exists: boolean }>(`/${module}/check-code`, {
      query: { code }
    });

    if (isErrorResponse(resp)) {
      return { valid: false, message: 'Kontrol edilemedi' };
    }

    const data = Array.isArray(resp.data) ? resp.data[0] : resp.data;
    if (data && data.exists) {
      return { valid: false, message: 'Bu kod zaten kullanılıyor' };
    }

    return { valid: true };
  };
}
