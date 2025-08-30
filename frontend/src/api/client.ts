import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

export const api = axios.create({
  baseURL,
  
  withCredentials: false,
});

// ---- Auth attachers (used by AuthContext) ----
type Handlers = {
  getToken: () => string | null | undefined;
  onUnauthorized?: () => void;
};

let handlers: Handlers | null = null;

export function attachAuthHandlers(h: Handlers) {
  handlers = h;
}

// Attach Authorization header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (handlers?.getToken) {
    const token = handlers.getToken();
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Central 401 handler
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status;
    if (status === 401 && handlers?.onUnauthorized) {
      handlers.onUnauthorized();
    }
    return Promise.reject(err);
  }
);

// helpers
export function toFormUrlEncoded(data: Record<string, any>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
    .join('&');
}
