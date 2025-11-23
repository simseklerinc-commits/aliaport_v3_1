/**
 * SHARED TYPES
 * Tüm modüllerde kullanılan ortak tipler
 */

export interface ApiError {
  detail: string;
  status?: number;
}

// Response Meta (backend timestamp + request_id)
export interface ResponseMeta {
  timestamp: string;
  request_id?: string;
}

// Success Response (standardized backend format)
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

// Paginated Response (standardized backend format with pagination metadata)
export interface PaginatedApiResponse<T = unknown> {
  success: true;
  data: T[];
  message?: string;
  pagination: PaginationMeta;
  timestamp: string; // ISO8601 datetime
}

// Pagination metadata (backend structure)
export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Error Response (standardized backend format)
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    extra?: Record<string, unknown>;
  };
  meta: ResponseMeta;
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

