/**
 * WORK ORDER PERSON API HOOK
 * 
 * İş emri kişi yönetimi için API işlemleri
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

interface WorkOrderPerson {
  Id: number;
  WorkOrderId: number;
  WorkOrderItemId?: number;
  FullName: string;
  TcKimlik?: string;  // ✅ Backend field name
  Pasaport?: string;   // ✅ Backend field name
  Nationality?: string;
  Phone?: string;
  IdentityDocumentId?: number;
  IdentityPhotoUrl?: string;
  SecurityNotes?: string;
  SecurityApproved?: boolean;  // ✅ Backend field
  ApprovalDate?: string;       // ✅ Backend field
  CreatedAt: string;
  UpdatedAt?: string;
}

export function useWorkOrderPersons(workOrderId: number) {
  const [persons, setPersons] = useState<WorkOrderPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = async () => {
    if (!workOrderId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/work-order/${workOrderId}/persons`
      );
      // Backend success_response formatı: { success: true, message: "", data: { persons: [...] } }
      const personsData = response.data.data?.persons || response.data.data || response.data;
      setPersons(Array.isArray(personsData) ? personsData : []);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Kişiler yüklenirken hata oluştu';
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail.message || 'Hata oluştu';
      setError(errorMsg);
      console.error('Fetch persons error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addPerson = async (person: Omit<WorkOrderPerson, 'Id' | 'CreatedAt'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/work-order-person`,
        person
      );
      const newPerson = response.data.data;
      setPersons([...persons, newPerson]);
      return newPerson;
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Kişi eklenirken hata oluştu';
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail.message || 'Hata oluştu';
      setError(errorMsg);
      console.error('Add person error:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePerson = async (personId: number, updates: Partial<WorkOrderPerson>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/work-order-person/${personId}`,
        updates
      );
      const updatedPerson = response.data.data;
      setPersons(persons.map(p => p.Id === personId ? updatedPerson : p));
      return updatedPerson;
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Kişi güncellenirken hata oluştu';
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail.message || 'Hata oluştu';
      setError(errorMsg);
      console.error('Update person error:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePerson = async (personId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(
        `${API_BASE_URL}/work-order-person/${personId}`
      );
      setPersons(persons.filter(p => p.Id !== personId));
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Kişi silinirken hata oluştu';
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail.message || 'Hata oluştu';
      setError(errorMsg);
      console.error('Delete person error:', err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, [workOrderId]);

  return {
    persons,
    isLoading,
    error,
    addPerson,
    updatePerson,
    deletePerson,
    refetch: fetchPersons,
  };
}
