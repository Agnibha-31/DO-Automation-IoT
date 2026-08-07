import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Gauge, GaugeCircle, Thermometer, Zap, Droplets, TrendingUp, Activity } from 'lucide-react';
import { useTheme } from '../utils/themeContext';
import { useTranslation } from '../utils/translations';
import backend from '../utils/backend';
import { detectLocationAndTimezone } from '../../services/timezoneService';

// No mock data: frontend relies on backend. Charts will be empty until backend provides history.

export default function HomePage() {
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [currentReadings, setCurrentReadings] = useState({
    oldDO: '0.00',
    newDO: '0.00',
    temperature: '0.0',
    pressure: '0.0',
    doSaturation: '0.0'
  });
  const { language, isDark, getRefreshInterval, getChartConfig, setTimezone, setLocationInfo } = useTheme();
  const t = useTranslation(language);

  useEffect(() => {
    const refreshInterval = getRefreshInterval();
    
    // Poll backend for latest reading; fall back to mock data when backend unavailable
    let isMounted = true;
    const fetchAndUpdate = async () => {
      try {
        const latestResp = await backend.getLatestReading();
        if (!isMounted) return;
        const latest = latestResp?.reading || latestResp || null;
        setCurrentReadings({
          oldDO: latest && latest.do_concentration != null ? Number(latest.do_concentration).toFixed(2) : '0.00',
          newDO: latest && latest.corrected_do != null ? Number(latest.corrected_do).toFixed(2) : '0.00',
          temperature: latest && latest.temperature != null ? Number(latest.temperature).toFixed(1) : '0.0',
          pressure: latest && latest.pressure != null ? Number(latest.pressure).toFixed(1) : '0.0',
          doSaturation: latest && latest.do_saturation != null ? Number(latest.do_saturation).toFixed(1) : '0.0'
        });
        // Do not populate `sensorData` with mock series. Leave charts empty until backend provides history endpoint.
      } catch (err) {
        // Backend unavailable — set values to zero
        if (!isMounted) return;
        setSensorData([]);
        setCurrentReadings({
          oldDO: '0.00',
          newDO: '0.00',
          temperature: '0.0',
          pressure: '0.0',
          doSaturation: '0.0'
        });
      }
    };

    fetchAndUpdate();
    const interval = setInterval(fetchAndUpdate, refreshInterval);

    return () => { isMounted = false; clearInterval(interval); };
  }, [getRefreshInterval]);

  // Load recent history for charts so they render real data instead of staying empty
  useEffect(() => {
    let isMounted = true;

    const mapHistoryToChart = (rows: any[]) =>
      rows.map((row) => ({
        time: new Date(row.captured_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        oldDO: row.do_concentration ?? null,
        newDO: row.corrected_do ?? null,
        temperature: row.temperature ?? null,
        pressure: row.pressure ?? null,
        doSaturation: row.do_saturation ?? null,
      }));

    const loadHistory = async () => {
      try {
        const history = await backend.getHistory(500);
        if (!isMounted) return;
        setSensorData(mapHistoryToChart(history || []));
      } catch (err) {
        if (!isMounted) return;
        setSensorData([]);
      }
    };

    loadHistory();
    const refreshMs = Math.max(getRefreshInterval() * 3, 60000);
    const interval = setInterval(loadHistory, refreshMs);

    return () => { isMounted = false; clearInterval(interval); };
  }, [getRefreshInterval]);

  // Auto-detect user's location and timezone on component mount
  // BUT do not overwrite a user-confirmed location saved in localStorage
  useEffect(() => {
    let isMounted = true;

    // Respect existing persisted location (set from Settings page)
    const savedLocation = localStorage.getItem('do_sensor_location');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed?.city && parsed?.city !== 'Unknown') {
          return () => { isMounted = false; };
        }
      } catch (err) {
        // fallthrough to detection
      }
    }
    
    const detectLocation = async () => {
      try {
        const result = await detectLocationAndTimezone((location) => {
          if (isMounted) {
            setTimezone(location.timezone);
            setLocationInfo((prev: any) => ({
              ...prev,
              latitude: location.latitude,
              longitude: location.longitude,
              timezone: location.timezone
            }));
            console.log(`Timezone auto-detected: ${location.timezone} (${location.latitude}, ${location.longitude})`);
          }
        });
        
        if (!result) {
          console.log('Could not detect location - will use browser timezone');
        }
      } catch (error) {
        console.warn('Location detection failed:', error);
      }
    };
    
    detectLocation();
    
    return () => {
      isMounted = false;
    };
  }, [setTimezone, setLocationInfo]);

  const sensorCards = [
    {
      title: t.oldDOConcentration,
      value: currentReadings.oldDO,
      unit: t.mgL,
      icon: Gauge,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
      borderColor: 'border-chart-2/30',
      glowColor: 'shadow-chart-2/20'
    },
    {
      title: t.newDOConcentration,
      value: currentReadings.newDO,
      unit: t.mgL,
      icon: GaugeCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      glowColor: 'shadow-primary/20'
    },
    {
      title: t.temperature,
      value: currentReadings.temperature,
      unit: t.celsius,
      icon: Thermometer,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      borderColor: 'border-chart-4/30',
      glowColor: 'shadow-chart-4/20'
    },
    {
      title: t.pressure,
      value: currentReadings.pressure,
      unit: t.kPa,
      icon: Zap,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
      borderColor: 'border-chart-3/30',
      glowColor: 'shadow-chart-3/20'
    },
    {
      title: t.doSaturation,
      value: currentReadings.doSaturation,
      unit: t.percent,
      icon: Droplets,
      color: 'text-chart-5',
      bgColor: 'bg-chart-5/10',
      borderColor: 'border-chart-5/30',
      glowColor: 'shadow-chart-5/20'
    }
  ];

  const chartConfigs = [
    { dataKey: 'oldDO', name: t.oldDOConcentration, color: '#22d3ee' },
    { dataKey: 'newDO', name: t.newDOConcentration, color: '#4ade80' },
    { dataKey: 'temperature', name: t.temperature, color: '#fb7185' },
    { dataKey: 'pressure', name: t.pressure, color: '#a78bfa' },
    { dataKey: 'doSaturation', name: t.doSaturation, color: '#fbbf24' }
  ];

  return (
    <div className="space-y-6 min-h-full">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h1 
              className="text-3xl text-foreground mb-2"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {t.dashboardOverview}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {t.realTimeMonitoring}
            </motion.p>
          </div>
          <motion.div 
            className="flex items-center space-x-2 text-primary bg-primary/10 px-3 py-2 rounded-lg border border-primary/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
          >
            <Activity className="h-5 w-5 animate-pulse" />
            <span className="text-sm">{t.liveData}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Current Readings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {sensorCards.map((sensor, index) => {
          const Icon = sensor.icon;
          return (
            <motion.div
              key={sensor.title}
              initial={{ y: 30, opacity: 0, rotateY: -10 }}
              animate={{ y: 0, opacity: 1, rotateY: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.03, 
                rotateY: 2,
                transition: { duration: 0.3 }
              }}
              className="cursor-pointer"
            >
              <Card 
                className={`${sensor.bgColor} ${sensor.borderColor} border transition-all duration-500 hover:shadow-xl ${sensor.glowColor} hover:shadow-2xl hover:border-opacity-60 backdrop-blur-sm`}
                style={{ 
                  backgroundColor: 'var(--color-status-box)',
                  borderColor: 'var(--color-status-box-border)'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className={`h-8 w-8 ${sensor.color}`} />
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="h-4 w-4 text-primary/60" />
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{sensor.title}</p>
                    <div className="flex items-baseline space-x-1">
                      <motion.span 
                        className={`text-2xl ${sensor.color}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5, type: "spring" }}
                      >
                        {sensor.value}
                      </motion.span>
                      <span className="text-sm text-muted-foreground">{sensor.unit}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartConfigs.map((config, index) => {
          const chartConfig = getChartConfig();
          return (
            <motion.div
              key={config.dataKey}
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.15, duration: 0.7, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">{config.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t.hourTrendAnalysis} ({t.updatesEvery24Hours})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensorData}>
                        <CartesianGrid 
                          strokeDasharray={chartConfig.quality >= 1 ? "3 3" : "5 5"} 
                          stroke={`rgba(34, 197, 94, ${0.1 * chartConfig.quality})`} 
                        />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12, fill: '#a1b5a1' }}
                          stroke={`rgba(34, 197, 94, ${0.3 * chartConfig.quality})`}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#a1b5a1' }}
                          stroke={`rgba(34, 197, 94, ${0.3 * chartConfig.quality})`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDark ? '#0f1710' : '#ffffff',
                            border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(16, 163, 74, 0.3)'}`,
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                            color: isDark ? '#e8f5e8' : '#0f172a'
                          }}
                          animationDuration={chartConfig.animationDuration}
                        />
                        <Line
                          type="monotone"
                          dataKey={config.dataKey}
                          stroke={config.color}
                          strokeWidth={chartConfig.strokeWidth}
                          dot={{ 
                            fill: config.color, 
                            strokeWidth: Math.max(1, chartConfig.strokeWidth - 1), 
                            r: chartConfig.dotSize 
                          }}
                          activeDot={{ 
                            r: chartConfig.activeDotSize, 
                            stroke: config.color, 
                            strokeWidth: chartConfig.strokeWidth, 
                            fill: config.color 
                          }}
                          animationDuration={chartConfig.animationDuration}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}