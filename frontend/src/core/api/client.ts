import { ApiResponse, ErrorResponse, isErrorResponse } from "../types/responses";
import { tokenStorage } from "@/features/auth/utils/tokenStorage";
import { authService } from "@/features/auth/services/authService";

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

const API_BASE = "/api"; // Vite proxy ile backend'e gider

function buildQuery(query?: Record<string, string | number | boolean | undefined>) {
  if (!query) return "";
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return params ? `?${params}` : "";
}

export class ApiClient {
  constructor(private baseUrl: string = API_BASE) {}

  /**
   * Generic request wrapper
   */
  async request<T = unknown>(path: string, options: RequestOptions = {}, retry: boolean = false): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}${buildQuery(options.query)}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    // Inject Authorization header if access token present and not expired
    const accessToken = tokenStorage.getAccessToken();
    if (!options.skipAuth && accessToken && !tokenStorage.isTokenExpired()) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const init: RequestInit = {
      method: options.method || (options.body ? "POST" : "GET"),
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      credentials: "include"
    };

    let response: Response;
    let data: unknown;
    try {
      response = await fetch(url, init);
    } catch (err: any) {
      const networkErr = this.toNetworkError(err);
      this.captureErrorMeta(networkErr);
      return networkErr;
    }

    const requestId = response.headers.get("x-request-id") || undefined;

    try {
      data = await response.json();
    } catch (_) {
      const parseErr = this.toParseError(requestId);
      this.captureErrorMeta(parseErr);
      return parseErr;
    }

    // Handle 401 - attempt refresh once
    if (response.status === 401 && !retry && !options.skipAuth) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshed = await authService.refreshToken(refreshToken);
          tokenStorage.saveTokens(refreshed.access_token, refreshed.refresh_token, refreshed.expires_in);
          return this.request<T>(path, options, true); // retry once
        } catch {
          tokenStorage.clearTokens();
        }
      }
    }

    if (!response.ok) {
      const normalized = this.normalizeErrorShape(data, requestId, response.status);
      this.captureErrorMeta(normalized);
      return normalized;
    }

    const successPayload = this.attachRequestIdIfMissing<T>(data, requestId) as ApiResponse<T>;
    this.captureSuccessMeta(successPayload);
    return successPayload;
  }

  /**
   * HTTP GET request
   */
  async get<T = unknown>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET', query });
  }

  /**
   * HTTP POST request
   */
  async post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body });
  }

  /**
   * HTTP PUT request
   */
  async put<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  /**
   * HTTP DELETE request
   */
  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private normalizeErrorShape(payload: any, requestId?: string, status?: number): ErrorResponse {
    if (isErrorResponse(payload)) {
      return {
        ...payload,
        meta: { ...payload.meta, request_id: payload.meta.request_id || requestId || payload.meta.request_id }
      };
    }
    if (payload && payload.detail && isErrorResponse(payload.detail)) {
      const inner = payload.detail;
      return {
        ...inner,
        meta: { ...inner.meta, request_id: inner.meta.request_id || requestId }
      };
    }
    return {
      success: false,
      error: {
        code: "CLIENT_UNHANDLED_ERROR",
        message: typeof payload?.detail === "string" ? payload.detail : "İşlem sırasında hata oluştu",
        extra: { status, raw: payload }
      },
      meta: { timestamp: new Date().toISOString(), request_id: requestId }
    };
  }

  private toNetworkError(err: any): ErrorResponse {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Sunucuya erişilemedi",
        extra: { message: err?.message }
      },
      meta: { timestamp: new Date().toISOString() }
    };
  }

  private toParseError(requestId?: string): ErrorResponse {
    return {
      success: false,
      error: {
        code: "PARSE_ERROR",
        message: "Beklenmeyen yanıt formatı",
        extra: {}
      },
      meta: { timestamp: new Date().toISOString(), request_id: requestId }
    };
  }

  private attachRequestIdIfMissing<T = unknown>(payload: any, requestId?: string): ApiResponse<T> {
    if (!payload || typeof payload !== "object") {
      return {
        success: true,
        data: payload as T,
        meta: { timestamp: new Date().toISOString(), request_id: requestId }
      };
    }
    if ("meta" in payload && typeof (payload as any).meta === "object") {
      const meta = (payload as any).meta;
      return { ...(payload as any), meta: { ...meta, request_id: meta.request_id || requestId } } as ApiResponse<T>;
    }
    return {
      success: true,
      data: payload as T,
      meta: { timestamp: new Date().toISOString(), request_id: requestId }
    };
  }

  private captureSuccessMeta<T>(resp: ApiResponse<T>) {
    try {
      const { useRequestMetaStore } = require('../state/requestMetaStore');
      useRequestMetaStore.getState().setRequestId(resp.meta?.request_id);
      useRequestMetaStore.getState().setErrorCode(undefined);
    } catch { /* ignore dynamic require issues */ }
  }

  private captureErrorMeta(resp: ErrorResponse) {
    try {
      const { useRequestMetaStore } = require('../state/requestMetaStore');
      useRequestMetaStore.getState().setRequestId(resp.meta?.request_id);
      useRequestMetaStore.getState().setErrorCode(resp.error?.code);
    } catch { /* ignore */ }
  }
}

export const apiClient = new ApiClient();
