/**
 * KURLAR HOOKS - Custom hooks for exchange rate management
 */

import { useState, useEffect, useCallback } from 'react';
import { kurlarApi } from '../api/kurlarApi';
import type { ExchangeRate, ExchangeRateCreate, ExchangeRateUpdate } from '../types/kurlar.types';
import { toast } from 'sonner';

export function useKurlarList() {
  const [kurlarList, setKurlarList] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKurlarList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await kurlarApi.getAll();
      setKurlarList(response.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kur listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKurlarList();
  }, [fetchKurlarList]);

  return {
    kurlarList,
    isLoading,
    error,
    refetch: fetchKurlarList,
  };
}

export function useKurlarMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const createKur = async (data: ExchangeRateCreate): Promise<boolean> => {
    try {
      setIsCreating(true);
      await kurlarApi.create(data);
      toast.success('Kur kaydı başarıyla oluşturuldu');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kur oluşturulamadı';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateKur = async (id: number, data: ExchangeRateUpdate): Promise<boolean> => {
    try {
      setIsUpdating(true);
      await kurlarApi.update(id, data);
      toast.success('Kur kaydı başarıyla güncellendi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kur güncellenemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteKur = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await kurlarApi.delete(id);
      toast.success('Kur kaydı başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kur silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchTCMB = async (): Promise<boolean> => {
    try {
      setIsFetching(true);
      await kurlarApi.fetchTCMB();
      toast.success('TCMB kurları başarıyla güncellendi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'TCMB kurları alınamadı';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsFetching(false);
    }
  };

  return {
    createKur,
    updateKur,
    deleteKur,
    fetchTCMB,
    isCreating,
    isUpdating,
    isDeleting,
    isFetching,
  };
}
