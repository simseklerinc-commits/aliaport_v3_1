// API CLIENT - Base fetch wrapper with error handling
// Tüm API çağrıları buradan geçer

// Replit deployment için otomatik URL tespiti
const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Replit ortamında window.location.origin kullan
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  // Fallback (sadece SSR veya test ortamları için)
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface UnwrappedPaginated<T> {
  items: T[];
  pagination: PaginationMeta;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // URL oluştur
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Query params ekle
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // Default headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Response body'yi oku
    const contentType = response.headers.get('content-type');
    const raw = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    // HTTP status bazlı hata
    if (!response.ok) {
      const detail = typeof raw === 'object' && raw ? (raw.detail || raw.message || raw.error?.message) : `Request failed with status ${response.status}`;
      throw new ApiError(detail, response.status, raw);
    }

    // Standart envelope tespiti (backend success_response / paginated_response)
    if (raw && typeof raw === 'object' && 'success' in raw) {
      const envelope = raw as any; // StandardEnvelope
      if (!envelope.success) {
        const errMsg = envelope.error?.message || envelope.message || 'İşlem başarısız';
        throw new ApiError(errMsg, response.status, envelope.error || envelope);
      }
      // Paginated
      if (envelope.pagination && Array.isArray(envelope.data)) {
        const p = envelope.pagination;
        const totalPages = p.page_size > 0 ? Math.ceil(p.total / p.page_size) : 1;
        const mapped = {
          items: envelope.data,
          total: p.total,
          page: p.page,
          page_size: p.page_size,
          total_pages: totalPages,
          _message: envelope.message
        };
        return mapped as unknown as T; // Çağıran taraf PaginatedResponse<TItem> bekliyor
      }
      // Normal veri
      return envelope.data as T;
    }

    // Eski format (doğrudan obje/array)
    return raw as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network hatası
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

// HTTP Methods
export const api = {
  get: function<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post: function<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put: function<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch: function<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: function<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
  // Ham envelope isteyen özel kullanım için (exception ekranları vs.)
  raw: function(endpoint: string, options?: RequestOptions) {
    return request<any>(endpoint, { ...options, method: (options?.method as any) || 'GET' });
  }
};

// Alias for backward compatibility
export const apiClient = api;

// Mock mode için helper
export const setMockMode = (enabled: boolean) => {
  if (enabled) {
    console.warn('🔶 API Mock Mode Enabled - Using static data');
  }
};