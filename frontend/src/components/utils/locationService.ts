// Location and timezone detection service
// Based on Smart Meter architecture

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  condition: string;
  wind_speed: number;
}

// Request user's GPS location
export const requestGPSLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// Get timezone from coordinates using API
export const getTimezoneFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // Using open-meteo or similar free API (no key needed)
    const response = await fetch(
      `https://timezonelookup.akamai.com/tzlookup?lat=${latitude}&lon=${longitude}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      // Fallback: detect timezone from browser
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    const data: any = await response.json();
    return data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to browser timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
};

// Get country, region, city from coordinates using reverse geocoding API
// Uses zoom level 18 for highest precision location detection
export const getLocationFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<Partial<LocationInfo>> => {
  try {
    // Using nominatim (OpenStreetMap) - free, no key required
    // zoom=18 provides highest precision for district/locality level
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DO-Sensor-Dashboard'
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data: any = await response.json();
    const address = data.address || {};

    // Try to get the most precise location details
    // Priority: city/town/village/borough > county > state > country
    let city = address.city || address.town || address.village || address.borough || address.county || 'Unknown';
    let region = address.state || address.region || address.county || 'Unknown';

    return {
      country: address.country || 'Unknown',
      region: region,
      city: city,
      coordinates: {
        lat: latitude,
        lon: longitude,
      },
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      coordinates: {
        lat: latitude,
        lon: longitude,
      },
    };
  }
};

// Get weather data from coordinates
export const getWeatherFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<WeatherData | null> => {
  try {
    // Using open-meteo API (free, no key required)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,weather_code,wind_speed_10m`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data: any = await response.json();
    const current = data.current;

    if (!current) return null;

    return {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m || 0,
      pressure: Math.round(current.pressure_msl || 0),
      condition: getWeatherCondition(current.weather_code),
      wind_speed: Math.round(current.wind_speed_10m || 0),
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
};

// Map WMO weather codes to conditions
const getWeatherCondition = (code: number): string => {
  const weatherCodes: Record<number, string> = {
    0: 'Clear',
    1: 'Partly Cloudy',
    2: 'Mostly Cloudy',
    3: 'Cloudy',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    80: 'Light Showers',
    81: 'Moderate Showers',
    82: 'Heavy Showers',
    85: 'Light Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Hail',
  };

  return weatherCodes[code] || 'Unknown';
};

// Detect timezone from browser
export const detectBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Store location in localStorage
export const saveLocationToStorage = (location: LocationInfo): void => {
  localStorage.setItem('do_sensor_location', JSON.stringify(location));
};

// Retrieve stored location
export const getStoredLocation = (): LocationInfo | null => {
  const stored = localStorage.getItem('do_sensor_location');
  return stored ? JSON.parse(stored) : null;
};
