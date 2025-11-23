/**
 * MOTORBOT MODULE - Custom React Hooks
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motorbotApi } from '../api/motorbotApi';
import type { Motorbot, MotorbotCreate, MotorbotUpdate } from '../types/motorbot.types';

/**
 * Motorbot listesini getiren hook
 */
export function useMotorbotList() {
  const [motorботlar, setMotorbotlar] = useState<Motorbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMotorbotlar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await motorbotApi.getAll();
      setMotorbotlar(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Motorbot listesi yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorbotlar();
  }, []);

  return {
    motorботlar,
    loading,
    error,
    refetch: fetchMotorbotlar,
  };
}

/**
 * Tek motorbot getiren hook
 */
export function useMotorbot(id: number | null) {
  const [motorbot, setMotorbot] = useState<Motorbot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setMotorbot(null);
      return;
    }

    const fetchMotorbot = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await motorbotApi.getById(id);
        setMotorbot(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Motorbot yüklenemedi';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMotorbot();
  }, [id]);

  return { motorbot, loading, error };
}

/**
 * Motorbot CRUD işlemleri için hook
 */
export function useMotorbotMutations() {
  const [loading, setLoading] = useState(false);

  const createMotorbot = async (data: MotorbotCreate): Promise<Motorbot | null> => {
    try {
      setLoading(true);
      const newMotorbot = await motorbotApi.create(data);
      toast.success('Motorbot başarıyla oluşturuldu');
      return newMotorbot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Motorbot oluşturulamadı';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMotorbot = async (id: number, data: MotorbotUpdate): Promise<Motorbot | null> => {
    try {
      setLoading(true);
      const updatedMotorbot = await motorbotApi.update(id, data);
      toast.success('Motorbot başarıyla güncellendi');
      return updatedMotorbot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Motorbot güncellenemedi';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteMotorbot = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      await motorbotApi.delete(id);
      toast.success('Motorbot başarıyla silindi');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Motorbot silinemedi';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createMotorbot,
    updateMotorbot,
    deleteMotorbot,
    loading,
  };
}

/**
 * Motorbot arama hook'u
 */
export function useMotorbotSearch() {
  const [results, setResults] = useState<Motorbot[]>([]);
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
      const data = await motorbotApi.search(query);
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
