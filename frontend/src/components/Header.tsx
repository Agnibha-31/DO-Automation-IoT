import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { Clock, MapPin, Cloud, Timer } from 'lucide-react';
import { useTheme } from './utils/themeContext';
import { useTranslation } from './utils/translations';

interface HeaderProps {
  startTime: Date;
}

export default function Header({ startTime }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayTime, setDisplayTime] = useState('');
  const [uptime, setUptime] = useState('00:00:00');
    const [currentLocation, setCurrentLocation] = useState({ city: 'Loading...', temp: 0, condition: 'Unknown' });
  const { language, timezone, country, locationInfo, weatherInfo } = useTheme();
  const t = useTranslation(language);
  
  // Dynamic location and weather - prioritize persisted location data
  const getLocationAndWeather = () => {
    // Priority 1: Use persisted/detected location and weather info
    if (locationInfo?.city && locationInfo.city !== 'Unknown') {
      return {
        city: locationInfo.region && locationInfo.country 
          ? `${locationInfo.city}, ${locationInfo.region}` 
          : locationInfo.city,
        temp: weatherInfo?.temperature || 0,
        condition: weatherInfo?.condition || 'Unknown'
      };
    }

    // Priority 2: Fallback to country-based mapping only if no location data
    const locationMap: { [key: string]: { city: string; temp: number; condition: string } } = {
      'US': { city: 'New York, USA', temp: 22, condition: 'Partly Cloudy' },
      'GB': { city: 'London, UK', temp: 15, condition: 'Rainy' },
      'DE': { city: 'Berlin, Germany', temp: 18, condition: 'Cloudy' },
      'FR': { city: 'Paris, France', temp: 20, condition: 'Sunny' },
      'JP': { city: 'Tokyo, Japan', temp: 25, condition: 'Clear' },
      'CN': { city: 'Beijing, China', temp: 28, condition: 'Hazy' },
      'IN': { city: 'Mumbai, India', temp: 32, condition: 'Hot' },
      'BR': { city: 'São Paulo, Brazil', temp: 24, condition: 'Partly Cloudy' },
      'CA': { city: 'Toronto, Canada', temp: 16, condition: 'Cool' },
      'AU': { city: 'Sydney, Australia', temp: 26, condition: 'Sunny' },
      'BD': { city: 'Dhaka, Bangladesh', temp: 30, condition: 'Humid' },
      'RU': { city: 'Moscow, Russia', temp: 12, condition: 'Cold' },
      'ES': { city: 'Madrid, Spain', temp: 23, condition: 'Warm' },
      'IT': { city: 'Rome, Italy', temp: 21, condition: 'Pleasant' },
      'KR': { city: 'Seoul, South Korea', temp: 19, condition: 'Mild' },
      'NL': { city: 'Amsterdam, Netherlands', temp: 17, condition: 'Breezy' },
      'PT': { city: 'Lisbon, Portugal', temp: 22, condition: 'Sunny' },
      'AR': { city: 'Buenos Aires, Argentina', temp: 19, condition: 'Cool' },
      'MX': { city: 'Mexico City, Mexico', temp: 21, condition: 'Clear' },
      'ZA': { city: 'Cape Town, South Africa', temp: 18, condition: 'Windy' }
    };
    
    return locationMap[country || 'IN'] || locationMap['IN'];
  };
  
  // Update current location when locationInfo or weatherInfo changes
  useEffect(() => {
    setCurrentLocation(getLocationAndWeather());
  }, [locationInfo, weatherInfo, country]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Calculate time in the current timezone
      try {
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setDisplayTime(timeStr);
      } catch (error) {
        // Fallback if timezone is invalid
        const timeStr = now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setDisplayTime(timeStr);
      }
      
      // Calculate uptime
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setUptime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, timezone]);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="border-b border-border px-6 py-4"
      style={{ backgroundColor: 'var(--color-header-bg)' }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Uptime Timer */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card 
            className="px-4 py-2 border-primary/30 shadow-lg"
            style={{ 
              backgroundColor: 'var(--color-status-box)',
              borderColor: 'var(--color-status-box-border)'
            }}
          >
            <div className="flex items-center space-x-2 text-primary">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">{t.uptime}: {uptime}</span>
            </div>
          </Card>
        </motion.div>

        {/* Right side - Date, Time, Location, Weather */}
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card 
              className="px-4 py-2 border-primary/20 shadow-lg"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <div className="flex items-center space-x-2 text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {currentTime.toLocaleDateString(language === 'bn' ? 'bn-BD' : language === 'hi' ? 'hi-IN' : 'en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-lg text-foreground">
                    {displayTime}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card 
              className="px-4 py-2 border-primary/20 shadow-lg"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <div className="text-foreground">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{currentLocation.city}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Cloud className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{currentLocation.temp}°C - {currentLocation.condition}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}