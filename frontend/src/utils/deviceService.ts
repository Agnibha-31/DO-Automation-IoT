// Device information and API key management service
// Based on Smart Meter architecture

export interface DeviceInfo {
  device_id: string;
  api_key: string;
  device_name: string;
  location: string;
  timezone: string;
  created_at: number;
  last_updated: number;
}

// Generate or retrieve device ID
export const getOrCreateDeviceID = (): string => {
  let deviceId = localStorage.getItem('do_sensor_device_id');
  
  if (!deviceId) {
    // Generate unique device ID
    deviceId = `DOS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    localStorage.setItem('do_sensor_device_id', deviceId);
  }
  
  return deviceId;
};

// Generate or retrieve API key
export const getOrCreateAPIKey = (): string => {
  let apiKey = localStorage.getItem('do_sensor_api_key');
  
  if (!apiKey) {
    // Generate unique API key
    apiKey = generateAPIKey();
    localStorage.setItem('do_sensor_api_key', apiKey);
  }
  
  return apiKey;
};

// Generate a unique API key
const generateAPIKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SK_';
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Regenerate API key
export const regenerateAPIKey = (): string => {
  const newKey = generateAPIKey();
  localStorage.setItem('do_sensor_api_key', newKey);
  return newKey;
};

// Get device info
export const getDeviceInfo = (deviceName: string = 'DO Sensor Dashboard'): DeviceInfo => {
  const storedInfo = localStorage.getItem('do_sensor_device_info');
  
  if (storedInfo) {
    return JSON.parse(storedInfo);
  }
  
  const deviceInfo: DeviceInfo = {
    device_id: getOrCreateDeviceID(),
    api_key: getOrCreateAPIKey(),
    device_name: deviceName,
    location: localStorage.getItem('do_sensor_location_name') || 'Not Set',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    created_at: Date.now(),
    last_updated: Date.now(),
  };
  
  localStorage.setItem('do_sensor_device_info', JSON.stringify(deviceInfo));
  return deviceInfo;
};

// Update device info
export const updateDeviceInfo = (updates: Partial<DeviceInfo>): DeviceInfo => {
  const current = getDeviceInfo();
  const updated: DeviceInfo = {
    ...current,
    ...updates,
    last_updated: Date.now(),
  };
  
  localStorage.setItem('do_sensor_device_info', JSON.stringify(updated));
  return updated;
};

// Mask API key for display
export const maskAPIKey = (apiKey: string, visibleChars: number = 4): string => {
  if (apiKey.length <= visibleChars) return apiKey;
  const visible = apiKey.slice(-visibleChars);
  const hidden = '*'.repeat(apiKey.length - visibleChars);
  return hidden + visible;
};

// Copy to clipboard helper
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
