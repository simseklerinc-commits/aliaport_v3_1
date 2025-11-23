/**
 * HIZMET MODULE - Custom React Hooks
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { hizmetApi } from '../api/hizmetApi';
import type { Hizmet, HizmetCreate, HizmetUpdate } from '../types/hizmet.types';

export function useHizmetList() {
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHizmetler = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hizmetApi.getAll();
      setHizmetler(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hizmet listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHizmetler();
  }, []);

  return {
    hizmetler,
    loading,
    error,
    refetch: fetchHizmetler,
  };
}

export function useHizmet(id: number | null) {
  const [hizmet, setHizmet] = useState<Hizmet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setHizmet(null);
      return;
    }

    const fetchHizmet = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await hizmetApi.getById(id);
        setHizmet(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Hizmet yüklenemedi';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHizmet();
  }, [id]);

  return { hizmet, loading, error };
}

export function useHizmetMutations() {
  const [loading, setLoading] = useState(false);

  const createHizmet = async (data: HizmetCreate): Promise<Hizmet | null> => {
    try {
      setLoading(true);
      const newHizmet = await hizmetApi.create(data);
      toast.success('Hizmet başarıyla oluşturuldu');
      return newHizmet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hizmet oluşturulamadı';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateHizmet = async (id: number, data: HizmetUpdate): Promise<Hizmet | null> => {
    try {
      setLoading(true);
      const updatedHizmet = await hizmetApi.update(id, data);
      toast.success('Hizmet başarıyla güncellendi');
      return updatedHizmet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hizmet güncellenemedi';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteHizmet = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      await hizmetApi.delete(id);
      toast.success('Hizmet başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hizmet silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createHizmet,
    updateHizmet,
    deleteHizmet,
    loading,
  };
}

export function useHizmetSearch() {
  const [results, setResults] = useState<Hizmet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await hizmetApi.search(query);
      setResults(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Arama yapılamadı';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    search,
  };
}
