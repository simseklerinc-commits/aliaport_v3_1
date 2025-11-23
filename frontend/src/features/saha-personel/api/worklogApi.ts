/**
 * SAHA PERSONEL API CLIENT
 * WorkLog API endpoints
 */

const BASE_URL = 'http://localhost:8000/api/worklog';

export interface WorkLog {
  id?: number;
  work_order_id?: number;
  sefer_id?: number;
  motorbot_id?: number;
  hizmet_kodu?: string;
  personnel_name: string;
  time_start: string;
  time_end?: string;
  duration_minutes?: number;
  service_type?: string;
  quantity?: number;
  unit?: string;
  description?: string;
  notes?: string;
  photo_url?: string;
  is_processed?: number;
  is_approved?: number;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkLogStats {
  total_logs: number;
  pending_approval: number;
  approved: number;
  total_hours: number;
  by_personnel: Record<string, { count: number; hours: number }>;
  by_service_type: Record<string, { count: number; hours: number }>;
}

export const worklogApi = {
  // Tüm worklog kayıtlarını getir
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    work_order_id?: number;
    sefer_id?: number;
    personnel_name?: string;
    is_approved?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<WorkLog[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    const response = await fetch(`${BASE_URL}/?${queryParams}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // Tekil worklog kaydı getir
  getById: async (id: number): Promise<WorkLog> => {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // İstatistikler
  getStats: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<WorkLogStats> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    const response = await fetch(`${BASE_URL}/stats?${queryParams}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // Yeni worklog kaydı oluştur
  create: async (data: Omit<WorkLog, 'id' | 'created_at' | 'updated_at'>): Promise<WorkLog> => {
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // Worklog kaydını güncelle
  update: async (id: number, data: Partial<WorkLog>): Promise<WorkLog> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // Worklog kaydını sil
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  },

  // Worklog kaydını onayla
  approve: async (id: number, approved_by: string): Promise<{ message: string; log: WorkLog }> => {
    const response = await fetch(`${BASE_URL}/${id}/approve?approved_by=${encodeURIComponent(approved_by)}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
};
