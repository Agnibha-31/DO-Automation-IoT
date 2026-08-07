import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Copy, RefreshCw, HardDrive, Key, MapPin, Cloud, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { getOrCreateDeviceID, getOrCreateAPIKey, regenerateAPIKey, maskAPIKey, copyToClipboard } from '../utils/deviceService';
import { requestGPSLocation, getLocationFromCoordinates, getWeatherFromCoordinates, getTimezoneFromCoordinates } from '../utils/locationService';

interface DeviceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

interface LocationInfo {
  latitude?: number;
  longitude?: number;
  address?: string;
  timezone?: string;
  weather?: string;
  condition?: string;
  temperature?: number;
}

export default function DeviceInfoModal({ isOpen, onClose, userEmail }: DeviceInfoModalProps) {
  const [deviceID, setDeviceID] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDeviceInfo();
    }
  }, [isOpen]);

  const loadDeviceInfo = () => {
    const id = getOrCreateDeviceID();
    const key = getOrCreateAPIKey();
    setDeviceID(id);
    setApiKey(key);
    setMaskedKey(maskAPIKey(key));
    
    // Load saved location if available
    const savedLocation = localStorage.getItem('do_sensor_location');
    if (savedLocation) {
      setLocationInfo(JSON.parse(savedLocation));
    }
  };

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const coords = await requestGPSLocation();
      
      if (coords) {
        const location: LocationInfo = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        // Get address
        const address = await getLocationFromCoordinates(coords.latitude, coords.longitude);
        if (address && typeof address === 'string') {
          location.address = address;
        }

        // Get weather
        const weather = await getWeatherFromCoordinates(coords.latitude, coords.longitude);
        if (weather) {
          location.condition = weather.condition;
          location.temperature = weather.temperature;
          location.weather = `${weather.condition} (${weather.temperature}°C)`;
        }

        // Get timezone
        const timezone = await getTimezoneFromCoordinates(coords.latitude, coords.longitude);
        if (timezone) {
          location.timezone = timezone;
        }

        setLocationInfo(location);
        localStorage.setItem('do_sensor_location', JSON.stringify(location));
        toast.success('Location updated successfully');
      }
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Failed to get location. Please check permissions.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleRegenerateKey = async () => {
    setIsRegenerating(true);
    try {
      const newKey = regenerateAPIKey();
      setApiKey(newKey);
      setMaskedKey(maskAPIKey(newKey));
      toast.success('API key regenerated successfully');
    } catch (error) {
      toast.error('Failed to regenerate API key');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyDeviceID = () => {
    copyToClipboard(deviceID);
    toast.success('Device ID copied to clipboard');
  };

  const handleCopyAPIKey = () => {
    copyToClipboard(apiKey);
    toast.success('API key copied to clipboard');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <Card 
              className="w-full max-w-2xl border-border/50 bg-card/95 backdrop-blur-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Device Configuration</CardTitle>
                      <CardDescription>Manage your device and API settings</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* User Email */}
                {userEmail && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="text-sm text-muted-foreground mb-1">Logged in as</div>
                    <div className="text-sm font-medium text-foreground">{userEmail}</div>
                  </motion.div>
                )}

                {/* Device ID */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Device ID</span>
                    <Badge variant="outline" className="text-xs">Unique</Badge>
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm text-foreground truncate">
                      {deviceID}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyDeviceID}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>

                {/* API Key */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span>API Key</span>
                    <Badge variant="outline" className="text-xs">Secret</Badge>
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm text-foreground truncate">
                      {maskedKey}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAPIKey}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy full API key"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateKey}
                      disabled={isRegenerating}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </motion.div>

                {/* Location Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Location</span>
                  </label>
                  
                  {locationInfo.address ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Address: </span>
                          <span className="text-foreground">{locationInfo.address}</span>
                        </div>
                        {locationInfo.latitude && locationInfo.longitude && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Coordinates: </span>
                            <span className="text-foreground font-mono">{locationInfo.latitude.toFixed(4)}, {locationInfo.longitude.toFixed(4)}</span>
                          </div>
                        )}
                        {locationInfo.timezone && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Timezone: </span>
                            <span className="text-foreground">{locationInfo.timezone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
                      No location data available. Click "Get Location" to enable.
                    </div>
                  )}

                  <Button
                    onClick={handleGetLocation}
                    disabled={isLoadingLocation}
                    className="w-full"
                  >
                    {isLoadingLocation ? (
                      <>
                        <span className="animate-spin mr-2">◌</span>
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Get Location & Weather
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Weather Section */}
                {locationInfo.weather && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <Cloud className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Weather</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {locationInfo.weather}
                      {locationInfo.temperature && (
                        <span className="text-foreground ml-2">({locationInfo.temperature}°C)</span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Close Button */}
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
