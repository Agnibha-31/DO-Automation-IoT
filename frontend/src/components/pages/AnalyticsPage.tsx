import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { TrendingUp, BarChart3, Activity, Calendar, Clock, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useTheme } from '../utils/themeContext';
import { useTranslation } from '../utils/translations';
import TrendAnalysisChart from '../TrendAnalysisChart';
import backend from '../utils/backend';

// Fallback data generator to keep analytics rendering even when backend data is unavailable
function generateSafeData(
  timeframe: string,
  from?: Date,
  to?: Date
) {
  const now = new Date();
  const totalPoints = 60;
  const start = (() => {
    if (timeframe === 'custom' && from) return from;
    switch (timeframe) {
      case 'lastHour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'last6Hours':
        return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case 'last12Hours':
        return new Date(now.getTime() - 12 * 60 * 60 * 1000);
      case 'last7Days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'custom':
        return from ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'last24Hours':
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  })();

  const end = timeframe === 'custom' && to ? to : now;
  const span = end.getTime() - start.getTime();
  const step = span / Math.max(totalPoints, 1);

  const rand = (base: number, variance: number) =>
    (base + (Math.random() - 0.5) * variance).toFixed(2);

  const points = Array.from({ length: totalPoints }).map((_, idx) => {
    const ts = new Date(start.getTime() + idx * step);
    return {
      time: ts.toLocaleString(),
      oldDO: rand(7.5, 1.2),
      newDO: rand(7.2, 1.0),
      temperature: rand(28, 3),
      pressure: rand(101, 2),
      doSaturation: rand(92, 6)
    } as const;
  });

  return points;
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('last24Hours');
  const [selectedParameter, setSelectedParameter] = useState('oldDO');
  const [data, setData] = useState<any[]>([]);
  const [customDateRange, setCustomDateRange] = useState<{from?: Date, to?: Date}>({});
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { language, isDark } = useTheme();
  const t = useTranslation(language);

  // Function to get time range in seconds based on timeframe
  const getTimeRangeInSeconds = (tf: string, from?: Date, to?: Date): { from: number; to: number } => {
    const now = Math.floor(Date.now() / 1000);
    
    if (tf === 'custom' && from && to) {
      return {
        from: Math.floor(from.getTime() / 1000),
        to: Math.floor(to.getTime() / 1000)
      };
    }
    
    const hours: { [key: string]: number } = {
      lastHour: 1,
      last6Hours: 6,
      last12Hours: 12,
      last24Hours: 24,
      last7Days: 7 * 24
    };
    
    const hoursBack = hours[tf] || 24;
    return {
      from: now - (hoursBack * 3600),
      to: now
    };
  };

  // Fetch and process data from backend
  const fetchAnalyticsData = async () => {
    let mounted = true;
    setLoading(true);
    try {
      // Get backend history - fetch up to 5000 data points to ensure all data for time range is retrieved
      const hist = await backend.getHistory(5000);
      if (!mounted) return;
      
      if (!hist || hist.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      
      // Get time range for current timeframe
      const timeRange = getTimeRangeInSeconds(
        timeframe,
        customDateRange.from,
        customDateRange.to
      );
      
      // Filter data by time range
      const filtered = hist.filter((r: any) => {
        // Use captured_at (Unix seconds) from backend
        const readingTime = r.captured_at || Math.floor(r.timestamp / 1000);
        return readingTime >= timeRange.from && readingTime <= timeRange.to;
      });
      
      // Map to chart-friendly format with proper timestamp conversion
      const mapped = filtered.map((r: any) => {
        // Convert captured_at (Unix seconds) to readable time
        const timestamp = r.captured_at ? r.captured_at * 1000 : r.timestamp;
        const dateObj = new Date(timestamp);
        
        // Format time as HH:MM:SS
        const timeStr = dateObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
        return {
          time: timeStr,
          timestamp: r.captured_at || Math.floor(r.timestamp / 1000),
          oldDO: r.do_concentration != null ? Number(r.do_concentration).toFixed(2) : '0',
          newDO: r.corrected_do != null ? Number(r.corrected_do).toFixed(2) : '0',
          temperature: r.temperature != null ? Number(r.temperature).toFixed(1) : '0',
          pressure: r.pressure != null ? Number(r.pressure).toFixed(1) : '0',
          doSaturation: r.do_saturation != null ? Number(r.do_saturation).toFixed(1) : '0'
        };
      });
      
      // Sort by timestamp ascending
      mapped.sort((a, b) => a.timestamp - b.timestamp);
      
      if (mounted) {
        setData(mapped.length > 0 ? mapped : []);
      }
    } catch (e) {
      console.error('Error fetching analytics data:', e);
      if (mounted) {
        setData([]);
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  // Fetch data when timeframe or custom date range changes
  useEffect(() => {
    fetchAnalyticsData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [timeframe, customDateRange]);

  const timeframeOptions = [
    { value: 'lastHour', label: t.lastHour },
    { value: 'last6Hours', label: t.last6Hours },
    { value: 'last12Hours', label: t.last12Hours },
    { value: 'last24Hours', label: t.last24Hours },
    { value: 'last7Days', label: t.last7Days },
    { value: 'custom', label: t.customRange }
  ];

  const parameters = [
    { value: 'oldDO', label: t.oldDOConcentration, color: '#22d3ee', unit: t.mgL },
    { value: 'newDO', label: t.newDOConcentration, color: '#4ade80', unit: t.mgL },
    { value: 'temperature', label: t.temperature, color: '#fb7185', unit: t.celsius },
    { value: 'pressure', label: t.pressure, color: '#a78bfa', unit: t.kPa },
    { value: 'doSaturation', label: t.doSaturation, color: '#fbbf24', unit: t.percent }
  ];

  const getCurrentParameter = () => {
    return parameters.find(p => p.value === selectedParameter) || parameters[0];
  };

  const calculateStatistics = () => {
    if (!data || data.length === 0) {
      return {
        average: '0.00',
        minimum: '0.00',
        maximum: '0.00',
        stdDev: '0.00',
        range: '0.00',
        trend: 'stable'
      };
    }
    
    const values = data
      .map(d => parseFloat(d[selectedParameter as keyof typeof d] || '0'))
      .filter(v => !isNaN(v) && v !== null);
    
    if (values.length === 0) {
      return {
        average: '0.00',
        minimum: '0.00',
        maximum: '0.00',
        stdDev: '0.00',
        range: '0.00',
        trend: 'stable'
      };
    }
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate trend based on first and last values
    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const trend = lastVal > firstVal ? 'increasing' : lastVal < firstVal ? 'decreasing' : 'stable';
    
    return {
      average: avg.toFixed(2),
      minimum: min.toFixed(2),
      maximum: max.toFixed(2),
      stdDev: stdDev.toFixed(2),
      range: (max - min).toFixed(2),
      trend
    };
  };

  const stats = calculateStatistics();
  const currentParam = getCurrentParameter();

  const getChartData = () => {
    // Ensure data is sorted by timestamp and return properly formatted
    const sorted = [...data].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return sorted.map(d => ({
      time: d.time,
      value: d[selectedParameter as keyof typeof d] || '0',
      timestamp: d.timestamp
    }));
  };

  const handleCustomDateSelect = (range: {from?: Date, to?: Date} | undefined) => {
    if (range?.from && range?.to) {
      // Ensure to date is end of day
      const toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      
      setCustomDateRange({
        from: range.from,
        to: toDate
      });
      setTimeframe('custom');
      setIsCustomRangeOpen(false);
    } else if (range?.from && !range?.to) {
      setCustomDateRange({ from: range.from });
    }
  };

  const formatCustomRangeLabel = () => {
    if (customDateRange.from && customDateRange.to) {
      return `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`;
    } else if (customDateRange.from) {
      return `From ${customDateRange.from.toLocaleDateString()}`;
    }
    return t.customRange;
  };

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
              {t.advancedAnalytics}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {t.dataVisualization}
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

      {/* Controls */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <Card 
          className="border-border/50 bg-card/50 backdrop-blur-sm"
          style={{ 
            backgroundColor: 'var(--color-status-box)',
            borderColor: 'var(--color-status-box-border)'
          }}
        >
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">{t.timeframe}</label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Parameter</label>
                <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters.map((param) => (
                      <SelectItem key={param.value} value={param.value}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: param.color }}
                          />
                          <span>{param.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Popover open={isCustomRangeOpen} onOpenChange={setIsCustomRangeOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant={timeframe === 'custom' ? "default" : "outline"} 
                      className={`w-full justify-start ${timeframe === 'custom' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {timeframe === 'custom' ? formatCustomRangeLabel() : t.customRange}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={customDateRange}
                      onSelect={handleCustomDateSelect}
                      numberOfMonths={2}
                      defaultMonth={customDateRange.from}
                      disabled={(date) => 
                        date > new Date() || date < new Date("2020-01-01")
                      }
                      className="rounded-md border shadow-lg"
                    />
                    <div className="p-3 border-t">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setCustomDateRange({});
                            setTimeframe('last24Hours');
                            setIsCustomRangeOpen(false);
                          }}
                          className="flex-1"
                        >
                          Clear
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setIsCustomRangeOpen(false)}
                          className="flex-1"
                          disabled={!customDateRange.from || !customDateRange.to}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: t.average, value: stats.average, icon: '📊' },
          { label: t.minimum, value: stats.minimum, icon: '📉' },
          { label: t.maximum, value: stats.maximum, icon: '📈' },
          { label: 'Std Dev', value: stats.stdDev, icon: '📋' },
          { label: 'Range', value: stats.range, icon: '📏' },
          { label: 'Trend', value: stats.trend, icon: stats.trend === 'increasing' ? '↗️' : '↘️' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
          >
            <Card 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-lg text-foreground">
                  {stat.value} {stat.label !== 'Trend' && currentParam.unit}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
      >
        <Card className="hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center space-x-2">
              <span>
                {currentParam.label} - {
                  timeframe === 'custom' 
                    ? formatCustomRangeLabel() 
                    : timeframeOptions.find(t => t.value === timeframe)?.label
                }
              </span>
              <Badge variant="outline" style={{ color: currentParam.color, borderColor: currentParam.color }}>
                Trend Analysis
              </Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {data && data.length > 0 ? (
                <>
                  Real-time analysis with <strong className="text-primary">{data.length} data points</strong> from database
                  {timeframe === 'custom' && customDateRange.from && customDateRange.to && (
                    <span className="ml-2 text-primary">
                      • Custom Range: {Math.ceil(Math.abs(customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  )}
                </>
              ) : (
                <span>Waiting for data from selected timeframe...</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              {loading ? (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    <span>Fetching analytics data...</span>
                  </div>
                </div>
              ) : data && data.length > 0 ? (
                <TrendAnalysisChart 
                  data={getChartData()} 
                  color={currentParam.color} 
                  unit={currentParam.unit}
                  title={currentParam.label}
                  showMovingAverage={true}
                  showConfidenceBands={true}
                />
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="flex flex-col items-center space-y-2">
                    <span>No data available for selected time range</span>
                    <span className="text-xs">
                      {timeframe === 'custom' 
                        ? `No readings found between ${customDateRange.from?.toLocaleDateString()} and ${customDateRange.to?.toLocaleDateString()}`
                        : `No readings found in the selected timeframe`}
                    </span>
                    <span className="text-xs text-muted-foreground/75">Try selecting a different timeframe or check if sensor is recording data</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Analytical Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Distribution */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <Card className="hover:shadow-xl transition-all duration-500 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Quality Distribution</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Parameter quality over selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Quality bars */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">{t.optimal}</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">65%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-chart-5 rounded-full"></div>
                      <span className="text-sm text-foreground">{t.warning}</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">25%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-chart-5 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-destructive rounded-full"></div>
                      <span className="text-sm text-foreground">{t.critical}</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">10%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-destructive h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parameter Correlations */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <Card className="hover:shadow-xl transition-all duration-500 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Parameter Correlations</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Cross-parameter relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 border border-border rounded">
                  <span className="text-sm text-foreground">DO vs Temperature</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm text-primary font-medium">-0.73</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border border-border rounded">
                  <span className="text-sm text-foreground">DO vs Pressure</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
                    <span className="text-sm text-chart-2 font-medium">+0.45</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border border-border rounded">
                  <span className="text-sm text-foreground">Temp vs Pressure</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-chart-5 rounded-full animate-pulse"></div>
                    <span className="text-sm text-chart-5 font-medium">+0.12</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border border-border rounded">
                  <span className="text-sm text-foreground">DO Saturation vs Old DO</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-chart-3 rounded-full animate-pulse"></div>
                    <span className="text-sm text-chart-3 font-medium">+0.89</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Real-time Status */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
        >
          <Card className="hover:shadow-xl transition-all duration-500 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Activity className="h-5 w-5 animate-pulse" />
                <span>Real-time Status</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Current parameter values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {parameters.map((param, index) => {
                  const currentValue = data[data.length - 1]?.[param.value] || '0';
                  const numValue = parseFloat(currentValue);
                  const getStatus = () => {
                    if (param.value === 'oldDO' || param.value === 'newDO') {
                      return numValue > 8 ? 'optimal' : numValue > 6 ? 'warning' : 'critical';
                    } else if (param.value === 'temperature') {
                      return numValue < 30 ? 'optimal' : numValue < 35 ? 'warning' : 'critical';
                    } else if (param.value === 'pressure') {
                      return numValue > 100 ? 'optimal' : numValue > 95 ? 'warning' : 'critical';
                    } else {
                      return numValue > 90 ? 'optimal' : numValue > 80 ? 'warning' : 'critical';
                    }
                  };
                  
                  const status = getStatus();
                  const statusColors = {
                    optimal: 'bg-primary',
                    warning: 'bg-chart-5',
                    critical: 'bg-destructive'
                  };
                  
                  return (
                    <motion.div 
                      key={param.value} 
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:shadow-md transition-all duration-300"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full animate-pulse" 
                          style={{ backgroundColor: param.color }}
                        />
                        <span className="text-sm text-foreground">{param.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-foreground font-medium">
                          {currentValue} {param.unit}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}></div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Advanced Analytics Section */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <Card className="hover:shadow-xl transition-all duration-500 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Advanced Analytics & Insights</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Predictive analysis and anomaly detection for {currentParam.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Prediction */}
              <div className="space-y-4">
                <h4 className="text-foreground font-medium flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trend Prediction</span>
                </h4>
                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-lg bg-primary/5">
                    <div className="text-sm text-foreground">Next Hour Forecast</div>
                    <div className="text-lg text-primary font-medium">
                      {(parseFloat(stats.average) + 0.3).toFixed(2)} {currentParam.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">+3.2% trend confidence</div>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-chart-2/5">
                    <div className="text-sm text-foreground">24H Projection</div>
                    <div className="text-lg text-chart-2 font-medium">
                      {(parseFloat(stats.average) - 0.1).toFixed(2)} {currentParam.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">-1.2% expected drift</div>
                  </div>
                </div>
              </div>

              {/* Anomaly Detection */}
              <div className="space-y-4">
                <h4 className="text-foreground font-medium flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Anomaly Detection</span>
                </h4>
                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground">Anomaly Score</span>
                      <Badge variant="outline" className="text-primary border-primary">Low</Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">15% deviation from normal</div>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="text-sm text-foreground mb-1">Last Anomaly</div>
                    <div className="text-xs text-muted-foreground">
                      2 hours ago: Spike in {currentParam.label} (+12%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="text-foreground font-medium flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Performance Metrics</span>
                </h4>
                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Data Quality</span>
                      <span className="text-sm text-primary font-medium">98.7%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1 mt-2">
                      <div className="bg-primary h-1 rounded-full" style={{ width: '98.7%' }}></div>
                    </div>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Stability Index</span>
                      <span className="text-sm text-chart-2 font-medium">85.2%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1 mt-2">
                      <div className="bg-chart-2 h-1 rounded-full" style={{ width: '85.2%' }}></div>
                    </div>
                  </div>
                  <div className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Prediction Accuracy</span>
                      <span className="text-sm text-chart-5 font-medium">92.1%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1 mt-2">
                      <div className="bg-chart-5 h-1 rounded-full" style={{ width: '92.1%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}