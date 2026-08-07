import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTheme } from './utils/themeContext';

interface DataPoint {
  time: string;
  date: string;
  value: string;
  timestamp: Date;
}

interface IndustrialChartProps {
  data: DataPoint[];
  title: string;
  unit: string;
  color: string;
  gradientId: string;
  height?: number;
  showGrid?: boolean;
  showThresholds?: boolean;
  thresholds?: {
    optimal: { min: number; max: number };
    warning: { min: number; max: number };
  };
}

export default function IndustrialChart({
  data,
  title,
  unit,
  color,
  gradientId,
  height = 400,
  showGrid = true,
  showThresholds = false,
  thresholds
}: IndustrialChartProps) {
  const { isDark } = useTheme();
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 200);
    return () => clearTimeout(timer);
  }, []);

  // Calculate SVG dimensions and scales with professional spacing
  const padding = { top: 40, right: 60, bottom: 100, left: 80 };
  const svgWidth = 1000;
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get data bounds with proper margins
  const values = data.map(d => parseFloat(d.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  // Increased padding factor for professional spacing
  const padding_factor = valueRange === 0 ? 0.5 : 0.2;
  const yMin = minValue - valueRange * padding_factor;
  const yMax = maxValue + valueRange * padding_factor;

  // Create scales with padding offset
  const xScale = (index: number) => padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

  // Create path for main line
  const linePath = data.map((d, i) => {
    const x = xScale(i);
    const y = yScale(parseFloat(d.value));
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Create path for area fill
  const areaPath = `${linePath} L ${xScale(data.length - 1)} ${padding.top + chartHeight} L ${xScale(0)} ${padding.top + chartHeight} Z`;

  // Create animated path
  const animatedLinePath = data.slice(0, Math.floor(data.length * animationProgress)).map((d, i) => {
    const x = xScale(i);
    const y = yScale(parseFloat(d.value));
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Create grid lines with proper positioning
  const gridLines = [];
  if (showGrid) {
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      const value = yMax - (i / 5) * (yMax - yMin);
      gridLines.push(
        <g key={`h-grid-${i}`}>
          <motion.line
            x1={padding.left}
            y1={y}
            x2={padding.left + chartWidth}
            y2={y}
            stroke={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
            strokeDasharray="2,2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          />
          <motion.text
            x={padding.left - 10}
            y={y + 3}
            textAnchor="end"
            className="text-xs fill-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 + 0.2 }}
          >
            {value.toFixed(1)}
          </motion.text>
        </g>
      );
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding.left + (chartWidth / 6) * i;
      const dataIndex = Math.floor((data.length - 1) * (i / 6));
      const date = data[dataIndex]?.date || '';
      gridLines.push(
        <g key={`v-grid-${i}`}>
          <motion.line
            x1={x}
            y1={padding.top}
            x2={x}
            y2={padding.top + chartHeight}
            stroke={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
            strokeDasharray="2,2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 + 0.3 }}
          />
          <motion.text
            x={x}
            y={padding.top + chartHeight + 25}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 + 0.5 }}
          >
            {date}
          </motion.text>
        </g>
      );
    }
  }

  // Create threshold zones
  const thresholdZones = [];
  if (showThresholds && thresholds) {
    const optimalTop = yScale(thresholds.optimal.max);
    const optimalBottom = yScale(thresholds.optimal.min);
    const warningTop = yScale(thresholds.warning.max);
    const warningBottom = yScale(thresholds.warning.min);

    thresholdZones.push(
      <motion.rect
        key="optimal-zone"
        x={padding.left}
        y={optimalTop}
        width={chartWidth}
        height={optimalBottom - optimalTop}
        fill={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      />,
      <motion.rect
        key="warning-zone"
        x={padding.left}
        y={warningTop}
        width={chartWidth}
        height={warningBottom - warningTop}
        fill={isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.1)'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      />
    );
  }

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="50%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
          <filter id={`glow-${gradientId}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id={`shadow-${gradientId}`}>
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={color} floodOpacity="0.3"/>
          </filter>
        </defs>

        <g>
          {/* Background */}
          <motion.rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight}
            fill={isDark ? 'rgba(15, 23, 16, 0.5)' : 'rgba(248, 250, 252, 0.5)'}
            stroke={isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 163, 74, 0.2)'}
            strokeWidth={1}
            rx={8}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Grid lines */}
          {gridLines}

          {/* Threshold zones */}
          {thresholdZones}

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          />

          {/* Main line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={3}
            filter={`url(#glow-${gradientId})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 1.5, ease: "easeInOut" }}
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = xScale(i);
            const y = yScale(parseFloat(d.value));
            const isVisible = i <= Math.floor(data.length * animationProgress);
            
            return (
              <motion.g
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isVisible ? (hoveredPoint === i ? 1.5 : 1) : 0,
                  opacity: isVisible ? 1 : 0
                }}
                transition={{ 
                  delay: (i / data.length) * 1.5 + 0.4,
                  duration: 0.3,
                  type: "spring",
                  stiffness: 200
                }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={hoveredPoint === i ? 8 : 5}
                  fill={color}
                  stroke={isDark ? '#0f1710' : '#ffffff'}
                  strokeWidth={2}
                  filter={`url(#shadow-${gradientId})`}
                />
                {hoveredPoint === i && (
                  <g>
                    <motion.rect
                      x={x - 40}
                      y={y - 35}
                      width={80}
                      height={25}
                      fill={isDark ? '#0f1710' : '#ffffff'}
                      stroke={color}
                      strokeWidth={1}
                      rx={4}
                      filter={`url(#shadow-${gradientId})`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.text
                      x={x}
                      y={y - 18}
                      textAnchor="middle"
                      className="text-sm fill-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {d.value} {unit}
                    </motion.text>
                  </g>
                )}
              </motion.g>
            );
          })}

          {/* Axis labels */}
          <motion.text
            x={padding.left + chartWidth / 2}
            y={padding.top + chartHeight + 60}
            textAnchor="middle"
            className="text-sm fill-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            Time Period
          </motion.text>

          <motion.text
            x={30}
            y={padding.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 30, ${padding.top + chartHeight / 2})`}
            className="text-sm fill-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {title} ({unit})
          </motion.text>
        </g>

        {/* Chart title */}
        <motion.text
          x={svgWidth / 2}
          y={30}
          textAnchor="middle"
          className="text-lg fill-foreground font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 30 }}
          transition={{ delay: 0.2 }}
        >
          {title} - Industrial Monitoring
        </motion.text>
      </svg>
    </div>
  );
}