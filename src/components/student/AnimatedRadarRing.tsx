'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface AnimatedRadarRingProps {
  percentage: number;
  attended: number;
  total: number;
  medicalLeaves: number;
}

export function AnimatedRadarRing({
  percentage,
  attended,
  total,
  medicalLeaves,
}: AnimatedRadarRingProps) {
  const [displayValue, setDisplayValue] = useState(0);

  const springValue = useSpring(0, {
    stiffness: 45,
    damping: 15,
  });

  useEffect(() => {
    springValue.set(percentage);
  }, [percentage, springValue]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest * 10) / 10);
    });
  }, [springValue]);

  // Determine status color theme
  let strokeColor = '#10B981'; // Emerald
  let statusText = 'SAFE ZONE';
  let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';

  if (percentage < 70) {
    strokeColor = '#F43F5E'; // Rose
    statusText = 'CRITICAL SHORTAGE';
    badgeBg = 'bg-rose-50 text-rose-800 border-rose-300';
  } else if (percentage < 75) {
    strokeColor = '#F59E0B'; // Amber
    statusText = 'WARNING ZONE';
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="p-5 sm:p-7 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col items-center justify-center text-[#0F172A] w-full min-w-0">
      {/* Status Pill Badge */}
      <div className={`mb-4 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider border-2 ${badgeBg}`}>
        {statusText}
      </div>

      {/* Circular Glowing Radar SVG */}
      <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
          {/* Background Ring Track */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="14"
            fill="transparent"
          />

          {/* 75% Target Marker Notch */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="#CBD5E1"
            strokeWidth="14"
            strokeDasharray={`2 ${circumference / 4 - 2}`}
            strokeDashoffset="0"
            fill="transparent"
          />

          {/* Active Animated Progress Arc */}
          <motion.circle
            cx="120"
            cy="120"
            r={radius}
            stroke={strokeColor}
            strokeWidth="14"
            strokeLinecap="butt"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        {/* Center Giant Yourbana-style Counter */}
        <div className="absolute flex flex-col items-center justify-center text-center select-none">
          <div className="flex items-baseline">
            <span className="text-4xl sm:text-5xl font-black font-display tracking-tighter tabular-numbers text-[#0F172A]">
              {displayValue.toFixed(1)}
            </span>
            <span className="text-xl font-bold text-[#64748B] ml-0.5">%</span>
          </div>
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#64748B] font-semibold mt-0.5">
            Goal: 75.0%
          </span>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mt-6 pt-4 border-t-2 border-[#E2E8F0] text-center font-mono text-xs">
        <div className="p-2 sm:p-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] min-w-0">
          <div className="text-base sm:text-lg font-black text-[#065F46] tabular-numbers truncate">{attended}</div>
          <div className="text-[9px] sm:text-[10px] text-[#475569] uppercase font-bold truncate">Attended</div>
        </div>
        <div className="p-2 sm:p-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] min-w-0">
          <div className="text-base sm:text-lg font-black text-[#92400E] tabular-numbers truncate">{medicalLeaves}</div>
          <div className="text-[9px] sm:text-[10px] text-[#475569] uppercase font-bold truncate">Leaves (M)</div>
        </div>
        <div className="p-2 sm:p-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] min-w-0">
          <div className="text-base sm:text-lg font-black text-[#0F172A] tabular-numbers truncate">{total}</div>
          <div className="text-[9px] sm:text-[10px] text-[#475569] uppercase font-bold truncate">Total Slots</div>
        </div>
      </div>
    </div>
  );
}
