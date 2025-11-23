// MOTORBOT API - Motorbot master data + barınma contract
// GET, POST, PUT, DELETE işlemleri
// motorbot + barinma_contract ilişkisi

import { api } from './client';
import type { 
  Motorbot, 
  BarinmaContract,
  MotorbotWithContract,
  PaginatedResponse 
} from '../types/database';

// ============================================
// MOTORBOT ENDPOINTS
// ============================================

export const motorbotApi = {
  // Tüm motorbotları getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    owner_cari_id?: number;
    is_active?: boolean;
  }) => 
    api.get<PaginatedResponse<Motorbot>>('/motorbot', { params }),

  // Tek motorbot detayı
  getById: (id: number) => 
    api.get<Motorbot>(`/motorbot/${id}`),

  // Motorbot kodu ile getir
  getByCode: (code: string) => 
    api.get<Motorbot>(`/motorbot/code/${code}`),

  // Motorbot + Contract birlikte
  getWithContract: (id: number) => 
    api.get<MotorbotWithContract>(`/motorbot/${id}/with-contract`),

  // Cari'ye ait motorbotlar
  getByCari: (cariId: number) => 
    api.get<Motorbot[]>(`/motorbot/cari/${cariId}`),

  // Yeni motorbot oluştur
  create: (data: Omit<Motorbot, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Motorbot>('/motorbot', data),

  // Motorbot güncelle
  update: (id: number, data: Partial<Motorbot>) => 
    api.put<Motorbot>(`/motorbot/${id}`, data),

  // Motorbot sil
  delete: (id: number) => 
    api.delete<void>(`/motorbot/${id}`),

  // Motorbot durumunu değiştir
  updateStatus: (id: number, is_active: boolean) => 
    api.patch<Motorbot>(`/motorbot/${id}/status`, { is_active }),
};

// ============================================
// BARINMA CONTRACT ENDPOINTS
// ============================================

export const barinmaApi = {
  // Tüm kontratları getir
  getAllContracts: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    motorbot_id?: number;
  }) => 
    api.get<PaginatedResponse<BarinmaContract>>('/barinma-contract', { params }),

  // Tek kontrat detayı
  getContractById: (id: number) => 
    api.get<BarinmaContract>(`/barinma-contract/${id}`),

  // Motorbot'a ait aktif kontrat
  getActiveContract: (motorbotId: number) => 
    api.get<BarinmaContract>(`/motorbot/${motorbotId}/active-contract`),

  // Yeni kontrat oluştur
  createContract: (data: Omit<BarinmaContract, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<BarinmaContract>('/barinma-contract', data),

  // Kontrat güncelle
  updateContract: (id: number, data: Partial<BarinmaContract>) => 
    api.put<BarinmaContract>(`/barinma-contract/${id}`, data),

  // Kontrat sil
  deleteContract: (id: number) => 
    api.delete<void>(`/barinma-contract/${id}`),

  // Kontrat durumunu değiştir
  updateContractStatus: (id: number, status: string) => 
    api.patch<BarinmaContract>(`/barinma-contract/${id}/status`, { status }),
};
