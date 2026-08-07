import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'bn' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'it' | 'nl';
export type RefreshRate = '1s' | '5s' | '10s' | '30s' | '1m';
export type ChartQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
  timezone?: string;
}

export interface WeatherInfo {
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
}

interface ThemeContextType {
  theme: Theme;
  language: Language;
  isDark: boolean;
  timezone: string;
  country: string;
  refreshRate: RefreshRate;
  chartQuality: ChartQuality;
  locationInfo: LocationInfo;
  weatherInfo: WeatherInfo;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setTimezone: (timezone: string) => void;
  setCountry: (country: string) => void;
  setRefreshRate: (refreshRate: RefreshRate) => void;
  setChartQuality: (chartQuality: ChartQuality) => void;
  setLocationInfo: (location: LocationInfo) => void;
  setWeatherInfo: (weather: WeatherInfo) => void;
  getCurrentTime: () => string;
  getRefreshInterval: () => number;
  getChartConfig: () => {
    strokeWidth: number;
    dotSize: number;  
    activeDotSize: number;
    animationDuration: number;
    quality: number;
  };
}

const defaultContextValue: ThemeContextType = {
  theme: 'dark',
  language: 'en',
  isDark: true,
  timezone: 'UTC',
  country: 'US',
  refreshRate: '5s',
  chartQuality: 'high',
  locationInfo: {},
  weatherInfo: {},
  setTheme: () => {},
  setLanguage: () => {},
  setTimezone: () => {},
  setCountry: () => {},
  setRefreshRate: () => {},
  setChartQuality: () => {},
  setLocationInfo: () => {},
  setWeatherInfo: () => {},
  getCurrentTime: () => new Date().toLocaleTimeString('en-US', { hour12: true }),
  getRefreshInterval: () => 5000,
  getChartConfig: () => ({
    strokeWidth: 3,
    dotSize: 4,
    activeDotSize: 6,
    animationDuration: 1000,
    quality: 1
  })
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [isDark, setIsDark] = useState(true);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [country, setCountry] = useState<string>('US');
  const [refreshRate, setRefreshRate] = useState<RefreshRate>('5s');
  const [chartQuality, setChartQuality] = useState<ChartQuality>('high');
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo>({});

  useEffect(() => {
    // Load saved preferences (theme is always dark)
    const savedLanguage = localStorage.getItem('language') as Language;
    const savedTimezone = localStorage.getItem('timezone');
    const savedCountry = localStorage.getItem('country');
    const savedRefreshRate = localStorage.getItem('refreshRate') as RefreshRate;
    const savedChartQuality = localStorage.getItem('chartQuality') as ChartQuality;
    const savedLocation = localStorage.getItem('do_sensor_location');
    const savedWeather = localStorage.getItem('do_sensor_weather');
    
    // Always ensure dark theme
    setTheme('dark');
    localStorage.setItem('theme', 'dark');
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    
    if (savedTimezone) {
      setTimezone(savedTimezone);
    } else {
      // Try to detect user's timezone
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(detectedTimezone);
        localStorage.setItem('timezone', detectedTimezone);
      } catch (error) {
        setTimezone('UTC');
      }
    }
    
    if (savedCountry) {
      setCountry(savedCountry);
    }
    
    if (savedRefreshRate) {
      setRefreshRate(savedRefreshRate);
    }
    
    if (savedChartQuality) {
      setChartQuality(savedChartQuality);
    }
    
    // Load location and weather info from localStorage to persist across page navigation
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        setLocationInfo(locationData);
      } catch (error) {
        console.error('Failed to parse saved location:', error);
      }
    }
    
    if (savedWeather) {
      try {
        const weatherData = JSON.parse(savedWeather);
        setWeatherInfo(weatherData);
      } catch (error) {
        console.error('Failed to parse saved weather:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Always use dark mode
    setIsDark(true);
    
    // Apply dark theme to document
    document.documentElement.classList.add('dark');
    
    // Save to localStorage
    localStorage.setItem('theme', 'dark');
  }, [theme]);

  useEffect(() => {
    // Save preferences to localStorage
    localStorage.setItem('language', language);
    localStorage.setItem('timezone', timezone);
    localStorage.setItem('country', country);
    localStorage.setItem('refreshRate', refreshRate);
    localStorage.setItem('chartQuality', chartQuality);
  }, [language, timezone, country, refreshRate, chartQuality]);

  const getCurrentTime = (): string => {
    try {
      const now = new Date();
      return now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      // Fallback if timezone is invalid
      return new Date().toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  };

  const handleSetTheme = (newTheme: Theme) => {
    // Theme is locked to dark mode, do nothing
    return;
  };

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const handleSetTimezone = (newTimezone: string) => {
    setTimezone(newTimezone);
  };

  const handleSetCountry = (newCountry: string) => {
    setCountry(newCountry);
  };

  const handleSetRefreshRate = (newRefreshRate: RefreshRate) => {
    setRefreshRate(newRefreshRate);
  };

  const handleSetChartQuality = (newChartQuality: ChartQuality) => {
    setChartQuality(newChartQuality);
  };

  // Convert refresh rate to milliseconds
  const getRefreshInterval = (): number => {
    switch (refreshRate) {
      case '1s': return 1000;
      case '5s': return 5000;
      case '10s': return 10000;
      case '30s': return 30000;
      case '1m': return 60000;
      default: return 5000;
    }
  };

  // Get chart configuration based on quality setting
  const getChartConfig = () => {
    switch (chartQuality) {
      case 'low':
        return {
          strokeWidth: 2,
          dotSize: 3,
          activeDotSize: 5,
          animationDuration: 500,
          quality: 0.5
        };
      case 'medium':
        return {
          strokeWidth: 2.5,
          dotSize: 3.5,
          activeDotSize: 5.5,
          animationDuration: 750,
          quality: 0.75
        };
      case 'high':
        return {
          strokeWidth: 3,
          dotSize: 4,
          activeDotSize: 6,
          animationDuration: 1000,
          quality: 1
        };
      case 'ultra':
        return {
          strokeWidth: 4,
          dotSize: 5,
          activeDotSize: 8,
          animationDuration: 1500,
          quality: 1.25
        };
      default:
        return {
          strokeWidth: 3,
          dotSize: 4,
          activeDotSize: 6,
          animationDuration: 1000,
          quality: 1
        };
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      language,
      isDark,
      timezone,
      country,
      refreshRate,
      chartQuality,
      locationInfo,
      weatherInfo,
      setTheme: handleSetTheme,
      setLanguage: handleSetLanguage,
      setTimezone: handleSetTimezone,
      setCountry: handleSetCountry,
      setRefreshRate: handleSetRefreshRate,
      setChartQuality: handleSetChartQuality,
      setLocationInfo,
      setWeatherInfo,
      getCurrentTime,
      getRefreshInterval,
      getChartConfig
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}

export default ThemeContext;