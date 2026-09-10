/**
 * Centralized API Client for KissanSetuAI Frontend
 * Connects to FastAPI Backend with configurable base URL and automatic JSON handling.
 */

export function normalizeApiBaseUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) {
    // If running in production or hosted on Vercel/non-localhost, target Render backend
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return "https://kissansetu-ai-backend.onrender.com/api";
    }
    return import.meta.env.PROD
      ? "https://kissansetu-ai-backend.onrender.com/api"
      : "http://localhost:8000/api";
  }
  let sanitized = rawUrl.trim().replace(/\/+$/, "");
  // Ensure the base URL always ends with /api for backend REST routers
  if (!sanitized.endsWith("/api")) {
    sanitized = `${sanitized}/api`;
  }
  return sanitized;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL
);

export function resolveServerMediaUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  const rootUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${rootUrl}${normalizedPath}`;
}

if (typeof window !== "undefined") {
  console.info(`[KissanSetu API] Resolved API Base URL: ${API_BASE_URL}`);
}

export interface ApiResponse<T> {
  data: T | null;
  error?: string;
  isFallback?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    // Attach dev token if stored
    const token = localStorage.getItem("kissansetu_auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for deployed backend cold starts
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = `HTTP Error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.detail) {
            errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorDetail);
      }

      if (response.status === 204) {
        return null as T;
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error(`Request to ${url} timed out.`);
      }
      if (err.message === "Failed to fetch") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        throw new Error(`Network/CORS preflight failed connecting to ${url}. Ensure backend allows origin ${origin}.`);
      }
      throw err;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData, headers?: Record<string, string>): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    
    const reqHeaders: Record<string, string> = {
      Accept: "application/json",
      ...(headers || {}),
    };

    const token = localStorage.getItem("kissansetu_auth_token");
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for Vision/LLM analysis

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: reqHeaders,
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = `HTTP Error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.detail) {
            errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorDetail);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error(`Upload & analysis request timed out.`);
      }
      if (err.message === "Failed to fetch") {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        throw new Error(`Network/CORS preflight failed connecting to ${url}. Ensure backend allows origin ${origin}.`);
      }
      throw err;
    }
  }

  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
