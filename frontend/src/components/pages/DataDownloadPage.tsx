import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Download, Calendar as CalendarIcon, FileSpreadsheet, FileText, Database, CheckCircle, Activity, HardDrive, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner@2.0.3';
import { format, subDays } from 'date-fns';
import { useTheme } from '../utils/themeContext';
import { useTranslation } from '../utils/translations';
import backend, { exportReadings, ExportFormat, ExportLog, getExportLogs } from '../utils/backend';
import { fetchDatabaseStats, calculateStoragePercentage, getStorageStatusMessage, formatBytes } from '../../utils/databaseService';
import type { DatabaseStats } from '../../utils/databaseService';

type DownloadRecord = {
  id: string;
  filename: string;
  date: string;
  size: string;
  format: ExportFormat;
  params: {
    start: string;
    end: string;
    metrics: string[];
    includeAnalytics: boolean;
    includeCharts: boolean;
    includeRaw: boolean;
    compression: boolean;
  };
};

const parameterMetricMap: Record<string, string> = {
  oldDO: 'do_concentration',
  newDO: 'corrected_do',
  temperature: 'temperature',
  pressure: 'pressure',
  doSaturation: 'do_saturation'
};

export default function DataDownloadPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedParameters, setSelectedParameters] = useState({
    oldDO: true,
    newDO: true,
    temperature: true,
    pressure: true,
    doSaturation: true
  });
  const [fileFormat, setFileFormat] = useState<ExportFormat>('csv');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(false);
  const [compression, setCompression] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  const { language, isDark } = useTheme();
  const t = useTranslation(language);

  // Load database stats on mount
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      const stats = await fetchDatabaseStats();
      setDbStats(stats);
      setIsLoadingStats(false);
    };
    loadStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load export logs from backend
  useEffect(() => {
    const loadExportLogs = async () => {
      try {
        const logs = await getExportLogs();
        const formattedLogs: DownloadRecord[] = logs.map((log) => ({
          id: log.id.toString(),
          filename: log.filename,
          date: new Date(log.created_at * 1000).toISOString(),
          size: formatBytes(log.file_size),
          format: log.format as ExportFormat,
          params: {
            start: new Date(log.start_date * 1000).toISOString(),
            end: new Date(log.end_date * 1000).toISOString(),
            metrics: JSON.parse(log.metrics),
            includeAnalytics: log.include_analytics,
            includeCharts: log.include_charts,
            includeRaw: log.include_raw,
            compression: log.compression,
          },
        }));
        setDownloadHistory(formattedLogs);
      } catch (err) {
        console.error('Failed to load export logs:', err);
      }
    };
    loadExportLogs();
  }, []);

  const parameters = [
    { id: 'oldDO', label: t.oldDOConcentration, unit: t.mgL, icon: '📊', color: 'text-chart-2' },
    { id: 'newDO', label: t.newDOConcentration, unit: t.mgL, icon: '📈', color: 'text-primary' },
    { id: 'temperature', label: t.temperature, unit: t.celsius, icon: '🌡️', color: 'text-chart-4' },
    { id: 'pressure', label: t.pressure, unit: t.kPa, icon: '⚡', color: 'text-chart-3' },
    { id: 'doSaturation', label: t.doSaturation, unit: t.percent, icon: '💧', color: 'text-chart-5' }
  ];

  const fileFormats = [
    { value: 'csv', label: t.csv, description: 'Comma-separated values', icon: FileSpreadsheet },
    { value: 'xlsx', label: t.excel, description: 'Microsoft Excel format', icon: FileSpreadsheet },
    { value: 'json', label: t.json, description: 'JavaScript Object Notation', icon: FileText },
    { value: 'pdf', label: t.pdf, description: 'Formatted report document', icon: FileText }
  ];

  const dateRangeOptions = [
    { label: t.today, days: 0 },
    { label: t.thisWeek, days: 7 },
    { label: t.thisMonth, days: 30 },
    { label: t.last30Days, days: 30 },
    { label: t.last90Days, days: 90 }
  ];

  const handleParameterChange = (parameterId: string, checked: boolean) => {
    setSelectedParameters(prev => ({
      ...prev,
      [parameterId]: checked
    }));
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    const metrics = Object.entries(selectedParameters)
      .filter(([, checked]) => Boolean(checked))
      .map(([key]) => parameterMetricMap[key as keyof typeof parameterMetricMap])
      .filter(Boolean);

    if (!metrics.length) {
      toast.error('Please select at least one parameter to download.');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }

    if (startDate.getTime() > endDate.getTime()) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(8);
    toast(`${t.downloadData} started...`);

    try {
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      const exportOptions = {
        format: fileFormat as ExportFormat,
        metrics,
        start: startIso,
        end: endIso,
        includeAnalytics: includeAnalytics || includeCharts,
        includeCharts,
        includeRaw: includeRawData,
        compression,
      };

      const blob = await exportReadings(exportOptions);
      setDownloadProgress(85);

      const extension = compression ? `${fileFormat}.gz` : fileFormat;
      const filename = `DO_Sensor_Data_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}.${extension}`;

      triggerDownload(blob, filename);
      setDownloadProgress(100);

      // Refresh export logs from backend
      const logs = await getExportLogs();
      const formattedLogs: DownloadRecord[] = logs.map((log) => ({
        id: log.id.toString(),
        filename: log.filename,
        date: new Date(log.created_at * 1000).toISOString(),
        size: formatBytes(log.file_size),
        format: log.format as ExportFormat,
        params: {
          start: new Date(log.start_date * 1000).toISOString(),
          end: new Date(log.end_date * 1000).toISOString(),
          metrics: JSON.parse(log.metrics),
          includeAnalytics: log.include_analytics,
          includeCharts: log.include_charts,
          includeRaw: log.include_raw,
          compression: log.compression,
        },
      }));
      setDownloadHistory(formattedLogs);

      toast.success(`${t.downloadData} completed successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Export failed: backend unreachable or error occurred.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleRepeatDownload = async (record: DownloadRecord) => {
    setIsDownloading(true);
    setDownloadProgress(8);
    toast(`Re-downloading ${record.filename}...`);

    try {
      const blob = await exportReadings({
        format: record.format,
        metrics: record.params.metrics,
        start: record.params.start,
        end: record.params.end,
        includeAnalytics: record.params.includeAnalytics,
        includeCharts: record.params.includeCharts,
        includeRaw: record.params.includeRaw,
        compression: record.params.compression,
      });

      setDownloadProgress(85);
      triggerDownload(blob, record.filename);
      setDownloadProgress(100);
      toast.success(`Download ready: ${record.filename}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to re-download file.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const getEstimatedFileSize = () => {
    const selectedCount = Object.values(selectedParameters).filter(Boolean).length;
    const daysDiff = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    let baseSize = selectedCount * daysDiff * 0.1;
    
    if (includeCharts) baseSize += 0.5;
    if (includeAnalytics) baseSize += 1.0;
    if (compression) baseSize *= 0.3;
    
    return `~${baseSize.toFixed(1)} MB`;
  };

  const quickDateSelect = (days: number) => {
    if (days === 0) {
      setStartDate(new Date());
      setEndDate(new Date());
    } else {
      setStartDate(subDays(new Date(), days));
      setEndDate(new Date());
    }
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
              {t.dataExportTools}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {t.downloadData} - Export sensor data and generate reports
            </motion.p>
          </div>
          <motion.div 
            className="flex items-center space-x-2 text-primary bg-primary/10 px-3 py-2 rounded-lg border border-primary/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
          >
            <Database className="h-5 w-5" />
            <span className="text-sm">Database: Online</span>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Download Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Database Stats Card */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.6 }}
          >
            <Card 
              className="border-border/50 bg-linear-to-br from-primary/5 to-primary/10 backdrop-blur-sm hover:shadow-xl transition-all duration-500"
              style={{ 
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <HardDrive className="h-5 w-5 text-primary" />
                    <span>Database Statistics</span>
                  </CardTitle>
                  {!isLoadingStats && dbStats && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Updated now
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-6">
                    <Activity className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Loading database statistics...</span>
                  </div>
                ) : dbStats ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Records</div>
                        <div className="text-2xl font-bold text-foreground">{dbStats.total_records.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          ~{dbStats.average_records_per_day.toFixed(0)} per day
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Storage Used</div>
                        <div className="text-2xl font-bold text-foreground">{dbStats.total_size_mb.toFixed(2)} MB</div>
                        <div className="text-xs text-muted-foreground">
                          Retention: {dbStats.retention_days} days
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Data Range</span>
                        <span className="text-foreground text-xs">
                          {dbStats.oldest_record !== 'N/A' ? format(new Date(dbStats.oldest_record), 'MMM dd') : 'N/A'}
                          {' '}-{' '}
                          {dbStats.newest_record !== 'N/A' ? format(new Date(dbStats.newest_record), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {dbStats.data_points && dbStats.data_points.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="text-xs font-semibold text-foreground mb-2">Data Distribution</div>
                        <div className="space-y-1">
                          {dbStats.data_points.slice(0, 3).map((point) => (
                            <div key={point.parameter} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">{point.parameter}</span>
                              <span className="text-foreground font-medium">{point.count} points</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Unable to load database statistics
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          {/* Date Range Selection */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Card 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span>{t.dateRange}</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t.selectRange}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">{t.startDate}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'MMM dd, yyyy') : `Select ${t.startDate.toLowerCase()}`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">{t.endDate}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'MMM dd, yyyy') : `Select ${t.endDate.toLowerCase()}`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {dateRangeOptions.map((option) => (
                    <Button 
                      key={option.label}
                      variant="outline" 
                      size="sm" 
                      onClick={() => quickDateSelect(option.days)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Parameter Selection */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">Parameter Selection</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Choose which sensor parameters to include in the export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parameters.map((param) => (
                    <div key={param.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                      <Checkbox
                        id={param.id}
                        checked={selectedParameters[param.id as keyof typeof selectedParameters]}
                        onCheckedChange={(checked) => handleParameterChange(param.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={param.id} className="text-sm cursor-pointer flex items-center space-x-2">
                          <span className="text-lg">{param.icon}</span>
                          <span className="text-foreground">{param.label}</span>
                          <Badge variant="outline" className="text-xs">{param.unit}</Badge>
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Export Options */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">{t.exportFormat}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t.selectFormat} and additional options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">{t.exportFormat}</Label>
                  <Select value={fileFormat} onValueChange={(val) => setFileFormat(val as ExportFormat)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectFormat} />
                    </SelectTrigger>
                    <SelectContent>
                      {fileFormats.map((format) => {
                        const Icon = format.icon;
                        return (
                          <SelectItem key={format.value} value={format.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="text-sm">{format.label}</div>
                                <div className="text-xs text-muted-foreground">{format.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-charts" className="text-sm text-foreground">{t.includeCharts}</Label>
                    <Switch
                      id="include-charts"
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-raw" className="text-sm text-foreground">{t.includeRawData}</Label>
                    <Switch
                      id="include-raw"
                      checked={includeRawData}
                      onCheckedChange={setIncludeRawData}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-analytics" className="text-sm text-foreground">{t.includeAnalytics}</Label>
                    <Switch
                      id="include-analytics"
                      checked={includeAnalytics}
                      onCheckedChange={setIncludeAnalytics}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compression" className="text-sm text-foreground">{t.compression}</Label>
                    <Switch
                      id="compression"
                      checked={compression}
                      onCheckedChange={setCompression}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Download Summary & History */}
        <div className="space-y-6">
          {/* Download Summary */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">Download Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected Parameters:</span>
                    <span className="text-foreground">{Object.values(selectedParameters).filter(Boolean).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.dateRange}:</span>
                    <span className="text-foreground">{startDate && endDate ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days` : 'Not set'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="text-foreground uppercase">{fileFormat}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. File Size:</span>
                    <span className="text-foreground">{getEstimatedFileSize()}</span>
                  </div>
                </div>
                
                {isDownloading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">Downloading...</span>
                      <span className="text-foreground">{Math.round(downloadProgress)}%</span>
                    </div>
                    <Progress value={downloadProgress} className="w-full" />
                  </div>
                )}
                
                <Button 
                  onClick={handleDownload} 
                  className="w-full"
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : t.downloadData}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Download History */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader>
                <CardTitle className="text-foreground">Recent Downloads</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your download history and completed exports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {downloadHistory.length === 0 && (
                    <div className="text-sm text-muted-foreground">No downloads yet. Start an export to see it here.</div>
                  )}

                  {downloadHistory.map((download) => (
                    <div key={download.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex-1">
                        <div className="text-sm text-foreground truncate">{download.filename}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(download.date), 'yyyy-MM-dd HH:mm')} • {download.size} • {download.format.toUpperCase()}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <Button variant="ghost" size="sm" onClick={() => handleRepeatDownload(download)} disabled={isDownloading}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}