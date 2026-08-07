import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTheme } from './utils/themeContext';
import { useTranslation } from './utils/translations';

interface DataPoint {
  time: string;
  value: string;
}

interface TrendAnalysisChartProps {
  data: DataPoint[];
  color: string;
  unit: string;
  title?: string;
  showMovingAverage?: boolean;
  showConfidenceBands?: boolean;
}

// Helper function to interpolate between two values
const interpolateValue = (leftValue: number, rightValue: number, factor: number): number => {
  return leftValue + (rightValue - leftValue) * factor;
};

// Helper function to interpolate time strings
const interpolateTime = (leftTime: string, rightTime: string, factor: number): string => {
  if (factor <= 0.5) return leftTime;
  return rightTime;
};

const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({
  data,
  color,
  unit,
  title,
  showMovingAverage = true,
  showConfidenceBands = true
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });
  const { isDark, language, getChartConfig } = useTheme();
  const t = useTranslation(language);
  const chartConfig = getChartConfig();

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(d => {
      const val = parseFloat(d.value);
      return isNaN(val) ? 0 : val;
    });
    
    if (values.length === 0) return null;
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    let range = max - min;
    
    // Handle case where all values are the same
    if (range === 0) {
      range = 1;
    }
    
    // Calculate moving average with proper handling
    const movingAverage = values.map((_, index) => {
      const start = Math.max(0, index - 2);
      const end = Math.min(values.length, index + 3);
      const subset = values.slice(start, end);
      return subset.reduce((sum, val) => sum + val, 0) / subset.length;
    });
    
    // Calculate standard deviation for confidence bands
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      values,
      max,
      min,
      range,
      movingAverage,
      mean,
      stdDev,
      upperBand: movingAverage.map(val => val + stdDev),
      lowerBand: movingAverage.map(val => val - stdDev)
    };
  }, [data]);

  if (!processedData || !data) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  const { values, max, min, range, movingAverage, upperBand, lowerBand } = processedData;
  
  // Chart dimensions with professional padding
  const chartWidth = 1200;
  const chartHeight = 500;
  const padding = { top: 40, right: 100, bottom: 100, left: 120 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  
  // Improved range padding factor for better axis spacing
  const rangePadding = range === 0 ? 0.5 : 0.2;
  const paddedMin = min - range * rangePadding;
  const paddedMax = max + range * rangePadding;
  const paddedRange = paddedMax - paddedMin;
  
  // Scale functions with padding offsets
  const xScale = (index: number) => padding.left + (index / Math.max(values.length - 1, 1)) * plotWidth;
  const yScale = (value: number) => chartHeight - padding.bottom - ((value - paddedMin) / paddedRange) * plotHeight;
  
  // Generate grid lines
  const yGridLines = [];
  const gridLineCount = 5;
  for (let i = 0; i <= gridLineCount; i++) {
    const value = paddedMin + (paddedRange * i) / gridLineCount;
    const y = yScale(value);
    yGridLines.push({ y, value });
  }
  
  const xGridLines = [];
  const xGridCount = Math.min(10, Math.max(1, data.length - 1));
  for (let i = 0; i <= xGridCount; i++) {
    const index = Math.floor((i / xGridCount) * (data.length - 1));
    const x = xScale(index);
    const timeDisplay = data[index]?.time || data[Math.min(index, data.length - 1)]?.time || '';
    xGridLines.push({ x, time: timeDisplay });
  }
  
  // Generate smooth curve paths using cubic bezier curves
  const generateSmoothPath = (points: number[]) => {
    if (points.length < 1) return '';
    if (points.length === 1) {
      const x = xScale(0);
      const y = yScale(points[0]);
      return `M ${x} ${y}`;
    }
    
    const coords = points.map((value, index) => ({
      x: xScale(index),
      y: yScale(value)
    }));
    
    let path = `M ${coords[0].x} ${coords[0].y}`;
    
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const next = coords[i + 1];
      
      // Calculate control points for smooth curves
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = curr.x - ((next ? next.x : curr.x) - prev.x) / 6;
      const cp2y = curr.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  const mainLinePath = generateSmoothPath(values);
  const movingAveragePath = generateSmoothPath(movingAverage);
  
  // Create area path for gradient fill
  const areaPath = (() => {
    const linePath = generateSmoothPath(values);
    const bottomY = yScale(paddedMin);
    const firstX = xScale(0);
    const lastX = xScale(values.length - 1);
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  })();
  
  // Confidence band area
  const confidenceBandPath = (() => {
    const upperPath = upperBand.map((value, index) => {
      const x = xScale(index);
      const y = yScale(Math.min(value, max));
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const lowerPath = lowerBand.slice().reverse().map((value, reverseIndex) => {
      const index = lowerBand.length - 1 - reverseIndex;
      const x = xScale(index);
      const y = yScale(Math.max(value, min));
      return `L ${x} ${y}`;
    }).join(' ');
    
    return `${upperPath} ${lowerPath} Z`;
  })();
  
  // Continuous hover functionality with interpolation
  const handleContinuousMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const svgElement = event.currentTarget.closest('svg');
    if (!svgElement) return;
    
    const rect = svgElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Convert mouse position to data coordinates
    const relativeX = mouseX - padding.left;
    if (relativeX < 0 || relativeX > plotWidth) {
      setTooltip(prev => ({ ...prev, visible: false }));
      setHoveredPoint(null);
      return;
    }
    
    // Calculate exact position in data space (continuous, not discrete)
    const exactIndex = (relativeX / plotWidth) * (values.length - 1);
    const leftIndex = Math.floor(exactIndex);
    const rightIndex = Math.min(leftIndex + 1, values.length - 1);
    const interpolationFactor = exactIndex - leftIndex;
    
    // Store the exact position for rendering
    setHoveredPoint(exactIndex);
    
    setTooltip({
      x: mouseX,
      y: mouseY,
      visible: true
    });
  };
  
  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
    setHoveredPoint(null);
  };

  return (
    <div className="w-full relative">
      <motion.div
        className="w-full bg-card rounded-lg border border-border p-4 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full overflow-x-auto">
          <svg 
            width="100%"
            height="auto"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full max-w-full"
            style={{ minHeight: `${chartHeight}px` }}
          >
            {/* Background */}
            <rect
              width={chartWidth}
              height={chartHeight}
              fill={isDark ? 'rgba(15, 23, 16, 0.8)' : 'rgba(248, 250, 252, 0.8)'}
              rx="8"
            />
            
            {/* Grid lines */}
            <g className="grid-lines">
              {/* Horizontal grid lines */}
              {yGridLines.map((line, index) => (
                <g key={`h-grid-${index}`}>
                  <line
                    x1={padding.left}
                    y1={line.y}
                    x2={chartWidth - padding.right}
                    y2={line.y}
                    stroke={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
                    strokeWidth="1"
                    strokeDasharray={index === 0 || index === yGridLines.length - 1 ? '0' : '3,3'}
                  />
                  {/* Y-axis labels */}
                  <text
                    x={padding.left - 10}
                    y={line.y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-xs"
                    style={{ fontSize: '11px' }}
                  >
                    {line.value.toFixed(1)}
                  </text>
                </g>
              ))}
              
              {/* Vertical grid lines */}
              {xGridLines.map((line, index) => (
                <g key={`v-grid-${index}`}>
                  <line
                    x1={line.x}
                    y1={padding.top}
                    x2={line.x}
                    y2={chartHeight - padding.bottom}
                    stroke={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  {/* X-axis labels */}
                  <text
                    x={line.x}
                    y={chartHeight - padding.bottom + 20}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs"
                    style={{ fontSize: '11px' }}
                  >
                    {line.time}
                  </text>
                </g>
              ))}
            </g>
            
            {/* Gradient definitions */}
            <defs>
              <linearGradient id={`areaGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                <stop offset="50%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Area fill with gradient */}
            <motion.path
              d={areaPath}
              fill={`url(#areaGradient-${color.replace('#', '')})`}
              stroke="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            
            {/* Confidence bands */}
            {showConfidenceBands && (
              <path
                d={confidenceBandPath}
                fill={color}
                fillOpacity="0.05"
                stroke="none"
              />
            )}
            
            {/* Moving average line */}
            {showMovingAverage && (
              <motion.path
                d={movingAveragePath}
                fill="none"
                stroke={color}
                strokeWidth={Math.max(1, chartConfig.strokeWidth - 1)}
                strokeOpacity="0.4"
                strokeDasharray={chartConfig.quality >= 1 ? "8,4" : "12,6"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: chartConfig.animationDuration / 1000, delay: 0.5 }}
              />
            )}
            
            {/* Main smooth trend line */}
            <motion.path
              d={mainLinePath}
              fill="none"
              stroke={color}
              strokeWidth={chartConfig.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={chartConfig.quality >= 1 ? "url(#glow)" : "none"}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: chartConfig.animationDuration / 1000 }}
            />
            
            {/* Hover indicator - continuous point that follows mouse */}
            {hoveredPoint !== null && (() => {
              const leftIndex = Math.floor(hoveredPoint);
              const rightIndex = Math.min(leftIndex + 1, values.length - 1);
              const interpolationFactor = hoveredPoint - leftIndex;
              
              // Interpolate value and position
              const interpolatedValue = interpolateValue(values[leftIndex], values[rightIndex], interpolationFactor);
              const hoverX = xScale(hoveredPoint);
              const hoverY = yScale(interpolatedValue);
              
              return (
                <g>
                  {/* Vertical line indicator */}
                  <line
                    x1={hoverX}
                    y1={padding.top}
                    x2={hoverX}
                    y2={chartHeight - padding.bottom}
                    stroke={color}
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    strokeDasharray="4,4"
                  />
                  
                  {/* Hover point */}
                  <motion.circle
                    cx={hoverX}
                    cy={hoverY}
                    r={chartConfig.activeDotSize}
                    fill={color}
                    stroke={isDark ? '#0a0e0a' : '#ffffff'}
                    strokeWidth={chartConfig.strokeWidth}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: chartConfig.quality >= 1 ? 0.1 : 0.05 }}
                  />
                  
                  {/* Outer ring */}
                  {chartConfig.quality >= 0.75 && (
                    <motion.circle
                      cx={hoverX}
                      cy={hoverY}
                      r={chartConfig.activeDotSize * 2}
                      fill="none"
                      stroke={color}
                      strokeWidth={Math.max(1, chartConfig.strokeWidth - 1)}
                      strokeOpacity="0.3"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: chartConfig.quality >= 1 ? 0.2 : 0.1 }}
                    />
                  )}
                </g>
              );
            })()}
            
            {/* Invisible overlay for continuous mouse tracking */}
            <rect
              x={0}
              y={0}
              width={chartWidth}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseMove={handleContinuousMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            
            {/* Axis lines */}
            <line
              x1={padding.left}
              y1={chartHeight - padding.bottom}
              x2={chartWidth - padding.right}
              y2={chartHeight - padding.bottom}
              stroke={isDark ? 'rgba(232, 245, 232, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
              strokeWidth="2"
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={chartHeight - padding.bottom}
              stroke={isDark ? 'rgba(232, 245, 232, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
              strokeWidth="2"
            />
            
            {/* Axis labels */}
            <text
              x={chartWidth / 2}
              y={chartHeight - 20}
              textAnchor="middle"
              className="fill-foreground text-sm font-medium"
            >
              {t.time}
            </text>
            <text
              x={20}
              y={chartHeight / 2}
              textAnchor="middle"
              className="fill-foreground text-sm font-medium"
              transform={`rotate(-90 20 ${chartHeight / 2})`}
            >
              {title || t.value} ({unit})
            </text>
            
            {/* Glow filter for the main line */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5" style={{ backgroundColor: color }}></div>
            <span className="text-muted-foreground">{t.actualData}</span>
          </div>
          {showMovingAverage && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: color, opacity: 0.6 }}></div>
              <span className="text-muted-foreground">{t.movingAverage}</span>
            </div>
          )}
          {showConfidenceBands && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: color, opacity: 0.1 }}></div>
              <span className="text-muted-foreground">{t.confidenceBand}</span>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Tooltip */}
      {tooltip.visible && hoveredPoint !== null && (() => {
        const leftIndex = Math.floor(hoveredPoint);
        const rightIndex = Math.min(leftIndex + 1, values.length - 1);
        const interpolationFactor = hoveredPoint - leftIndex;
        
        // Interpolate values for tooltip
        const interpolatedValue = interpolateValue(values[leftIndex], values[rightIndex], interpolationFactor);
        const interpolatedTime = interpolateTime(data[leftIndex]?.time || '', data[rightIndex]?.time || '', interpolationFactor);
        const interpolatedMovingAvg = showMovingAverage ? interpolateValue(movingAverage[leftIndex], movingAverage[rightIndex], interpolationFactor) : 0;
        
        return (
          <motion.div
            className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-3 pointer-events-none"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 60,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1 }}
          >
            <div className="text-xs space-y-1">
              <div className="text-popover-foreground font-medium">
                {interpolatedTime}
              </div>
              <div className="text-popover-foreground">
                Value: <span className="font-medium" style={{ color }}>{interpolatedValue.toFixed(2)}</span> {unit}
              </div>
              {showMovingAverage && (
                <div className="text-muted-foreground">
                  Moving Avg: {interpolatedMovingAvg.toFixed(2)} {unit}
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
};

export default TrendAnalysisChart;