/**
 * SHARED TYPES
 * Tüm modüllerde kullanılan ortak tipler
 */

export interface ApiError {
  detail: string;
  status?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BaseEntity {
  Id: number;
  IsActive?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
}
