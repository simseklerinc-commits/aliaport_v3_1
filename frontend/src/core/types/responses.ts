// Aliaport Frontend Standard Response Types
// Backend response helpers: success_response, error_response, paginated_response
// Tüm endpointler ISO8601 timestamp içerir; error detayları backend ErrorCode pattern'ine uyar.

export interface StandardMeta {
  timestamp: string; // ISO8601
  request_id?: string; // Middleware ile eklenen ID yakalanabilir
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: StandardMeta;
}

export interface ErrorDetail {
  code: string; // ErrorCode enum string representation
  message: string; // Human readable explanation
  extra?: Record<string, unknown>; // Optional contextual fields
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
  meta: StandardMeta;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta: StandardMeta;
}

// Type guards
export function isErrorResponse(r: unknown): r is ErrorResponse {
  return !!r && typeof r === 'object' && (r as any).success === false && 'error' in (r as any);
}

export function isPaginatedResponse<T = unknown>(r: unknown): r is PaginatedResponse<T> {
  return !!r && typeof r === 'object' && (r as any).success === true && 'pagination' in (r as any);
}

export function isSuccessResponse<T = unknown>(r: unknown): r is SuccessResponse<T> {
  return !!r && typeof r === 'object' && (r as any).success === true && !('pagination' in (r as any));
}

// Unified discriminated union
export type ApiResponse<T = unknown> = SuccessResponse<T> | PaginatedResponse<T> | ErrorResponse;
