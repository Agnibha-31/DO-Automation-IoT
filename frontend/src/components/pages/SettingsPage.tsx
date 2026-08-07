import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Settings, User, Shield, Database, Trash2, MapPin, Bell, Eye, EyeOff, Globe, Cloud, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../utils/themeContext';
import { useTranslation } from '../utils/translations';
import { countries } from '../utils/countries';
import { timezones } from '../utils/timezones';
import { requestGPSLocation, getLocationFromCoordinates, getWeatherFromCoordinates, getTimezoneFromCoordinates } from '../utils/locationService';

export default function SettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    criticalAlerts: true
  });
  const [dataRetention, setDataRetention] = useState('1-year');
  const { language, timezone, country, refreshRate, chartQuality, setLanguage, setTimezone, setCountry, setRefreshRate, setChartQuality, setLocationInfo, setWeatherInfo } = useTheme();
  const t = useTranslation(language);

  // Sync local state with context values when they become available
  useEffect(() => {
    if (country) {
      setSelectedCountry(country);
    }
  }, [country]);

  useEffect(() => {
    if (timezone) {
      setSelectedTimezone(timezone);
    }
  }, [timezone]);



  const languages = [
    { value: 'en', label: t.english, flag: '🇺🇸' },
    { value: 'bn', label: t.bengali, flag: '🇧🇩' },
    { value: 'hi', label: t.hindi, flag: '🇮🇳' },
    { value: 'es', label: t.spanish, flag: '🇪🇸' },
    { value: 'fr', label: t.french, flag: '🇫🇷' },
    { value: 'de', label: t.german, flag: '🇩🇪' },
    { value: 'pt', label: t.portuguese, flag: '🇵🇹' },
    { value: 'ru', label: t.russian, flag: '🇷🇺' },
    { value: 'zh', label: t.chinese, flag: '🇨🇳' },
    { value: 'ja', label: t.japanese, flag: '🇯🇵' },
    { value: 'ko', label: t.korean, flag: '🇰🇷' },
    { value: 'ar', label: t.arabic, flag: '🇸🇦' },
    { value: 'it', label: t.italian, flag: '🇮🇹' },
    { value: 'nl', label: t.dutch, flag: '🇳🇱' }
  ];

  const retentionOptions = [
    { value: '3-months', label: '3 Months', storage: '~2.5 GB' },
    { value: '6-months', label: '6 Months', storage: '~5.0 GB' },
    { value: '1-year', label: '1 Year', storage: '~10.0 GB' },
    { value: '2-years', label: '2 Years', storage: '~20.0 GB' },
    { value: 'indefinite', label: 'Indefinite', storage: 'Variable' }
  ];

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t.passwordFieldsRequired || 'Please fill in all password fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t.passwordsDoNotMatch || 'New passwords do not match.');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error(t.passwordTooShort || 'New password must be at least 8 characters long.');
      return;
    }
    
    // Simulate password change
    toast.success(t.passwordUpdated);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setCountry(countryCode);
    const country = countries.find(c => c.code === countryCode);
    toast.success(`${t.countryUpdated || t.regionUpdated || 'Country updated to'} ${country?.name}`);
  };

  const handleLanguageChange = (newLanguage: any) => {
    setLanguage(newLanguage);
    const lang = languages.find(l => l.value === newLanguage);
    toast.success(`${t.languageChanged || 'Language changed to'} ${lang?.label}`);
  };

  const handleRefreshRateChange = (newRefreshRate: any) => {
    setRefreshRate(newRefreshRate);
    const intervals: { [key: string]: string } = {
      '1s': '1 Second',
      '5s': '5 Seconds', 
      '10s': '10 Seconds',
      '30s': '30 Seconds',
      '1m': '1 Minute'
    };
    toast.success(`${t.refreshRateUpdated || 'Data refresh rate updated to'} ${intervals[newRefreshRate]}`);
  };

  const handleChartQualityChange = (newChartQuality: any) => {
    setChartQuality(newChartQuality);
    const qualities: { [key: string]: string } = {
      'low': 'Low Quality',
      'medium': 'Medium Quality',
      'high': 'High Quality',
      'ultra': 'Ultra Quality'
    };
    toast.success(`${t.chartQualityUpdated || 'Chart quality updated to'} ${qualities[newChartQuality]}`);
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingGPS(true);
    toast.info('Requesting location permission...');
    
    try {
      const coords = await requestGPSLocation();
      
      if (coords) {
        // Get location details
        toast.info('Getting location details...');
        const locationData = await getLocationFromCoordinates(coords.latitude, coords.longitude);
        
        // Get weather
        const weatherData = await getWeatherFromCoordinates(coords.latitude, coords.longitude);
        
        // Get timezone
        const detectedTimezone = await getTimezoneFromCoordinates(coords.latitude, coords.longitude);
        
        // Prepare location info
        const locationInfo = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          country: locationData?.country || 'Unknown',
          region: locationData?.region || 'Unknown',
          city: locationData?.city || 'Unknown',
          address: locationData?.city && locationData?.region && locationData?.country 
            ? `${locationData.city}, ${locationData.region}, ${locationData.country}`
            : 'Unknown Location',
          timezone: detectedTimezone
        };
        
        // Update context
        setLocationInfo(locationInfo);
        setWeatherInfo(weatherData || {});
        
        // Update timezone and country if detected
        if (detectedTimezone) {
          setTimezone(detectedTimezone);
          setSelectedTimezone(detectedTimezone);
        }
        
        if (locationData?.country) {
          const countryCode = countries.find(c => c.name === locationData.country)?.code || country;
          setCountry(countryCode);
          setSelectedCountry(countryCode);
        }
        
        // Save to localStorage
        localStorage.setItem('do_sensor_location', JSON.stringify(locationInfo));
        if (weatherData) {
          localStorage.setItem('do_sensor_weather', JSON.stringify(weatherData));
        }
        
        toast.success('Location updated successfully! Timezone and country have been auto-detected.');
      }
    } catch (error: any) {
      console.error('Location error:', error);
      if (error.message.includes('User denied')) {
        toast.error('Location permission denied. Please enable geolocation in your browser settings.');
      } else {
        toast.error('Failed to get location. Please check permissions and try again.');
      }
    } finally {
      setIsLoadingGPS(false);
    }
  };

  const handleDataDeletion = (type: string) => {
    // Simulate data deletion
    toast.success(`${type} ${t.dataDeleted || 'data has been deleted successfully'}`);
  };

  const handleDataRetentionChange = (newRetention: string) => {
    setDataRetention(newRetention);
    const option = retentionOptions.find(opt => opt.value === newRetention);
    toast.success(`${t.retentionPolicyUpdated || 'Data retention policy updated to'} ${option?.label}`);
  };

  const handleNotificationChange = (type: string, enabled: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [type]: enabled
    }));
    const status = enabled ? (t.notificationEnabled || 'enabled') : (t.notificationDisabled || 'disabled');
    toast.success(`${type} notifications ${status}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-lg">
              <Settings className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl text-foreground">{t.systemSettings}</h1>
              <p className="text-muted-foreground">{t.configurePreferences}</p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {t.settingsSaved}
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{t.account}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>{t.security}</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>{t.system}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>{t.data}</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Card 
                  style={{ 
                    backgroundColor: 'var(--color-status-box)',
                    borderColor: 'var(--color-status-box-border)'
                  }}
                >
                  <CardHeader>
                    <CardTitle>{t.passwordManagement}</CardTitle>
                    <CardDescription>
                      {t.updateCredentials}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">{t.currentPassword}</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{t.newPassword}</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t.confirmPassword}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <Button onClick={handlePasswordChange} className="w-full">
                      {t.updatePassword}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card 
                  style={{ 
                    backgroundColor: 'var(--color-status-box)',
                    borderColor: 'var(--color-status-box-border)'
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>{t.regionLocation}</span>
                    </CardTitle>
                    <CardDescription>
                      {t.configureGeographical}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="country-select">Country</Label>
                      <Select value={selectedCountry} onValueChange={handleCountryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center space-x-2">
                                <span>{country.flag}</span>
                                <span>{country.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div 
                      className="p-3 rounded-lg border"
                      style={{ 
                        backgroundColor: 'var(--color-primary)',
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-primary-foreground)'
                      }}
                    >
                      <h4 className="text-sm mb-2 font-semibold">{t.currentLocation}</h4>
                      <p className="text-xs opacity-90 mb-1">
                        📍 {countries.find(c => c.code === selectedCountry)?.name} (Auto-detected)
                      </p>
                      <p className="text-xs opacity-75">
                        🕐 <strong>Timezone:</strong> {selectedTimezone || 'Not detected yet'}
                      </p>
                    </div>

                    {/* GPS Location Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUseCurrentLocation}
                      disabled={isLoadingGPS}
                      className="w-full py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isLoadingGPS ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Getting Location...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>Use Current Location (GPS)</span>
                        </>
                      )}
                    </motion.button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card 
                style={{ 
                  backgroundColor: 'var(--color-status-box)',
                  borderColor: 'var(--color-status-box-border)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>{t.notificationPreferences}</span>
                  </CardTitle>
                  <CardDescription>
                    {t.configureAlerts}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications">{t.emailNotifications}</Label>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notifications.email}
                          onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push-notifications">{t.pushNotifications}</Label>
                          <p className="text-sm text-muted-foreground">Browser push notifications</p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={notifications.push}
                          onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms-notifications">{t.smsAlerts}</Label>
                          <p className="text-sm text-muted-foreground">Critical alerts via SMS</p>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={notifications.sms}
                          onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="critical-alerts">{t.criticalSystemAlerts}</Label>
                          <p className="text-sm text-muted-foreground">System failures and errors</p>
                        </div>
                        <Switch
                          id="critical-alerts"
                          checked={notifications.criticalAlerts}
                          onCheckedChange={(checked) => handleNotificationChange('criticalAlerts', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Card 
                  style={{ 
                    backgroundColor: 'var(--color-status-box)',
                    borderColor: 'var(--color-status-box-border)'
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>{t.language}</span>
                    </CardTitle>
                    <CardDescription>
                      Configure the interface language settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="language">{t.language}</Label>
                      <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              <div className="flex items-center space-x-2">
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card 
                  style={{ 
                    backgroundColor: 'var(--color-status-box)',
                    borderColor: 'var(--color-status-box-border)'
                  }}
                >
                  <CardHeader>
                    <CardTitle>{t.systemConfiguration}</CardTitle>
                    <CardDescription>
                      Configure system-wide settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="refresh-rate">{t.dataRefreshRate}</Label>
                      <Select value={refreshRate} onValueChange={handleRefreshRateChange}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1s">1 Second (High CPU)</SelectItem>
                          <SelectItem value="5s">5 Seconds (Recommended)</SelectItem>
                          <SelectItem value="10s">10 Seconds</SelectItem>
                          <SelectItem value="30s">30 Seconds</SelectItem>
                          <SelectItem value="1m">1 Minute</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current refresh interval: {refreshRate === '1s' ? '1 second' : refreshRate === '5s' ? '5 seconds' : refreshRate === '10s' ? '10 seconds' : refreshRate === '30s' ? '30 seconds' : '1 minute'}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="chart-quality">{t.chartQuality}</Label>
                      <Select value={chartQuality} onValueChange={handleChartQualityChange}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Better Performance)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High (Better Visual)</SelectItem>
                          <SelectItem value="ultra">Ultra (Best Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current quality: {chartQuality === 'low' ? 'Low - optimized for performance' : chartQuality === 'medium' ? 'Medium - balanced quality' : chartQuality === 'high' ? 'High - enhanced visuals' : 'Ultra - maximum quality'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Card 
                  style={{ 
                    backgroundColor: 'var(--color-status-box)',
                    borderColor: 'var(--color-status-box-border)'
                  }}
                >
                  <CardHeader>
                    <CardTitle>{t.dataRetentionPolicy}</CardTitle>
                    <CardDescription>
                      Configure how long data is stored in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="retention-period">{t.retentionPeriod}</Label>
                      <Select value={dataRetention} onValueChange={handleDataRetentionChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {retentionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{option.label}</span>
                                <Badge variant="outline" className="ml-2">{option.storage}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm text-yellow-800 mb-1">Storage Information</h4>
                      <p className="text-xs text-yellow-700">
                        Current usage: 8.2 GB of allocated storage
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Automatic cleanup occurs based on retention policy
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card 
                  style={{ 
                    backgroundColor: 'var(--color-status-box)',
                    borderColor: 'var(--color-status-box-border)'
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trash2 className="h-5 w-5 text-destructive" />
                      <span>{t.dataManagement}</span>
                    </CardTitle>
                    <CardDescription>
                      Delete specific data sets or clear system logs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t.clearTemporaryData}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Temporary Data</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove cache, temporary files, and session data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDataDeletion('Temporary')}>
                            Clear Data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t.deleteOldLogs}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Old System Logs</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove system logs older than 30 days. Recent logs will be preserved for debugging.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDataDeletion('Old log')}>
                            Delete Logs
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t.resetAllData}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset All Data</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all sensor data, logs, and user preferences. This action cannot be undone and will reset the system to factory defaults.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDataDeletion('All system')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Reset Everything
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="text-sm text-red-800 mb-1">⚠️ Warning</h4>
                      <p className="text-xs text-red-700">
                        Data deletion operations are permanent and cannot be reversed. Please ensure you have proper backups before proceeding.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}