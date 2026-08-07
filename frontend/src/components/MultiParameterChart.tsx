import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTheme } from './utils/themeContext';

interface DataPoint {
  time: string;
  date: string;
  value: string;
  timestamp: Date;
}

interface ParameterConfig {
  id: string;
  name: string;
  color: string;
  data: DataPoint[];
  unit: string;
  visible: boolean;
}

interface MultiParameterChartProps {
  parameters: ParameterConfig[];
  height?: number;
  title: string;
}

export default function MultiParameterChart({ 
  parameters, 
  height = 400, 
  title 
}: MultiParameterChartProps) {
  const { isDark } = useTheme();
  const [animationProgress, setAnimationProgress] = useState(0);
  const [visibleParameters, setVisibleParameters] = useState<string[]>(
    parameters.map(p => p.id)
  );
  const [hoveredPoint, setHoveredPoint] = useState<{param: string, index: number} | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 200);
    return () => clearTimeout(timer);
  }, []);

  // SVG dimensions and scales
  const padding = { top: 40, right: 100, bottom: 60, left: 80 };
  const chartWidth = 900 - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get data bounds for all visible parameters
  const allValues: number[] = [];
  parameters.forEach(param => {
    if (visibleParameters.includes(param.id)) {
      param.data.forEach(d => allValues.push(parseFloat(d.value)));
    }
  });

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;
  const yMin = minValue - valueRange * 0.1;
  const yMax = maxValue + valueRange * 0.1;

  // Scales
  const maxDataLength = Math.max(...parameters.map(p => p.data.length));
  const xScale = (index: number) => (index / (maxDataLength - 1)) * chartWidth;
  const yScale = (value: number) => chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

  const toggleParameter = (paramId: string) => {
    setVisibleParameters(prev => 
      prev.includes(paramId) 
        ? prev.filter(id => id !== paramId)
        : [...prev, paramId]
    );
  };

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {parameters.map((param, index) => (
          <motion.button
            key={param.id}
            onClick={() => toggleParameter(param.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
              visibleParameters.includes(param.id)
                ? 'bg-card border-border shadow-lg'
                : 'bg-muted/50 border-border/50 opacity-60'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: param.color }}
              animate={{
                scale: visibleParameters.includes(param.id) ? [1, 1.2, 1] : 1,
                boxShadow: visibleParameters.includes(param.id) 
                  ? `0 0 10px ${param.color}40` 
                  : 'none'
              }}
              transition={{ duration: 0.3 }}
            />
            <span className="text-sm font-medium">{param.name}</span>
          </motion.button>
        ))}
      </div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 900 ${height}`}
        className="overflow-visible"
      >
        <defs>
          {parameters.map(param => (
            <g key={param.id}>
              <linearGradient id={`gradient-${param.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={param.color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={param.color} stopOpacity={0.1} />
              </linearGradient>
              <filter id={`glow-${param.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </g>
          ))}
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Background */}
          <motion.rect
            width={chartWidth}
            height={chartHeight}
            fill={isDark ? 'rgba(15, 23, 16, 0.3)' : 'rgba(248, 250, 252, 0.3)'}
            stroke={isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(16, 163, 74, 0.2)'}
            strokeWidth={1}
            rx={12}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Grid lines */}
          {Array.from({ length: 6 }, (_, i) => {
            const y = (chartHeight / 5) * i;
            const value = yMax - (i / 5) * (yMax - yMin);
            return (
              <g key={`h-grid-${i}`}>
                <motion.line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
                  strokeDasharray="4,4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                />
                <motion.text
                  x={-15}
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
          })}

          {/* Vertical grid lines */}
          {Array.from({ length: 7 }, (_, i) => {
            const x = (chartWidth / 6) * i;
            const dataIndex = Math.floor((maxDataLength - 1) * (i / 6));
            const date = parameters[0]?.data[dataIndex]?.date || '';
            return (
              <g key={`v-grid-${i}`}>
                <motion.line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chartHeight}
                  stroke={isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(16, 163, 74, 0.1)'}
                  strokeDasharray="4,4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                />
                <motion.text
                  x={x}
                  y={chartHeight + 20}
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
          })}

          {/* Parameter lines and areas */}
          {parameters.map((param, paramIndex) => {
            if (!visibleParameters.includes(param.id)) return null;

            const linePath = param.data.map((d, i) => {
              const x = xScale(i);
              const y = yScale(parseFloat(d.value));
              return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ');

            const areaPath = `${linePath} L ${xScale(param.data.length - 1)} ${chartHeight} L ${xScale(0)} ${chartHeight} Z`;

            return (
              <g key={param.id}>
                {/* Area fill */}
                <motion.path
                  d={areaPath}
                  fill={`url(#gradient-${param.id})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: paramIndex * 0.2 + 0.6, duration: 0.8 }}
                />

                {/* Line */}
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke={param.color}
                  strokeWidth={3}
                  filter={`url(#glow-${param.id})`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ 
                    delay: paramIndex * 0.2 + 0.4, 
                    duration: 1.5, 
                    ease: "easeInOut" 
                  }}
                />

                {/* Data points */}
                {param.data.map((d, i) => {
                  const x = xScale(i);
                  const y = yScale(parseFloat(d.value));
                  const isHovered = hoveredPoint?.param === param.id && hoveredPoint?.index === i;
                  
                  return (
                    <motion.circle
                      key={`${param.id}-${i}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 8 : 4}
                      fill={param.color}
                      stroke={isDark ? '#0f1710' : '#ffffff'}
                      strokeWidth={2}
                      className="cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        r: isHovered ? 8 : 4
                      }}
                      transition={{ 
                        delay: paramIndex * 0.2 + (i / param.data.length) * 1.5 + 0.4,
                        duration: 0.3,
                        type: "spring"
                      }}
                      onMouseEnter={() => setHoveredPoint({param: param.id, index: i})}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {/* Tooltip */}
                {hoveredPoint?.param === param.id && (
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(() => {
                      const d = param.data[hoveredPoint.index];
                      const x = xScale(hoveredPoint.index);
                      const y = yScale(parseFloat(d.value));
                      
                      return (
                        <>
                          <motion.rect
                            x={x - 50}
                            y={y - 40}
                            width={100}
                            height={30}
                            fill={isDark ? '#0f1710' : '#ffffff'}
                            stroke={param.color}
                            strokeWidth={1}
                            rx={6}
                            filter={`url(#glow-${param.id})`}
                          />
                          <motion.text
                            x={x}
                            y={y - 25}
                            textAnchor="middle"
                            className="text-sm fill-foreground font-medium"
                          >
                            {d.value} {param.unit}
                          </motion.text>
                          <motion.text
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            className="text-xs fill-muted-foreground"
                          >
                            {d.time}
                          </motion.text>
                        </>
                      );
                    })()}
                  </motion.g>
                )}
              </g>
            );
          })}

          {/* Axis labels */}
          <motion.text
            x={chartWidth / 2}
            y={chartHeight + 50}
            textAnchor="middle"
            className="text-sm fill-muted-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Time Period (7 Days)
          </motion.text>

          <motion.text
            x={-50}
            y={chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, -50, ${chartHeight / 2})`}
            className="text-sm fill-muted-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            Parameter Values
          </motion.text>
        </g>

        {/* Chart title */}
        <motion.text
          x={450}
          y={25}
          textAnchor="middle"
          className="text-lg fill-foreground font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 25 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.text>
      </svg>
    </div>
  );
}