import { getDemoDatabaseStats, getDemoHistory, getDemoLatestReading, isDemoMode } from './demoData';

const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : 'https://do-sensor-backend.onrender.com/api';

let accessToken: string | null = localStorage.getItem('do_sensor_token');

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('do_sensor_token', token);
  } else {
    localStorage.removeItem('do_sensor_token');
  }
};

const request = async <T = any>(path: string, options: any = {}): Promise<T> => {
  const { query, body, headers, raw, ...rest } = options;
  const url = new URL(path, API_BASE);
  if (query) {
    Object.entries(query).forEach(([key, value]: any) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  
  const init: RequestInit = {
    method: rest.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  
  if (accessToken) {
    (init.headers as any)['Authorization'] = `Bearer ${accessToken}`;
  }
  
  if (body) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  const response = await fetch(url.toString(), init);
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || `Request failed (${response.status})`);
  }
  
  if (raw) return response as T;
  return response.json();
};

export async function login(email: string, password: string) {
  if (isDemoMode()) {
    const result = { token: 'demo-session-token', user: { id: 'demo-user', name: 'Research Operator', email } };
    setAccessToken(result.token);
    return result;
  }
  const result = await request<{ token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setAccessToken(result.token);
  return result;
}

export async function register(email: string, password: string, name: string) {
  if (isDemoMode()) {
    const result = { token: 'demo-session-token', user: { id: 'demo-user', name, email } };
    setAccessToken(result.token);
    return result;
  }
  const result = await request<{ token: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: { email, password, name },
  });
  setAccessToken(result.token);
  return result;
}

export async function forgotPassword(email: string) {
  if (isDemoMode()) return { message: `Demo reset instructions prepared for ${email}`, reset_token: 'DEMO-RESET' };
  return request<{ message: string; reset_token?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  if (isDemoMode()) return { message: `Demo password updated for ${email}` };
  return request<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: { email, token, newPassword },
  });
}

export async function fetchCurrentUser() {
  if (isDemoMode()) return { user: { id: 'demo-user', name: 'Research Operator', email: 'research.operator@example.org' } };
  return request<{ user: any }>('/api/auth/me');
}

export async function updatePreferences(payload: Record<string, any>) {
  if (isDemoMode()) return { user: { id: 'demo-user', preferences: payload } };
  return request<{ user: any }>('/api/auth/preferences', {
    method: 'PATCH',
    body: payload,
  });
}

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

export interface ExportOptions {
  format?: ExportFormat;
  metrics?: string[];
  start?: string;
  end?: string;
  includeAnalytics?: boolean;
  includeCharts?: boolean;
  includeRaw?: boolean;
  compression?: boolean;
  sensorId?: string;
}

export async function exportReadings(options: ExportOptions = {}): Promise<Blob> {
  if (isDemoMode()) {
    const rows = getDemoHistory(500);
    if (options.format === 'json') {
      return new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    }
    const columns = ['captured_at', 'do_concentration', 'corrected_do', 'temperature', 'pressure', 'do_saturation'];
    const csv = [columns.join(','), ...rows.map((row) => columns.map((key) => (row as any)[key]).join(','))].join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }
  const response = await request<Response>('/api/export/readings', {
    raw: true,
    query: {
      format: options.format || 'csv',
      metrics: options.metrics?.join(',') || undefined,
      start: options.start,
      end: options.end,
      includeAnalytics: options.includeAnalytics ? 'true' : undefined,
      includeCharts: options.includeCharts ? 'true' : undefined,
      includeRaw: options.includeRaw === false ? 'false' : undefined,
      compression: options.compression ? 'true' : undefined,
      sensor_id: options.sensorId,
    },
  });
  return await (response as any).blob();
}

export async function exportReadingsCSV(): Promise<Blob> {
  return exportReadings({ format: 'csv' });
}

export async function exportStatsCSV(): Promise<Blob> {
  const response = await request<Response>('/api/export/stats', { raw: true });
  return await (response as any).blob();
}

export async function getLatestReading() {
  if (isDemoMode()) return { reading: getDemoLatestReading() };
  const resp = await request(`/api/readings/latest`);
  return resp;
}

export async function getStats() {
  if (isDemoMode()) return getDemoDatabaseStats();
  const resp = await request(`/api/readings/stats`);
  return resp;
}

export async function getHistory(limit = 500) {
  if (isDemoMode()) return getDemoHistory(limit);
  const resp = await request(`/api/readings/history`, { query: { limit } });
  return (resp as any).points || [];
}

export async function postCalibrate(mode: 'zero' | 'span') {
  if (isDemoMode()) return { ok: true, mode, calibrated_at: new Date().toISOString() };
  const resp = await request(`/api/calibrate`, {
    method: 'POST',
    body: { mode }
  });
  return resp;
}

export async function postDAC(corrected_do: number | null) {
  if (isDemoMode()) return { ok: true, corrected_do, output_voltage: corrected_do == null ? 0 : Number((corrected_do / 10 * 5).toFixed(3)) };
  const resp = await request(`/api/dac`, {
    method: 'POST',
    body: { corrected_do }
  });
  return resp;
}

export interface ExportLog {
  id: number;
  filename: string;
  file_size: number;
  format: string;
  start_date: number;
  end_date: number;
  metrics: string;
  include_analytics: boolean;
  include_charts: boolean;
  include_raw: boolean;
  compression: boolean;
  created_at: number;
}

export async function getExportLogs(): Promise<ExportLog[]> {
  if (isDemoMode()) {
    const now = Math.floor(Date.now() / 1000);
    return [
      { id: 3, filename: 'do_readings_last_7_days.csv', file_size: 184320, format: 'csv', start_date: now - 604800, end_date: now, metrics: JSON.stringify(['do_concentration', 'corrected_do', 'temperature', 'pressure', 'do_saturation']), include_analytics: true, include_charts: false, include_raw: true, compression: false, created_at: now - 7200 },
      { id: 2, filename: 'do_monthly_report.pdf', file_size: 824116, format: 'pdf', start_date: now - 2592000, end_date: now, metrics: JSON.stringify(['corrected_do', 'temperature', 'do_saturation']), include_analytics: true, include_charts: true, include_raw: false, compression: false, created_at: now - 172800 },
      { id: 1, filename: 'do_archive_july.xlsx', file_size: 1245184, format: 'xlsx', start_date: now - 5184000, end_date: now - 2592000, metrics: JSON.stringify(['do_concentration', 'corrected_do', 'temperature', 'pressure', 'do_saturation']), include_analytics: false, include_charts: false, include_raw: true, compression: true, created_at: now - 604800 }
    ];
  }
  return request<ExportLog[]>('/api/export/logs');
}

export default {
  getAccessToken,
  setAccessToken,
  login,
  register,
  forgotPassword,
  resetPassword,
  fetchCurrentUser,
  updatePreferences,
  exportReadings,
  exportReadingsCSV,
  exportStatsCSV,
  getLatestReading,
  getStats,
  getHistory,
  postCalibrate,
  postDAC,
  getExportLogs
};

export { isDemoMode };
