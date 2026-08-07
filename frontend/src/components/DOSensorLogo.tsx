import React from 'react';
import { motion } from 'motion/react';

interface DOSensorLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function DOSensorLogo({ size = 32, className = "", animated = true }: DOSensorLogoProps) {
  const motionProps = animated ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.5, ease: "easeOut" },
    whileHover: { scale: 1.05 }
  } : {};
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      {...motionProps}
    >
      <defs>
        <linearGradient id="dropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="1"/>
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0.9"/>
        </linearGradient>
        <filter id="dropShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
        </filter>
        <filter id="textGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Simple Water Drop Shape - Bold and Clean */}
      <motion.path
        d="M32 6 C28 12, 18 24, 18 36 C18 46.4, 25.6 54, 32 54 C38.4 54, 46 46.4, 46 36 C46 24, 36 12, 32 6 Z"
        fill="url(#dropGradient)"
        filter="url(#dropShadow)"
        stroke="#ffffff"
        strokeWidth="0.5"
        strokeOpacity="0.3"
        {...(animated ? {
          initial: { pathLength: 0, scale: 0 },
          animate: { pathLength: 1, scale: 1 },
          transition: { duration: 0.8, ease: "easeInOut" }
        } : {})}
      />
      
      {/* Bold O₂ Text */}
      <motion.text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="14"
        fill="#ffffff"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        filter="url(#textGlow)"
        {...(animated ? {
          initial: { opacity: 0, scale: 0.5 },
          animate: { opacity: 1, scale: 1 },
          transition: { delay: 0.5, duration: 0.5 }
        } : {})}
      >
        O₂
      </motion.text>
      
      {/* Subtle highlight on the drop */}
      <motion.ellipse
        cx="28"
        cy="24"
        rx="4"
        ry="8"
        fill="#ffffff"
        opacity="0.2"
        {...(animated ? {
          initial: { opacity: 0 },
          animate: { opacity: 0.2 },
          transition: { delay: 0.8, duration: 0.4 }
        } : {})}
      />
    </motion.svg>
  );
}