/**
 * UNIVERSAL API WRAPPER
 * Backend'den gelen standart JSON zarfını parse eden wrapper
 */

interface StandardApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
  };
}

/**
 * Backend response'unu parse eder ve data'yı döndürür
 */
export function parseApiResponse<T>(response: any): T {
  // Eğer response zaten bir array ise, direkt döndür
  if (Array.isArray(response)) {
    return response as T;
  }

  // Eğer response bir object ise ve data field'ı varsa, data'yı döndür
  if (response && typeof response === 'object') {
    if (response.data !== undefined) {
      return response.data as T;
    }
  }

  // Fallback: response'u olduğu gibi döndür
  return response as T;
}

/**
 * Frontend'de tek bir yerde API response parsing yapılır
 * Tüm modüller bu fonksiyonu kullanarak consistent davranış sağlar
 */
export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return parseApiResponse<T>(data);
  },

  async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return parseApiResponse<T>(data);
  },

  async put<T>(url: string, body: any): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return parseApiResponse<T>(data);
  },

  async delete(url: string): Promise<void> {
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  },
};
