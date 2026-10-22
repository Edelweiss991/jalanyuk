import type { TransportType } from '../types';
export type { TransportType } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('jalanyuk-token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  
  const json: ApiResponse<T> = await response.json();
  
  if (!json.success) {
    throw new Error(json.error?.message || 'Request failed');
  }
  
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post<{ user: any; token: string }>('/api/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<{ user: any; token: string }>('/api/auth/login', data),
  
  me: () => api.get<{ user: any }>('/api/auth/me'),
  
  updateMe: (data: { fullName?: string; phone?: string; currentPassword?: string; newPassword?: string }) =>
    api.patch<{ user: any }>('/api/auth/me', data),
};

// Search API
export const searchApi = {
  search: (type: TransportType, params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return api.get<{ schedules: any[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/api/search/${type === 'BUS' ? 'bus' : 'train'}?${query.toString()}`
    );
  },

  searchBus: (params: { origin?: string; destination?: string; date?: string; passengers?: number }) =>
    searchApi.search('BUS', params as Record<string, string | number | undefined>),

  searchTrain: (params: { origin?: string; destination?: string; date?: string; passengers?: number }) =>
    searchApi.search('TRAIN', params as Record<string, string | number | undefined>),

  detailBus: (id: string) =>
    api.get<{ schedule: any; seats: any[] }>(`/api/bus-schedules/${id}`),

  detailTrain: (id: string) =>
    api.get<{ schedule: any; seats: any[] }>(`/api/train-schedules/${id}`),

  getTerminals: () => api.get<any[]>('/api/meta/bus-terminals'),

  getStations: () => api.get<any[]>('/api/meta/train-stations'),

  getBusOperators: () => api.get<any[]>('/api/meta/bus-operators'),

  getTrainOperators: () => api.get<any[]>('/api/meta/train-operators'),

  popular: () =>
    api.get<{
      busRoutes: Array<{ origin: string; destination: string; count: number }>;
      trainRoutes: Array<{ origin: string; destination: string; count: number }>;
      destinations: string[];
    }>('/api/meta/popular'),
};

export const busApi = {
  getSchedule: (id: string) => searchApi.detailBus(id),
};

export const trainApi = {
  getSchedule: (id: string) => searchApi.detailTrain(id),
};

export const scheduleApi = {
  getDetail: async (type: TransportType, id: string) => {
    const data = type === 'BUS' ? await searchApi.detailBus(id) : await searchApi.detailTrain(id);
    return data.schedule;
  },
  getSeats: async (type: TransportType, id: string) => {
    const data = type === 'BUS' ? await searchApi.detailBus(id) : await searchApi.detailTrain(id);
    return { seats: data.seats };
  },
};

// Booking API
export const bookingApi = {
  create: (data: Record<string, unknown>, idempotencyKey?: string) =>
    api.post<any>('/api/bookings', { ...data, ...(idempotencyKey ? { idempotencyKey } : {}) }),

  mine: (page = 1, pageSize = 10) =>
    api.get<any>(`/api/bookings?page=${page}&pageSize=${pageSize}`),

  detail: (id: string) => api.get<any>(`/api/bookings/${id}`),

  cancel: (id: string, reason?: string) =>
    api.post<any>(`/api/bookings/${id}/cancel`, reason ? { reason } : {}),

  simulatePayment: (bookingId: string, scenario: string) =>
    api.post<any>('/api/payments/simulate', { bookingId, scenario }),
};

// Admin API
export const adminApi = {
  overview: () => api.get<any>('/api/admin/overview'),

  get: (resource: string, params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.get<any>(`/api/admin/${resource}${query}`);
  },

  post: (resource: string, data: any) => api.post<any>(`/api/admin/${resource}`, data),

  patch: (resource: string, id: string, data: any) => api.patch<any>(`/api/admin/${resource}/${id}`, data),

  del: (resource: string, id: string) => api.del<any>(`/api/admin/${resource}/${id}`),

  updateBookingStatus: (id: string, status: string, reason?: string) =>
    api.patch<any>(`/api/admin/bookings/${id}/status`, { status, reason }),

  processRefund: (refundId: string, action: 'PROCESS' | 'REJECT') =>
    api.post<any>(`/api/admin/refunds/${refundId}/process`, { action }),

  settings: () => api.get<Record<string, string>>('/api/admin/settings'),

  updateSettings: (values: Record<string, string>) => api.put<any>('/api/admin/settings', values),

  exportCsv: async (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('jalanyuk-token') : null;
    const res = await fetch(`${API_BASE}/api/admin/reports/export.csv${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Gagal mengunduh CSV');
    return res.blob();
  },
};

// Algorithm Lab API (admin only) — matches backend /api/algorithm-lab/*
export const labApi = {
  dataset: () => api.get<any>('/api/algorithm-lab/dataset'),

  array: () => api.get<any>('/api/algorithm-lab/array'),

  sort: (dataType: 'BUS' | 'TRAIN', key: string) =>
    api.post<any>('/api/algorithm-lab/sort', { dataType, key }),

  linear: (dataType: 'BUS' | 'TRAIN', query: string) =>
    api.post<any>('/api/algorithm-lab/search/linear', { dataType, query }),

  binary: (dataType: 'BUS' | 'TRAIN', targetPrice: number) =>
    api.post<any>('/api/algorithm-lab/search/binary', { dataType, targetPrice }),

  pointer: () => api.post<any>('/api/algorithm-lab/pointer', {}),

  struct: () => api.post<any>('/api/algorithm-lab/struct', {}),

  exportLog: (log: any[], format: 'json' | 'csv') =>
    api.post<{ content: string; filename: string }>('/api/algorithm-lab/export', { log, format }),
};
