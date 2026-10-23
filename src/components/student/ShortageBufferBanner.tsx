'use client';

import React from 'react';
import { ShieldCheck, AlertOctagon } from 'lucide-react';

interface ShortageBufferBannerProps {
  percentage: number;
  classesNeeded: number;
  bufferClasses: number;
  threshold?: number;
}

export function ShortageBufferBanner({
  percentage,
  classesNeeded,
  bufferClasses,
  threshold = 75,
}: ShortageBufferBannerProps) {
  const isSafe = percentage >= threshold;

  if (isSafe) {
    return (
      <div className="p-4 bg-emerald-50 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] text-[#065F46] flex items-start gap-3 w-full min-w-0">
        <div className="p-2 bg-emerald-200 border border-[#0F172A] text-emerald-950 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm font-display text-emerald-950 break-words">
            Attendance Safe Zone ({percentage}%)
          </div>
          <p className="text-xs text-emerald-900 font-mono mt-0.5 leading-relaxed break-words">
            {bufferClasses > 0 ? (
              <>
                You have a safe buffer of <strong>{bufferClasses} class{bufferClasses > 1 ? 'es' : ''}</strong> (1x) that you can miss while remaining at or above the mandatory {threshold}% threshold.
              </>
            ) : (
              <>
                You are exactly at the {threshold}% boundary. Any missed class will trigger detention warning.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-rose-50 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] text-[#9F1239] flex items-start gap-3 w-full min-w-0">
      <div className="p-2 bg-rose-200 border border-[#0F172A] text-rose-950 shrink-0">
        <AlertOctagon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm font-display text-rose-950 break-words">
          Attendance Shortage Alert ({percentage}%)
        </div>
        <p className="text-xs text-rose-900 font-mono mt-0.5 leading-relaxed break-words">
          You are currently below {threshold}%. You must attend <strong>{classesNeeded} consecutive class{classesNeeded > 1 ? 'es' : ''}</strong> (1x) with zero absences to become eligible for exams.
        </p>
      </div>
    </div>
  );
}
