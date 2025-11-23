/**
 * PARAMETRELER HOOKS - Custom hooks for parameter management
 */

import { useState, useEffect, useCallback } from 'react';
import { parametrelerApi } from '../api/parametrelerApi';
import type { Parametre, ParametreCreate, ParametreUpdate } from '../types/parametreler.types';
import { toast } from 'sonner';

export function useParametrelerList() {
  const [parametrelerList, setParametrelerList] = useState<Parametre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParametrelerList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await parametrelerApi.getAll({ page_size: 200 }); // Tüm parametreleri getir
      setParametrelerList(response.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Parametre listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParametrelerList();
  }, [fetchParametrelerList]);

  return {
    parametrelerList,
    isLoading,
    error,
    refetch: fetchParametrelerList,
  };
}

export function useParametrelerMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createParametre = async (data: ParametreCreate): Promise<boolean> => {
    try {
      setIsCreating(true);
      await parametrelerApi.create(data);
      toast.success('Parametre başarıyla oluşturuldu');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Parametre oluşturulamadı';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateParametre = async (id: number, data: ParametreUpdate): Promise<boolean> => {
    try {
      setIsUpdating(true);
      await parametrelerApi.update(id, data);
      toast.success('Parametre başarıyla güncellendi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Parametre güncellenemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteParametre = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await parametrelerApi.delete(id);
      toast.success('Parametre başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Parametre silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (id: number): Promise<boolean> => {
    try {
      await parametrelerApi.toggleActive(id);
      toast.success('Parametre durumu değiştirildi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Durum değiştirilemedi';
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    createParametre,
    updateParametre,
    deleteParametre,
    toggleActive,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
