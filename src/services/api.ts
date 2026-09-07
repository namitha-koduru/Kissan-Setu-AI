/**
 * Centralized API Client for KissanSetuAI Frontend
 * Connects to FastAPI Backend with configurable base URL and automatic JSON handling.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

export interface ApiResponse<T> {
  data: T | null;
  error?: string;
  isFallback?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
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
