/**
 * Service to get timezone information from geographic coordinates
 * Uses multiple free APIs to determine timezone from latitude/longitude
 */

export interface TimezoneResponse {
  timezone?: string;
  error?: string;
}

/**
 * Get timezone from latitude and longitude using multiple APIs
 * Falls back to next API if one fails
 */
export const getTimezoneFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    // Try TimeZone API first (free tier available)
    const timezoneApiUrl = `**********`;
    
    try {
      const response = await fetch(timezoneApiUrl);
      const data = await response.json();
      if (data.status === 'OK' && data.zoneName) {
        return data.zoneName;
      }
    } catch (err) {
      console.log('TimeZoneDB API failed, trying fallback...');
    }

    // Fallback: Use Google Maps Timezone API (requires API key, but can work without for testing)
    const googleTimezoneUrl = `**********`;
    
    try {
      const response = await fetch(googleTimezoneUrl);
      const data = await response.json();
      if (data.status === 'OK' && data.timeZoneId) {
        return data.timeZoneId;
      }
    } catch (err) {
      console.log('Google Timezone API failed, trying fallback...');
    }

    // Fallback: Use a simple mapping based on longitude for basic timezone estimation
    // This is a rough approximation and not as accurate as API-based detection
    return estimateTimezoneFromCoordinates(latitude, longitude);
  } catch (error) {
    console.error('Error getting timezone from coordinates:', error);
    return null;
  }
};

/**
 * Rough estimate of timezone based on coordinates
 * This is a fallback and less accurate than API-based methods
 */
const estimateTimezoneFromCoordinates = (latitude: number, longitude: number): string => {
  // Basic mapping: divide world into 24 one-hour zones based on longitude
  // This is a simplified approach
  
  // UTC+0 is at 0° longitude
  const utcOffset = Math.round(longitude / 15);
  
  // Clamp to valid timezone offset range (-12 to +14)
  const clampedOffset = Math.max(-12, Math.min(14, utcOffset));
  
  // Format as standard timezone string
  const sign = clampedOffset >= 0 ? '+' : '';
  const hours = Math.abs(clampedOffset).toString().padStart(2, '0');
  
  // Map to IANA timezone names (simplified - just a rough approximation)
  const timezoneMap: { [key: string]: string } = {
    '-12': 'Etc/GMT+12',
    '-11': 'Etc/GMT+11',
    '-10': 'Etc/GMT+10',
    '-9': 'Etc/GMT+9',
    '-8': 'Etc/GMT+8',
    '-7': 'Etc/GMT+7',
    '-6': 'Etc/GMT+6',
    '-5': 'Etc/GMT+5',
    '-4': 'Etc/GMT+4',
    '-3': 'Etc/GMT+3',
    '-2': 'Etc/GMT+2',
    '-1': 'Etc/GMT+1',
    '0': 'UTC',
    '1': 'Etc/GMT-1',
    '2': 'Etc/GMT-2',
    '3': 'Etc/GMT-3',
    '4': 'Etc/GMT-4',
    '5': 'Etc/GMT-5',
    '6': 'Etc/GMT-6',
    '7': 'Etc/GMT-7',
    '8': 'Etc/GMT-8',
    '9': 'Etc/GMT-9',
    '10': 'Etc/GMT-10',
    '11': 'Etc/GMT-11',
    '12': 'Etc/GMT-12',
    '13': 'Etc/GMT-13',
    '14': 'Etc/GMT-14'
  };
  
  const offsetKey = clampedOffset.toString();
  return timezoneMap[offsetKey] || 'UTC';
};

/**
 * Get user's current location and timezone
 */
export const detectLocationAndTimezone = async (
  onLocationDetected?: (location: { latitude: number; longitude: number; timezone: string; city?: string }) => void
): Promise<{ latitude: number; longitude: number; timezone: string } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Location detected: ${latitude}, ${longitude}`);
        
        const timezone = await getTimezoneFromCoordinates(latitude, longitude);
        
        if (timezone) {
          const result = { latitude, longitude, timezone };
          
          if (onLocationDetected) {
            onLocationDetected(result);
          }
          
          resolve(result);
        } else {
          // Use browser's default timezone if API fails
          const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const result = { latitude, longitude, timezone: defaultTimezone };
          
          if (onLocationDetected) {
            onLocationDetected(result);
          }
          
          resolve(result);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
