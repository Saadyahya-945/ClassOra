'use client';

import React, { useState } from 'react';
import { AttendanceRecord, AttendanceSession, Enrollment, AttendanceStatus } from '@/types/database';
import { Check, Plus, Calendar } from 'lucide-react';
import { calculateStudentAttendance } from '@/lib/calculations/attendance';

interface PodiumModeProps {
  courseId: string;
  enrollments: Enrollment[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onUpdateStatus: (sessionId: string, enrollmentId: string, status: AttendanceStatus) => void;
  onBatchUpdateStatus: (sessionId: string, updates: { enrollmentId: string; status: AttendanceStatus }[]) => void;
  onCreateSession: (date: string, slotLabel: string, sessionType: 'lecture' | 'lab' | 'double_period' | 'extra', weight: number) => void;
}

export function PodiumMode({
  enrollments,
  sessions,
  records,
  activeSessionId,
  onSelectSession,
  onUpdateStatus,
  onBatchUpdateStatus,
  onCreateSession,
}: PodiumModeProps) {
  const [absentInput, setAbsentInput] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLabel, setNewLabel] = useState('09:00 AM Lecture');
  const [newType, setNewType] = useState<'lecture' | 'lab' | 'double_period' | 'extra'>('lecture');
  const [newWeight, setNewWeight] = useState(1.0);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Safe fallback
      }
    }
  };

  const getRecord = (enrollmentId: string) => {
    return records.find((r) => r.session_id === activeSession?.id && r.enrollment_id === enrollmentId);
  };

  const handleMarkAllPresent = () => {
    triggerHaptic();
    if (!activeSession) return;
    const updates = enrollments.map((enr) => ({
      enrollmentId: enr.id,
      status: 'P' as AttendanceStatus,
    }));
    onBatchUpdateStatus(activeSession.id, updates);
  };

  const handleApplyQuickRollCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !absentInput.trim()) return;
    triggerHaptic();

    const tokens = absentInput
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const absentRollSet = new Set(
      tokens.map((t) => (t.length === 1 ? `0${t}` : t))
    );

    const updates = enrollments.map((enr) => {
      const isAbsent = absentRollSet.has(enr.roll_number) || absentRollSet.has(parseInt(enr.roll_number, 10).toString());
      return {
        enrollmentId: enr.id,
        status: (isAbsent ? 'A' : 'P') as AttendanceStatus,
      };
    });

    onBatchUpdateStatus(activeSession.id, updates);
    setAbsentInput('');
  };

  const currentCounts = enrollments.reduce(
    (acc, enr) => {
      const rec = getRecord(enr.id);
      const st = rec ? rec.status : 'P';
      if (st === 'P') acc.p++;
      else if (st === 'A') acc.a++;
      else if (st === 'M' || st === 'DL') acc.m++;
      return acc;
    },
    { p: 0, a: 0, m: 0 }
  );

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Session Selection & Fast Action Bar */}
      <div className="bg-white border-2 border-[#0F172A] p-4 sm:p-5 shadow-[4px_4px_0px_#0F172A] w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Calendar className="w-5 h-5 text-[#0F172A] shrink-0" />
            <select
              value={activeSession?.id || ''}
              onChange={(e) => onSelectSession(e.target.value)}
              className="font-mono text-xs sm:text-sm font-bold bg-[#F8FAFC] border-2 border-[#0F172A] px-3 py-1.5 focus:outline-hidden max-w-full truncate shadow-[2px_2px_0px_#0F172A]"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_date} — {s.slot_label} ({s.weight}x {s.session_type})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreatingSession(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[#0F172A] text-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            + New Slot
          </button>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-4">
          <div className="bg-emerald-50 border-2 border-[#0F172A] p-2 shadow-[2px_2px_0px_#0F172A]">
            <span className="text-[#065F46] font-black text-base block tabular-numbers">{currentCounts.p}</span>
            <span className="text-emerald-800 font-bold text-[10px] sm:text-xs">PRESENT (P)</span>
          </div>
          <div className="bg-rose-50 border-2 border-[#0F172A] p-2 shadow-[2px_2px_0px_#0F172A]">
            <span className="text-[#9F1239] font-black text-base block tabular-numbers">{currentCounts.a}</span>
            <span className="text-rose-800 font-bold text-[10px] sm:text-xs">ABSENT (A)</span>
          </div>
          <div className="bg-amber-50 border-2 border-[#0F172A] p-2 shadow-[2px_2px_0px_#0F172A]">
            <span className="text-[#92400E] font-black text-base block tabular-numbers">{currentCounts.m}</span>
            <span className="text-amber-800 font-bold text-[10px] sm:text-xs">LEAVE (M)</span>
          </div>
        </div>

        {/* Quick Absentee Roll-Call Numpad / Comma Input */}
        <form onSubmit={handleApplyQuickRollCall} className="space-y-2">
          <label className="block text-xs font-mono font-bold text-[#0F172A] uppercase tracking-wider">
            Quick Roll Call: Type Absent Roll Numbers (e.g. 04, 15, 28)
          </label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input
              type="text"
              placeholder="04, 15, 28..."
              value={absentInput}
              onChange={(e) => setAbsentInput(e.target.value)}
              className="flex-1 min-w-[140px] font-mono text-sm px-3 py-2 border-2 border-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F172A] text-white text-xs font-mono font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all shrink-0"
            >
              Apply Absent
            </button>
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3 py-2 bg-emerald-600 text-white text-xs font-mono font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1 shrink-0"
              title="60-Second Rule: Mark all eligible students Present"
            >
              <Check className="w-3.5 h-3.5" />
              All P
            </button>
          </div>
        </form>
      </div>

      {/* Roster Cards with Consistent Box Theme */}
      <div className="space-y-3 w-full min-w-0">
        {enrollments.map((enr) => {
          const rec = getRecord(enr.id);
          const currentStatus: AttendanceStatus = rec ? rec.status : 'P';
          const summary = calculateStudentAttendance(enr, sessions, records);

          return (
            <div
              key={enr.id}
              className={`p-3 sm:p-4 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                currentStatus === 'A'
                  ? 'bg-rose-50'
                  : currentStatus === 'M'
                  ? 'bg-amber-50'
                  : 'bg-white'
              }`}
            >
              {/* Student Identity */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="font-mono text-sm sm:text-base font-black text-[#0F172A] bg-[#F8FAFC] px-2.5 py-1 text-center border-2 border-[#0F172A] shadow-[1px_1px_0px_#0F172A] shrink-0">
                  {enr.roll_number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm sm:text-base text-[#0F172A] flex flex-wrap items-center gap-2">
                    <span className="truncate">{enr.student_name}</span>
                    {summary.isDetained && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-200 text-[#9F1239] border border-[#9F1239] font-bold uppercase shrink-0">
                        Detained {summary.percentage}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#64748B] font-mono flex items-center gap-2 truncate mt-0.5">
                    <span>{enr.enrollment_number}</span>
                    <span>•</span>
                    <span className={summary.isDetained ? 'text-rose-700 font-bold' : 'text-emerald-800 font-bold'}>
                      Overall: {summary.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 44px Tactile 3-State Segmented Pill Buttons with Sharp 2px Borders */}
              <div className="flex items-center self-end sm:self-auto border-2 border-[#0F172A] bg-white p-0.5 shadow-[2px_2px_0px_#0F172A] shrink-0">
                {/* Present (P) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    if (activeSession) onUpdateStatus(activeSession.id, enr.id, 'P');
                  }}
                  className={`min-w-[44px] min-h-[44px] px-3 font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                    currentStatus === 'P'
                      ? 'bg-[#10B981] text-white font-black'
                      : 'text-[#475569] hover:bg-slate-100'
                  }`}
                  aria-label="Mark Present"
                >
                  P
                </button>

                {/* Absent (A) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    if (activeSession) onUpdateStatus(activeSession.id, enr.id, 'A');
                  }}
                  className={`min-w-[44px] min-h-[44px] px-3 font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                    currentStatus === 'A'
                      ? 'bg-[#F43F5E] text-white font-black'
                      : 'text-[#475569] hover:bg-slate-100'
                  }`}
                  aria-label="Mark Absent"
                >
                  A
                </button>

                {/* Medical / Duty Leave (M) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    if (activeSession) onUpdateStatus(activeSession.id, enr.id, 'M');
                  }}
                  className={`min-w-[44px] min-h-[44px] px-3 font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                    currentStatus === 'M' || currentStatus === 'DL'
                      ? 'bg-[#F59E0B] text-white font-black'
                      : 'text-[#475569] hover:bg-slate-100'
                  }`}
                  aria-label="Mark Medical Leave"
                >
                  M
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Session Creator Modal */}
      {isCreatingSession && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A]">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4 font-display">Create Attendance Slot</h3>
            
            <div className="space-y-4 text-sm font-mono">
              <div>
                <label className="block text-xs text-[#0F172A] font-bold mb-1">Session Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#0F172A] font-bold mb-1">Slot Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. 02:00 PM Extra Class"
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#0F172A] font-bold mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as 'lecture' | 'lab' | 'double_period' | 'extra';
                      setNewType(t);
                      if (t === 'lab' || t === 'double_period') setNewWeight(2.0);
                      else setNewWeight(1.0);
                    }}
                    className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                  >
                    <option value="lecture">Lecture (1x)</option>
                    <option value="lab">Lab (2x)</option>
                    <option value="double_period">Double Period (2x)</option>
                    <option value="extra">Extra Class (1x)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#0F172A] font-bold mb-1">Weight Factor</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="4.0"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 1.0)}
                    className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsCreatingSession(false)}
                className="px-4 py-2 border-2 border-[#0F172A] text-[#0F172A] bg-white hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreateSession(newDate, newLabel, newType, newWeight);
                  setIsCreatingSession(false);
                }}
                className="px-4 py-2 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Add Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
