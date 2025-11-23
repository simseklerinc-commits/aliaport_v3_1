/**
 * TARIFE HOOKS - Custom hooks for price list management
 * Provides data fetching and mutation logic for Tarife module
 */

import { useState, useEffect, useCallback } from 'react';
import { tarifeApi } from '../api/tarifeApi';
import type { PriceList, PriceListCreate, PriceListUpdate } from '../types/tarife.types';
import { toast } from 'sonner';

/**
 * Hook for fetching price list data
 */
export function useTarifeList() {
  const [tarifeList, setTarifeList] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTarifeList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await tarifeApi.getAll();
      setTarifeList(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tarife listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTarifeList();
  }, [fetchTarifeList]);

  return {
    tarifeList,
    isLoading,
    error,
    refetch: fetchTarifeList,
  };
}

/**
 * Hook for price list mutations (create, update, delete)
 */
export function useTarifeMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createTarife = async (data: PriceListCreate): Promise<boolean> => {
    try {
      setIsCreating(true);
      await tarifeApi.create(data);
      toast.success('Tarife başarıyla oluşturuldu');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tarife oluşturulamadı';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateTarife = async (id: number, data: PriceListUpdate): Promise<boolean> => {
    try {
      setIsUpdating(true);
      await tarifeApi.update(id, data);
      toast.success('Tarife başarıyla güncellendi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tarife güncellenemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteTarife = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await tarifeApi.delete(id);
      toast.success('Tarife başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tarife silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    createTarife,
    updateTarife,
    deleteTarife,
    isCreating,
    isUpdating,
    isDeleting,
  };
}

/**
 * Hook for fetching single price list by ID
 */
export function useTarifeById(id: number | null) {
  const [tarife, setTarife] = useState<PriceList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setTarife(null);
      return;
    }

    const fetchTarife = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await tarifeApi.getById(id);
        setTarife(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Tarife yüklenemedi';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTarife();
  }, [id]);

  return { tarife, isLoading, error };
}
