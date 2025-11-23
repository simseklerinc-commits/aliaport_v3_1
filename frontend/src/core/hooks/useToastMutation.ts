import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import type { ErrorResponse } from '../types/responses';
import { useToastStore } from '../state/toastStore';

interface ToastMessages<TData, TVariables> {
  success?: string | ((data: TData, variables: TVariables) => string);
  error?: string | ((error: ErrorResponse, variables: TVariables) => string);
  loadingMessage?: string | ((variables: TVariables) => string); // future spinner toast
}

interface UseToastMutationOptions<TData, TVariables, TContext> extends UseMutationOptions<TData, ErrorResponse, TVariables, TContext> {
  messages?: ToastMessages<TData, TVariables>;
  autoDismissMs?: number;
}

/**
 * useToastMutation
 * React Query useMutation için standart toast pattern'i uygular.
 * - Başarı: success toast (varsayılan mesaj veya dinamik)
 * - Hata: error toast (backend error.message veya override)
 * Mesaj üretici fonksiyonlar sayesinde context'e göre özel mesaj döndürülebilir.
 */
export function useToastMutation<TData, TVariables = void, TContext = unknown>(
  opts: UseToastMutationOptions<TData, TVariables, TContext>
) {
  const { add } = useToastStore();
  const { messages, autoDismissMs = 4000, ...mutationOptions } = opts;

  return useMutation<TData, ErrorResponse, TVariables, TContext>({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      if (messages?.success) {
        const msg = typeof messages.success === 'function' ? messages.success(data, variables) : messages.success;
        add({ type: 'success', message: msg, autoDismissMs });
      }
      mutationOptions.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const msg = messages?.error
        ? typeof messages.error === 'function'
          ? messages.error(error, variables)
          : messages.error
        : error.error?.message || 'İşlem sırasında beklenmeyen bir hata oluştu.';
      add({ type: 'error', message: msg, autoDismissMs });
      mutationOptions.onError?.(error, variables, context);
    }
  });
}

/** Shortcut yardımcıları */
export const toastMessages = {
  create: (entity: string) => ({ success: `${entity} oluşturuldu.`, error: `${entity} oluşturulamadı.` }),
  update: (entity: string) => ({ success: `${entity} güncellendi.`, error: `${entity} güncellenemedi.` }),
  delete: (entity: string) => ({ success: `${entity} silindi.`, error: `${entity} silinemedi.` }),
};