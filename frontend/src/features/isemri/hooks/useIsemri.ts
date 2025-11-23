/**
 * İŞ EMRİ HOOKS - Custom hooks for work order management
 */

import { useState, useEffect, useCallback } from 'react';
import { isemriApi } from '../api/isemriApi';
import type { WorkOrder, WorkOrderCreate, WorkOrderUpdate, WorkOrderStats } from '../types/isemri.types';
import { toast } from 'sonner';

export function useIsemriList() {
  const [isemriList, setIsemriList] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIsemriList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await isemriApi.getAll();
      setIsemriList(response.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İş emri listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIsemriList();
  }, [fetchIsemriList]);

  return {
    isemriList,
    isLoading,
    error,
    refetch: fetchIsemriList,
  };
}

export function useIsemri(id?: number) {
  const [isemri, setIsemri] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIsemri = useCallback(async (woId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await isemriApi.getById(woId);
      setIsemri(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İş emri yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchIsemri(id);
    }
  }, [id, fetchIsemri]);

  return {
    isemri,
    isLoading,
    error,
    refetch: id ? () => fetchIsemri(id) : undefined,
  };
}

export function useIsemriMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createIsemri = async (data: WorkOrderCreate): Promise<boolean> => {
    try {
      setIsCreating(true);
      await isemriApi.create(data);
      toast.success('İş emri başarıyla oluşturuldu');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İş emri oluşturulamadı';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateIsemri = async (id: number, data: WorkOrderUpdate): Promise<boolean> => {
    try {
      setIsUpdating(true);
      await isemriApi.update(id, data);
      toast.success('İş emri başarıyla güncellendi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İş emri güncellenemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteIsemri = async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await isemriApi.delete(id);
      toast.success('İş emri başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İş emri silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    createIsemri,
    updateIsemri,
    deleteIsemri,
    isCreating,
    isUpdating,
    isDeleting,
  };
}

export function useIsemriStats() {
  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await isemriApi.getStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'İstatistikler yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
