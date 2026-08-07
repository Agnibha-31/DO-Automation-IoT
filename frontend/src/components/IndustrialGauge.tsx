import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTheme } from './utils/themeContext';

interface IndustrialGaugeProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  title: string;
  color: string;
  size?: number;
  thresholds?: {
    optimal: { min: number; max: number };
    warning: { min: number; max: number };
  };
}

export default function IndustrialGauge({ 
  value, 
  min, 
  max, 
  unit, 
  title, 
  color, 
  size = 200,
  thresholds 
}: IndustrialGaugeProps) {
  const { isDark } = useTheme();
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const center = size / 2;
  const radius = size * 0.35;
  const strokeWidth = size * 0.08;
  
  // Calculate angles (gauge spans 180 degrees, from -90 to +90)
  const startAngle = -Math.PI / 2; // -90 degrees
  const endAngle = Math.PI / 2; // +90 degrees
  const angleRange = endAngle - startAngle;
  
  const valueRatio = Math.max(0, Math.min(1, (animatedValue - min) / (max - min)));
  const currentAngle = startAngle + angleRange * valueRatio;
  
  // Create gauge arc path
  const createArcPath = (startA: number, endA: number, r: number) => {
    const x1 = center + r * Math.cos(startA);
    const y1 = center + r * Math.sin(startA);
    const x2 = center + r * Math.cos(endA);
    const y2 = center + r * Math.sin(endA);
    const largeArcFlag = endA - startA > Math.PI ? 1 : 0;
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Background arc
  const backgroundArc = createArcPath(startAngle, endAngle, radius);
  
  // Value arc
  const valueArc = createArcPath(startAngle, currentAngle, radius);
  
  // Pointer position
  const pointerX = center + (radius - strokeWidth / 2) * Math.cos(currentAngle);
  const pointerY = center + (radius - strokeWidth / 2) * Math.sin(currentAngle);

  // Create tick marks
  const ticks = [];
  const majorTickCount = 5;
  for (let i = 0; i <= majorTickCount; i++) {
    const tickAngle = startAngle + (angleRange * i) / majorTickCount;
    const tickValue = min + ((max - min) * i) / majorTickCount;
    
    const innerRadius = radius + strokeWidth / 2 + 5;
    const outerRadius = innerRadius + 15;
    
    const x1 = center + innerRadius * Math.cos(tickAngle);
    const y1 = center + innerRadius * Math.sin(tickAngle);
    const x2 = center + outerRadius * Math.cos(tickAngle);
    const y2 = center + outerRadius * Math.sin(tickAngle);
    
    const labelRadius = outerRadius + 20;
    const labelX = center + labelRadius * Math.cos(tickAngle);
    const labelY = center + labelRadius * Math.sin(tickAngle);
    
    ticks.push(
      <g key={i}>
        <motion.line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isDark ? 'rgba(232, 245, 232, 0.6)' : 'rgba(71, 85, 105, 0.6)'}
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 + 0.5 }}
        />
        <motion.text
          x={labelX}
          y={labelY + 3}
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 + 0.7 }}
        >
          {tickValue.toFixed(1)}
        </motion.text>
      </g>
    );
  }

  // Status color based on thresholds
  const getStatusColor = () => {
    if (!thresholds) return color;
    
    if (value >= thresholds.optimal.min && value <= thresholds.optimal.max) {
      return '#22c55e'; // Green
    } else if (value >= thresholds.warning.min && value <= thresholds.warning.max) {
      return '#f59e0b'; // Yellow
    } else {
      return '#ef4444'; // Red
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.8} className="overflow-visible">
        <defs>
          <linearGradient id={`gauge-gradient-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 163, 74, 0.2)'} />
            <stop offset="100%" stopColor={statusColor} stopOpacity={0.8} />
          </linearGradient>
          <radialGradient id={`center-gradient-${title}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={statusColor} stopOpacity={0.8} />
            <stop offset="70%" stopColor={statusColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={statusColor} stopOpacity={0.1} />
          </radialGradient>
          <filter id={`glow-${title}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id={`shadow-${title}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor={statusColor} floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Background arc */}
        <motion.path
          d={backgroundArc}
          fill="none"
          stroke={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Value arc */}
        <motion.path
          d={valueArc}
          fill="none"
          stroke={`url(#gauge-gradient-${title})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#glow-${title})`}
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: 1, pathLength: 1 }}
          transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
        />

        {/* Tick marks and labels */}
        {ticks}

        {/* Center circle with gradient */}
        <motion.circle
          cx={center}
          cy={center}
          r={size * 0.06}
          fill={`url(#center-gradient-${title})`}
          stroke={statusColor}
          strokeWidth={3}
          filter={`url(#shadow-${title})`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
        />

        {/* Pointer */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <motion.line
            x1={center}
            y1={center}
            x2={pointerX}
            y2={pointerY}
            stroke={statusColor}
            strokeWidth={4}
            strokeLinecap="round"
            filter={`url(#glow-${title})`}
            animate={{ 
              x2: pointerX,
              y2: pointerY
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.circle
            cx={pointerX}
            cy={pointerY}
            r={6}
            fill={statusColor}
            stroke={isDark ? '#0f1710' : '#ffffff'}
            strokeWidth={2}
            filter={`url(#shadow-${title})`}
            animate={{ 
              cx: pointerX,
              cy: pointerY
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </motion.g>

        {/* Value display */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <motion.text
            x={center}
            y={center + size * 0.15}
            textAnchor="middle"
            className="text-2xl fill-foreground font-bold"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {animatedValue.toFixed(1)}
          </motion.text>
          <motion.text
            x={center}
            y={center + size * 0.22}
            textAnchor="middle"
            className="text-sm fill-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            {unit}
          </motion.text>
        </motion.g>

        {/* Title */}
        <motion.text
          x={center}
          y={size * 0.05}
          textAnchor="middle"
          className="text-sm fill-foreground font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: size * 0.05 }}
          transition={{ delay: 0.5 }}
        >
          {title}
        </motion.text>
      </svg>
    </div>
  );
}