import backend from '../components/utils/backend';
import { getDemoDatabaseStats, isDemoMode } from '../components/utils/demoData';

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? 'https://do-sensor-backend.onrender.com/api';

// Database monitoring service for data download page
// Based on Smart Meter architecture

export interface DatabaseStats {
  total_records: number;
  total_size_mb: number;
  oldest_record: string;
  newest_record: string;
  average_records_per_day: number;
  data_points: {
    parameter: string;
    count: number;
  }[];
  retention_days: number;
  last_updated: string;
}

// Fetch database statistics from backend
export const fetchDatabaseStats = async (): Promise<DatabaseStats> => {
  if (isDemoMode()) return getDemoDatabaseStats();
  try {
    const token = backend.getAccessToken();
    const url = `${API_BASE}/export/stats`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`Failed to fetch database statistics (${response.status}) ${details}`);
    }

    const data = await response.json();
    
    // Transform backend response to DatabaseStats format
    return {
      total_records: data.total_records || data.total_readings || 0,
      total_size_mb: (data.total_size_bytes || 0) / (1024 * 1024),
      oldest_record: data.oldest_record || 'N/A',
      newest_record: data.newest_record || 'N/A',
      average_records_per_day: data.average_records_per_day || 0,
      data_points: data.data_points || [],
      retention_days: data.retention_days || 30,
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database stats error:', error);
    // Return default stats on error
    return {
      total_records: 0,
      total_size_mb: 0,
      oldest_record: 'N/A',
      newest_record: 'N/A',
      average_records_per_day: 0,
      data_points: [],
      retention_days: 30,
      last_updated: new Date().toISOString(),
    };
  }
};

// Calculate storage status percentage
export const calculateStoragePercentage = (used: number, limit: number): number => {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
};

// Get storage status message
export const getStorageStatusMessage = (percentage: number): {
  status: 'good' | 'warning' | 'critical';
  message: string;
  color: string;
} => {
  if (percentage < 50) {
    return {
      status: 'good',
      message: 'Storage available',
      color: 'text-green-500',
    };
  } else if (percentage < 80) {
    return {
      status: 'warning',
      message: 'Storage usage moderate',
      color: 'text-yellow-500',
    };
  } else {
    return {
      status: 'critical',
      message: 'Storage nearly full',
      color: 'text-red-500',
    };
  }
};

// Format bytes to human readable format
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
};

// Calculate data retention period
export const calculateRetentionDate = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Cache database stats in localStorage
export const cacheDatabaseStats = (stats: DatabaseStats): void => {
  localStorage.setItem('do_sensor_db_stats', JSON.stringify(stats));
};

// Retrieve cached database stats
export const getCachedDatabaseStats = (): DatabaseStats | null => {
  const cached = localStorage.getItem('do_sensor_db_stats');
  return cached ? JSON.parse(cached) : null;
};

// Clear cached database stats
export const clearCachedDatabaseStats = (): void => {
  localStorage.removeItem('do_sensor_db_stats');
};
