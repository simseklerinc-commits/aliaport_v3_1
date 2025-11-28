// frontend/src/features/portal/services/portalWorkOrderService.ts
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { PORTAL_API_BASE } from '../config';

export interface Hizmet {
  id: number;
  kod: string;
  ad: string;
  aciklama?: string;
  birim?: string;
  fiyat?: number;
  para_birimi?: string;
  grup_kod?: string;
}

export interface WorkOrderCreateRequest {
  CariId: number;
  CariCode: string;
  CariTitle: string;
  Type: 'HIZMET' | 'MOTORBOT' | 'BARINMA' | 'DIGER';
  ServiceCode?: string;
  ServiceCodes?: string[]; // Çoklu hizmet seçimi için
  Action?: string;
  Subject: string;
  Description?: string;
  Priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  PlannedStart?: string;
  PlannedEnd?: string;
  GateRequired?: boolean;
  SahaKayitYetkisi?: boolean;
  EmployeeIds?: number[]; // Firma çalışanları
  VehicleIds?: number[]; // Firma araçları
  PersonelList?: Array<{
    full_name: string;
    tc_kimlik?: string;
    pasaport?: string;
    nationality?: string;
    phone?: string;
  }>;
}

export interface WorkOrderResponse {
  Id: number;
  wo_number: string;
  cari_id: number;
  cari_code: string;
  cari_title: string;
  type: string;
  service_code?: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  planned_start?: string;
  planned_end?: string;
  created_at: string;
}

export interface PortalApiError extends Error {
  code?: string;
  details?: Record<string, unknown> | null;
  status?: number;
}

class PortalWorkOrderService {
  private getHeaders(): HeadersInit {
    const token = portalTokenStorage.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getHizmetler(search?: string): Promise<Hizmet[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await fetch(`${PORTAL_API_BASE}/hizmet-kartlari?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Hizmet listesi alınamadı');
    }

    const data = await response.json();
    return data.items || [];
  }

  async createWorkOrder(request: WorkOrderCreateRequest): Promise<WorkOrderResponse> {
    const response = await fetch(`${PORTAL_API_BASE}/work-orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error?.message || payload?.detail || 'Talep oluşturulamadı';
      const apiError = new Error(message) as PortalApiError;
      apiError.code = payload?.error?.code;
      apiError.details = payload?.error?.details || payload?.detail;
      apiError.status = response.status;
      throw apiError;
    }

    return response.json();
  }

  async getMyWorkOrders(): Promise<WorkOrderResponse[]> {
    const response = await fetch(`${PORTAL_API_BASE}/work-orders`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Talepler alınamadı');
    }

    return response.json();
  }

  async getWorkOrder(id: number): Promise<WorkOrderResponse> {
    const response = await fetch(`${PORTAL_API_BASE}/work-orders/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Talep detayı alınamadı');
    }

    return response.json();
  }
}

export const portalWorkOrderService = new PortalWorkOrderService();
