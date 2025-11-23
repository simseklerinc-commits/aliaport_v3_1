/**
 * BARINMA HOOKS - Custom hooks for accommodation contract management
 */

import { useState, useEffect, useCallback } from 'react';
import { barinmaApi } from '../api/barinmaApi';
import type { BarinmaContract, BarinmaContractCreate, BarinmaContractUpdate } from '../types/barinma.types';
import { toast } from 'sonner';

export function useBarinmaList() {
  const [barinmaList, setBarinmaList] = useState<BarinmaContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarinmaList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await barinmaApi.getAll();
      setBarinmaList(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Barınma listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBarinmaList();
  }, [fetchBarinmaList]);

  return {
    barinmaList,
    isLoading,
    error,
    refetch: fetchBarinmaList,
  };
}

export function useBarinmaMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createBarinma = async (data: BarinmaContractCreate): Promise<boolean> => {
    try {
      setIsCreating(true);
      await barinmaApi.create(data);
      toast.success('Barınma kontratı başarıyla oluşturuldu');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kontrat oluşturulamadı';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateBarinma = async (id: number, data: BarinmaContractUpdate): Promise<boolean> => {
    try {
      setIsUpdating(true);
      await barinmaApi.update(id, data);
      toast.success('Barınma kontratı başarıyla güncellendi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kontrat güncellenemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteBarinma = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await barinmaApi.delete(id);
      toast.success('Barınma kontratı başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kontrat silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    createBarinma,
    updateBarinma,
    deleteBarinma,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
