/**
 * SHARED HOOKS - Generic API Hook
 * API çağrıları için generic hook
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      apiCall: () => Promise<T>,
      options: UseApiOptions = {}
    ): Promise<T | null> => {
      const {
        onSuccess,
        onError,
        successMessage,
        errorMessage,
        showToast = true,
      } = options;

      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        setData(result);

        if (showToast && successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : errorMessage || 'Bir hata oluştu';
        setError(errorMsg);

        if (showToast) {
          toast.error(errorMsg);
        }

        if (onError && err instanceof Error) {
          onError(err);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Liste verisi için özelleştirilmiş hook
 */
export function useApiList<T = any>(
  fetchFunction: () => Promise<T[]>,
  autoFetch = true
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFunction();
      setItems(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Liste yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  React.useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  return {
    items,
    loading,
    error,
    refetch: fetch,
  };
}

/**
 * Mutation işlemleri için özelleştirilmiş hook
 */
export function useApiMutation<TData = any, TVariables = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      mutationFn: (variables: TVariables) => Promise<TData>,
      variables: TVariables,
      options: UseApiOptions = {}
    ): Promise<TData | null> => {
      const {
        onSuccess,
        onError,
        successMessage,
        errorMessage,
        showToast = true,
      } = options;

      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(variables);

        if (showToast && successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : errorMessage || 'İşlem başarısız';
        setError(errorMsg);

        if (showToast) {
          toast.error(errorMsg);
        }

        if (onError && err instanceof Error) {
          onError(err);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    mutate,
    loading,
    error,
  };
}
