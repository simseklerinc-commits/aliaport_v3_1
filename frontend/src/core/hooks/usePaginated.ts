import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../api/client";
import { PaginatedResponse, isPaginatedResponse, isErrorResponse } from "../types/responses";

interface UsePaginatedOptions<Q extends Record<string, any>> {
  pageSize?: number;
  initialPage?: number;
  query?: Q;
  enabled?: boolean;
  dependencies?: any[];
}

interface UsePaginatedState<T> {
  loading: boolean;
  items: T[];
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  requestId?: string;
  setPage: (p: number) => void;
  refetch: () => Promise<void>;
}

export function usePaginated<T = unknown, Q extends Record<string, any> = Record<string, any>>(
  path: string,
  options: UsePaginatedOptions<Q> = {}
): UsePaginatedState<T> {
  const {
    pageSize = 20,
    initialPage = 1,
    query,
    enabled = true,
    dependencies = []
  } = options;

  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>(undefined);

  const fetchPage = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    const response = await apiClient.request<T>(path, {
      query: { ...(query || {}), page, page_size: pageSize }
    });

    if (isErrorResponse(response)) {
      setError(response.error.message);
      setItems([]);
      setRequestId(response.meta.request_id);
    } else if (isPaginatedResponse<T>(response)) {
      setItems(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
      setHasNext(response.pagination.has_next);
      setHasPrev(response.pagination.has_prev);
      setRequestId(response.meta.request_id);
    } else {
      // Beklenmeyen - normal success
      setItems((response as any).data ? [response as any].data : []);
      setRequestId((response as any).meta?.request_id);
    }
    setLoading(false);
  }, [path, page, pageSize, JSON.stringify(query), enabled]);

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, ...dependencies]);

  return {
    loading,
    items,
    error,
    page,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,
    requestId,
    setPage,
    refetch: fetchPage
  };
}
