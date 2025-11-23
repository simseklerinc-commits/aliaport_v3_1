/**
 * GÜVENLİK API CLIENT
 * GateLog API endpoints
 */

const BASE_URL = 'http://localhost:8000/api/gatelog';

export interface GateLog {
  id?: number;
  work_order_id: number;
  motorbot_id?: number;
  entry_type: 'GIRIS' | 'CIKIS';
  wo_number: string;
  wo_status: string;
  security_personnel: string;
  is_approved: boolean;
  checklist_complete: boolean;
  checklist_data?: string;
  is_exception?: boolean;
  exception_reason?: string;
  photo_url?: string;
  notes?: string;
  gate_time?: string;
  created_at?: string;
}

export interface GateLogWithException extends GateLog {
  is_exception: true;
  exception_pin: string;
  exception_reason: string;
  exception_approved_by?: string;
}

export interface GateChecklistItem {
  id?: number;
  wo_type: string;
  item_label: string;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GateStats {
  total_entries: number;
  total_exits: number;
  approved_count: number;
  rejected_count: number;
  exception_count: number;
  by_wo_status: Record<string, number>;
  recent_logs: GateLog[];
}

export const gatelogApi = {
  // Tüm gate log kayıtlarını getir
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    entry_type?: 'GIRIS' | 'CIKIS';
    work_order_id?: number;
    is_approved?: boolean;
    is_exception?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<GateLog[]> => {
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

  // Tekil gate log kaydı getir
  getById: async (id: number): Promise<GateLog> => {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // İstatistikler
  getStats: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<GateStats> => {
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

  // Yeni gate log kaydı oluştur
  create: async (data: Omit<GateLog, 'id' | 'gate_time' | 'created_at'>): Promise<GateLog> => {
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // İstisna ile gate log kaydı oluştur
  createWithException: async (data: Omit<GateLogWithException, 'id' | 'gate_time' | 'created_at'>): Promise<GateLog> => {
    const response = await fetch(`${BASE_URL}/exception`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },

  // Gate log kaydını sil
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  },

  // Checklist items
  checklist: {
    // Tüm checklist item'ları getir
    getItems: async (params?: {
      wo_type?: string;
      is_active?: boolean;
    }): Promise<GateChecklistItem[]> => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      const response = await fetch(`${BASE_URL}/checklist/items?${queryParams}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },

    // Yeni checklist item oluştur
    createItem: async (data: Omit<GateChecklistItem, 'id' | 'created_at' | 'updated_at'>): Promise<GateChecklistItem> => {
      const response = await fetch(`${BASE_URL}/checklist/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },

    // Checklist item güncelle
    updateItem: async (id: number, data: Partial<GateChecklistItem>): Promise<GateChecklistItem> => {
      const response = await fetch(`${BASE_URL}/checklist/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },

    // Checklist item sil
    deleteItem: async (id: number): Promise<void> => {
      const response = await fetch(`${BASE_URL}/checklist/items/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    },

    // Varsayılan checklist item'larını oluştur
    seed: async (): Promise<{ message: string }> => {
      const response = await fetch(`${BASE_URL}/checklist/seed`, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
  },
};
