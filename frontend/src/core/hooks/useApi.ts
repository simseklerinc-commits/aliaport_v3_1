import { useEffect, useState, useRef, useCallback } from "react";
import { apiClient } from "../api/client";
import { ApiResponse, isErrorResponse } from "../types/responses";

interface UseApiOptions<Q extends Record<string, any> | undefined> {
  immediate?: boolean;
  query?: Q;
  method?: string;
  body?: any;
  enabled?: boolean;
  dependencies?: any[];
}

interface UseApiState<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
  raw: ApiResponse<T> | null;
  requestId?: string;
  refetch: () => Promise<void>;
}

export function useApi<T = unknown, Q extends Record<string, any> | undefined = undefined>(
  path: string,
  options: UseApiOptions<Q> = {}
): UseApiState<T> {
  const {
    immediate = true,
    query,
    method,
    body,
    enabled = true,
    dependencies = []
  } = options;

  const [loading, setLoading] = useState(immediate);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<ApiResponse<T> | null>(null);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    const response = await apiClient.request<T>(path, {
      method,
      body,
      query,
      signal: controller.signal
    });

    setRaw(response);
    if (isErrorResponse(response)) {
      setError(response.error.message);
      setData(null);
      setRequestId(response.meta.request_id);
    } else if (response.success) {
      // paginated veya normal
      const d = (response as any).data;
      setData(d as T);
      setRequestId(response.meta.request_id);
    }
    setLoading(false);
  }, [path, method, body, JSON.stringify(query), enabled]);

  useEffect(() => {
    if (immediate && enabled) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate, enabled, ...dependencies]);

  return {
    loading,
    data,
    error,
    raw,
    requestId,
    refetch: execute
  };
}
