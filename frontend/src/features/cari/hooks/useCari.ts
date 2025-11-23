/**
 * CARI MODULE - React Hooks
 * Cari CRUD operasyonları için custom hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { cariApi } from '../api/cariApi';
import type { Cari, CariCreate, CariUpdate } from '../types/cari.types';
import { toast } from 'sonner';

/**
 * Tüm cari kayıtlarını getir
 */
export function useCariList() {
  const [cariList, setCariList] = useState<Cari[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCariList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await cariApi.getAll();
      setCariList(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cari listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCariList();
  }, [fetchCariList]);

  return {
    cariList,
    isLoading,
    error,
    refetch: fetchCariList,
  };
}

/**
 * Tek bir cari kaydı getir
 */
export function useCari(id: number | null) {
  const [cari, setCari] = useState<Cari | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setCari(null);
      return;
    }

    const fetchCari = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await cariApi.getById(id);
        setCari(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Cari yüklenemedi';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCari();
  }, [id]);

  return {
    cari,
    isLoading,
    error,
  };
}

/**
 * Cari CRUD operasyonları
 */
export function useCariMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createCari = useCallback(async (data: CariCreate): Promise<Cari | null> => {
    try {
      setIsCreating(true);
      const newCari = await cariApi.create(data);
      toast.success('Cari başarıyla oluşturuldu');
      return newCari;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cari oluşturulamadı';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateCari = useCallback(async (id: number, data: CariUpdate): Promise<Cari | null> => {
    try {
      setIsUpdating(true);
      const updatedCari = await cariApi.update(id, data);
      toast.success('Cari başarıyla güncellendi');
      return updatedCari;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cari güncellenemedi';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteCari = useCallback(async (id: number): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await cariApi.delete(id);
      toast.success('Cari başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cari silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    createCari,
    updateCari,
    deleteCari,
    isCreating,
    isUpdating,
    isDeleting,
  };
}

/**
 * Cari arama
 */
export function useCariSearch() {
  const [results, setResults] = useState<Cari[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const search = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const data = await cariApi.search(query);
      setResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Arama başarısız';
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setResults([]);
  }, []);

  return {
    results,
    isSearching,
    searchQuery,
    search,
    clearSearch,
  };
}
