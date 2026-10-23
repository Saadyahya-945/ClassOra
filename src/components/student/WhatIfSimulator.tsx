'use client';

import React, { useState } from 'react';
import { simulateAttendancePercentage } from '@/lib/calculations/attendance';
import { Sliders, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WhatIfSimulatorProps {
  currentAttended: number;
  currentTotal: number;
  threshold?: number;
}

export function WhatIfSimulator({
  currentAttended,
  currentTotal,
  threshold = 75,
}: WhatIfSimulatorProps) {
  const [futureCount, setFutureCount] = useState<number>(3);
  const [futureAction, setFutureAction] = useState<'attend' | 'miss'>('attend');
  const [sessionWeight, setSessionWeight] = useState<number>(1.0);

  const currentPct = currentTotal > 0
    ? Math.round((currentAttended / currentTotal) * 1000) / 10
    : 100.0;

  const projectedPct = simulateAttendancePercentage(
    currentAttended,
    currentTotal,
    futureCount,
    futureAction,
    sessionWeight
  );

  const delta = Math.round((projectedPct - currentPct) * 10) / 10;
  const isSafeProjected = projectedPct >= threshold;

  return (
    <div className="p-5 sm:p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-slate-100 border border-[#0F172A] text-[#0F172A] shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base font-display text-[#0F172A] truncate">
              Attendance &ldquo;What-If&rdquo; Simulator
            </h3>
            <p className="text-[11px] text-[#64748B] font-mono truncate">
              Forecast your standing before taking leaves
            </p>
          </div>
        </div>

        {/* Projection Pill */}
        <div
          className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] ${
            isSafeProjected
              ? 'bg-emerald-100 text-[#065F46]'
              : 'bg-rose-100 text-[#9F1239]'
          }`}
        >
          <span>Projected: <strong>{projectedPct}%</strong></span>
          <span className="flex items-center text-[10px]">
            {delta >= 0 ? (
              <span className="flex items-center font-bold">
                <ArrowUpRight className="w-3 h-3" /> +{delta}%
              </span>
            ) : (
              <span className="flex items-center font-bold">
                <ArrowDownRight className="w-3 h-3" /> {delta}%
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="space-y-4 font-mono text-xs">
        {/* Attend vs Miss Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFutureAction('attend')}
            className={`py-2 px-3 font-bold border-2 transition-all ${
              futureAction === 'attend'
                ? 'bg-emerald-600 text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
            }`}
          >
            If I ATTEND Next Classes
          </button>
          <button
            type="button"
            onClick={() => setFutureAction('miss')}
            className={`py-2 px-3 font-bold border-2 transition-all ${
              futureAction === 'miss'
                ? 'bg-rose-600 text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F172A]'
            }`}
          >
            If I MISS Next Classes
          </button>
        </div>

        {/* Slider */}
        <div className="p-3 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
          <div className="flex justify-between items-center mb-2 font-bold text-slate-800">
            <span className="truncate">Upcoming Classes:</span>
            <span className="text-xs font-black text-[#0F172A] bg-white px-2 py-0.5 border border-[#0F172A]">
              +{futureCount} classes
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={futureCount}
            onChange={(e) => setFutureCount(parseInt(e.target.value))}
            className="w-full accent-[#0F172A] cursor-pointer h-2 bg-slate-200"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>1 class</span>
            <span>6 classes</span>
            <span>12 classes</span>
          </div>
        </div>

        {/* Slot Weight selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-slate-700">
          <span className="font-bold">Session Weight:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSessionWeight(1.0)}
              className={`px-3 py-1 border-2 font-bold transition-all ${
                sessionWeight === 1.0
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                  : 'bg-white text-[#475569] border-[#CBD5E1]'
              }`}
            >
              Lecture (1x)
            </button>
            <button
              type="button"
              onClick={() => setSessionWeight(2.0)}
              className={`px-3 py-1 border-2 font-bold transition-all ${
                sessionWeight === 2.0
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                  : 'bg-white text-[#475569] border-[#CBD5E1]'
              }`}
            >
              Lab / Double (2x)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
