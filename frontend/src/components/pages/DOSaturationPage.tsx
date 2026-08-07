import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Droplets, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useTheme } from '../utils/themeContext';
import { useTranslation } from '../utils/translations';
import backend from '../utils/backend';

export default function DOSaturationPage() {
  const [data, setData] = useState<any[]>([]);
  const [currentValue, setCurrentValue] = useState('0.0');
  const [statistics, setStatistics] = useState({
    average: '0.0',
    min: '0.0',
    max: '0.0',
    trend: 'stable'
  });
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const { language, isDark, getRefreshInterval, getChartConfig } = useTheme();
  const t = useTranslation(language);

  // Initial load: fetch full 24-hour history
  useEffect(() => {
    let mounted = true;
    const initialLoad = async () => {
      try {
        const hist = await backend.getHistory(168);
        if (!mounted) return;
        const chartData = hist.map((r: any) => ({
          time: new Date(r.captured_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(r.captured_at * 1000).toLocaleDateString(),
          value: r.do_saturation != null ? Number(r.do_saturation).toFixed(1) : '0.0',
          timestamp: r.captured_at
        }));
        setData(chartData);
        
        if (hist.length > 0) {
          setLastTimestamp(hist[hist.length - 1].timestamp);
          const latest = hist[hist.length - 1];
          const latestVal = latest && latest.do_saturation != null ? Number(latest.do_saturation).toFixed(1) : '0.0';
          setCurrentValue(latestVal);
          updateStatistics(chartData);
        }
      } catch (e) {
        if (mounted) {
          setData([]);
          setCurrentValue('0.0');
          setStatistics({ average: '0.0', min: '0.0', max: '0.0', trend: 'stable' });
        }
      }
    };
    initialLoad();
    return () => { mounted = false; };
  }, []);

  // Live update: poll for new readings and append
  useEffect(() => {
    let mounted = true;
    const liveUpdate = async () => {
      try {
        const latest = await backend.getLatestReading();
        if (!mounted || !latest) return;
        
        const reading = latest.reading || latest;
        const readingTimestamp = reading.captured_at;
        
        // Only add if this is a new data point
        if (!lastTimestamp || readingTimestamp !== lastTimestamp) {
          const newDataPoint = {
            time: new Date(readingTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(readingTimestamp * 1000).toLocaleDateString(),
            value: reading.do_saturation != null ? Number(reading.do_saturation).toFixed(1) : '0.0',
            timestamp: readingTimestamp
          };
          
          setData(prevData => {
            const updated = [...prevData, newDataPoint];
            // Keep only last 24 hours of data
            const maxDataPoints = 1440; // 24 hours at 1-minute intervals
            if (updated.length > maxDataPoints) {
              return updated.slice(updated.length - maxDataPoints);
            }
            return updated;
          });
          
          setLastTimestamp(readingTimestamp);
          const latestVal = reading.do_saturation != null ? Number(reading.do_saturation).toFixed(1) : '0.0';
          setCurrentValue(latestVal);
          
          setData(currentData => {
            updateStatistics(currentData);
            return currentData;
          });
        }
      } catch (e) {
        console.warn('Live update failed:', e);
      }
    };
    
    const interval = setInterval(liveUpdate, getRefreshInterval());
    return () => { mounted = false; clearInterval(interval); };
  }, [lastTimestamp, getRefreshInterval]);

  const updateStatistics = (chartData: any[]) => {
    if (chartData.length === 0) {
      setStatistics({ average: '0.0', min: '0.0', max: '0.0', trend: 'stable' });
      return;
    }
    const values = chartData.map(d => Number(d.value));
    const avg = (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1);
    const min = Math.min(...values).toFixed(1);
    const max = Math.max(...values).toFixed(1);
    setStatistics({ average: avg, min, max, trend: Number(currentValue) > Number(avg) ? 'up' : 'down' });
  };

  const getStatusBadge = () => {
    const value = parseFloat(currentValue);
    if (value >= 90.0 && value <= 100.0) {
      return <Badge className="bg-primary/20 text-primary border-primary/30">{t.optimal}</Badge>;
    } else if (value >= 80.0 && value < 90.0) {
      return <Badge className="bg-chart-5/20 text-chart-5 border-chart-5/30">{t.warning}</Badge>;
    } else if (value > 100.0 && value <= 110.0) {
      return <Badge className="bg-chart-5/20 text-chart-5 border-chart-5/30">{t.warning}</Badge>;
    } else {
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">{t.critical}</Badge>;
    }
  };

  const statCards = [
    {
      title: t.currentReading,
      value: currentValue,
      unit: t.percent,
      icon: Droplets,
      color: 'text-chart-5',
      bgColor: 'bg-chart-5/10',
      borderColor: 'border-chart-5/30',
      description: t.parameterMonitoring
    },
    {
      title: t.average,
      value: statistics.average,
      unit: t.percent,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      description: '7-Day Average'
    },
    {
      title: t.minimum,
      value: statistics.min,
      unit: t.percent,
      icon: TrendingDown,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      borderColor: 'border-chart-4/30',
      description: '7-Day Minimum'
    },
    {
      title: t.maximum,
      value: statistics.max,
      unit: t.percent,
      icon: TrendingUp,
      color: 'text-chart-5',
      bgColor: 'bg-chart-5/10',
      borderColor: 'border-chart-5/30',
      description: '7-Day Maximum'
    }
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
              {t.doSaturation}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {t.parameterMonitoring} - {t.trendAnalysis}
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

      {/* Current Value and Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
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
                className={`${card.bgColor} ${card.borderColor} border transition-all duration-500 hover:shadow-xl hover:shadow-2xl hover:border-opacity-60 backdrop-blur-sm`}
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
                      <Icon className={`h-8 w-8 ${card.color}`} />
                    </motion.div>
                    {index === 0 && getStatusBadge()}
                    {index > 0 && (
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <TrendingUp className="h-4 w-4 text-primary/60" />
                      </motion.div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <div className="flex items-baseline space-x-1">
                      <motion.span 
                        className={`text-2xl ${card.color}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5, type: "spring" }}
                      >
                        {card.value}
                      </motion.span>
                      <span className="text-sm text-muted-foreground">{card.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Chart */}
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center space-x-2">
              <span>{t.trendAnalysis} - {t.last7Days}</span>
              <AlertCircle className="h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t.hourTrendAnalysis} - {t.doSaturation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-tr from-amber-500/5 via-transparent to-orange-500/5 rounded-lg"></div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 30, right: 60, left: 60, bottom: 80 }}>
                  <defs>
                    <linearGradient id="colorSaturation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95}/>
                      <stop offset="25%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="#d97706" stopOpacity={0.6}/>
                      <stop offset="75%" stopColor="#b45309" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#92400e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="satStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24"/>
                      <stop offset="33%" stopColor="#f59e0b"/>
                      <stop offset="66%" stopColor="#d97706"/>
                      <stop offset="100%" stopColor="#b45309"/>
                    </linearGradient>
                    <filter id="satGlow">
                      <feGaussianBlur stdDeviation="2.8" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <filter id="satShadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#fbbf24" floodOpacity="0.4"/>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="2 3" 
                    stroke="rgba(251, 191, 36, 0.2)" 
                    strokeWidth={1.4}
                    opacity={0.85}
                  />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#a1b5a1', fontWeight: 500 }}
                    stroke="url(#satStroke)"
                    strokeWidth={2}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#a1b5a1', fontWeight: 500 }}
                    stroke="url(#satStroke)"
                    strokeWidth={2}
                    domain={['dataMin - 1.0', 'dataMax + 1.0']}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 16, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      border: `2px solid rgba(251, 191, 36, 0.7)`,
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(251, 191, 36, 0.25), 0 4px 16px rgba(0, 0, 0, 0.1)',
                      color: isDark ? '#e8f5e8' : '#0f172a',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 500
                    }}
                    labelStyle={{ color: '#fbbf24', fontWeight: 600 }}
                    labelFormatter={(label) => `📈 ${label}`}
                    formatter={(value, name) => [`💧 ${value}%`, t.doSaturation]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="url(#satStroke)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSaturation)"
                    filter="url(#satShadow)"
                    dot={{ 
                      fill: '#fbbf24', 
                      strokeWidth: 3, 
                      r: 5,
                      stroke: '#ffffff',
                      filter: 'url(#satGlow)'
                    }}
                    activeDot={{ 
                      r: 8, 
                      stroke: '#fbbf24', 
                      strokeWidth: 4, 
                      fill: '#ffffff',
                      filter: 'url(#satGlow)',
                      style: { cursor: 'pointer' }
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Information */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">{t.qualityIndex}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t.statisticalAnalysis} - {t.currentReading}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm text-muted-foreground mb-2">{t.optimal} Range</h4>
                <p className="text-foreground">90.0 - 100.0 {t.percent}</p>
              </div>
              <div>
                <h4 className="text-sm text-muted-foreground mb-2">{t.qualityIndex}</h4>
                <div className="flex items-center space-x-2">
                  {getStatusBadge()}
                  <span className="text-sm text-muted-foreground">
                    {parseFloat(currentValue) >= 90.0 && parseFloat(currentValue) <= 100.0 
                      ? `System operating within ${t.optimal.toLowerCase()} parameters`
                      : `Attention required - values outside ${t.optimal.toLowerCase()} range`
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}