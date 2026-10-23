'use client';

import React, { useState, useMemo } from 'react';
import { AttendanceRecord, AttendanceSession, Enrollment, AttendanceStatus } from '@/types/database';
import { calculateStudentAttendance } from '@/lib/calculations/attendance';
import { Filter, ArrowUpDown } from 'lucide-react';

interface CabinModeGridProps {
  enrollments: Enrollment[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  minAttendancePct: number;
  onUpdateStatus: (sessionId: string, enrollmentId: string, status: AttendanceStatus) => void;
}

type SortField = 'roll' | 'enrollment' | 'name' | 'attendance_asc' | 'attendance_desc';

export function CabinModeGrid({
  enrollments,
  sessions,
  records,
  minAttendancePct,
  onUpdateStatus,
}: CabinModeGridProps) {
  const [sortField, setSortField] = useState<SortField>('roll');
  const [filterDetainedOnly, setFilterDetainedOnly] = useState(false);

  const studentMetrics = useMemo(() => {
    const map = new Map();
    enrollments.forEach((enr) => {
      const summary = calculateStudentAttendance(enr, sessions, records, 'credit_present', minAttendancePct);
      map.set(enr.id, summary);
    });
    return map;
  }, [enrollments, sessions, records, minAttendancePct]);

  const displayedStudents = useMemo(() => {
    let list = [...enrollments];

    if (filterDetainedOnly) {
      list = list.filter((enr) => {
        const metrics = studentMetrics.get(enr.id);
        return metrics?.isDetained;
      });
    }

    list.sort((a, b) => {
      const metA = studentMetrics.get(a.id);
      const metB = studentMetrics.get(b.id);

      if (sortField === 'roll') {
        return a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true });
      }
      if (sortField === 'enrollment') {
        return a.enrollment_number.localeCompare(b.enrollment_number);
      }
      if (sortField === 'name') {
        return a.student_name.localeCompare(b.student_name);
      }
      if (sortField === 'attendance_asc') {
        return (metA?.percentage || 0) - (metB?.percentage || 0);
      }
      if (sortField === 'attendance_desc') {
        return (metB?.percentage || 0) - (metA?.percentage || 0);
      }
      return 0;
    });

    return list;
  }, [enrollments, filterDetainedOnly, sortField, studentMetrics]);

  const recordMap = useMemo(() => {
    const m = new Map<string, AttendanceStatus>();
    records.forEach((r) => {
      m.set(`${r.session_id}_${r.enrollment_id}`, r.status);
    });
    return m;
  }, [records]);

  const cycleStatus = (sessionId: string, enrollmentId: string, current: AttendanceStatus) => {
    const nextMap: Record<AttendanceStatus, AttendanceStatus> = {
      P: 'A',
      A: 'M',
      M: 'P',
      DL: 'P',
      NA: 'P',
    };
    onUpdateStatus(sessionId, enrollmentId, nextMap[current] || 'P');
  };

  const detainedCount = enrollments.filter(e => studentMetrics.get(e.id)?.isDetained).length;

  return (
    <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] w-full min-w-0">
      {/* Table Professional Toolbar */}
      <div className="px-4 py-2.5 border-b-2 border-[#0F172A] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterDetainedOnly(!filterDetainedOnly)}
            className={`px-3 py-1.5 font-bold flex items-center gap-1.5 transition-all border-2 border-[#0F172A] ${
              filterDetainedOnly
                ? 'bg-[#9F1239] text-white shadow-[2px_2px_0px_#0F172A]'
                : 'bg-white text-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Below 75% ({detainedCount})
          </button>

          <span className="text-[#64748B] text-[11px] font-medium ml-1">
            Displaying <strong>{displayedStudents.length}</strong> of {enrollments.length} Students
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#0F172A] font-bold text-[11px]">Sort:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="border-2 border-[#0F172A] bg-white px-2.5 py-1 text-xs focus:outline-hidden font-mono shadow-[2px_2px_0px_#0F172A]"
          >
            <option value="roll">Roll Number (Ascending)</option>
            <option value="attendance_asc">Attendance % (Lowest First)</option>
            <option value="attendance_desc">Attendance % (Highest First)</option>
            <option value="name">Alphabetical Name</option>
            <option value="enrollment">Enrollment Number</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Table Container with Compact Columns */}
      <div className="overflow-x-auto max-h-[620px] relative">
        <table className="w-max min-w-full border-collapse text-left text-xs font-mono">
          <thead className="bg-[#0F172A] text-white sticky top-0 z-30 select-none border-b-2 border-[#0F172A]">
            <tr>
              {/* Frozen Left Identity Columns */}
              <th className="sticky left-0 bg-[#0F172A] z-40 px-2 py-2.5 w-12 text-center border-r border-slate-700 font-bold text-[11px] tracking-wider uppercase">
                Roll
              </th>
              <th className="sticky left-12 bg-[#0F172A] z-40 px-2.5 py-2.5 w-24 text-center border-r border-slate-700 font-bold text-[11px] tracking-wider uppercase">
                Enroll No
              </th>
              <th className="sticky left-36 bg-[#0F172A] z-40 px-3 py-2.5 w-44 text-left border-r border-slate-700 font-bold text-[11px] tracking-wider uppercase">
                Student Name
              </th>

              {/* Compact Session Columns */}
              {sessions.map((sess) => (
                <th
                  key={sess.id}
                  className="px-1 py-1.5 w-12 min-w-[48px] max-w-[52px] text-center border-r border-slate-800 bg-[#0F172A]"
                  title={`${sess.session_date} — ${sess.slot_label} (${sess.weight}x ${sess.session_type})\n${sess.topic_covered || ''}`}
                >
                  <div className="font-bold text-[11px] text-slate-100 leading-tight">
                    {sess.session_date.slice(5)}
                  </div>
                  <div className="text-[9px] font-mono mt-0.5">
                    <span className={`px-1 py-0.2 rounded-xs text-[9px] font-bold ${
                      sess.weight > 1 ? 'bg-blue-900 text-blue-200' : 'text-slate-400'
                    }`}>
                      {sess.weight}x
                    </span>
                  </div>
                </th>
              ))}

              {/* Frozen Right Summary Columns */}
              <th className="sticky right-40 bg-[#0F172A] z-40 px-2.5 py-2.5 w-20 text-center border-l border-slate-700 font-bold text-[11px] tracking-wider uppercase whitespace-nowrap">
                Att / Tot
              </th>
              <th className="sticky right-20 bg-[#0F172A] z-40 px-2.5 py-2.5 w-20 text-center border-l border-slate-700 font-bold text-[11px] tracking-wider uppercase whitespace-nowrap">
                Att %
              </th>
              <th className="sticky right-0 bg-[#0F172A] z-40 px-2.5 py-2.5 w-20 text-center border-l border-slate-700 font-bold text-[11px] tracking-wider uppercase">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {displayedStudents.map((enr, idx) => {
              const metrics = studentMetrics.get(enr.id);
              const isDetained = metrics?.isDetained;
              const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFF]';

              return (
                <tr
                  key={enr.id}
                  className={`hover:bg-blue-50/50 transition-colors ${
                    isDetained ? 'bg-rose-50/30' : rowBg
                  }`}
                >
                  {/* Sticky Left Identity Cells */}
                  <td className="sticky left-0 bg-white group-hover:bg-blue-50 z-20 px-2 py-2 text-center font-bold text-[#0F172A] border-r border-[#E2E8F0] text-xs">
                    {enr.roll_number}
                  </td>
                  <td className="sticky left-12 bg-white group-hover:bg-blue-50 z-20 px-2.5 py-2 text-center text-[#475569] border-r border-[#E2E8F0] text-[11px]">
                    {enr.enrollment_number}
                  </td>
                  <td className="sticky left-36 bg-white group-hover:bg-blue-50 z-20 px-3 py-2 font-semibold text-[#0F172A] border-r border-[#E2E8F0] text-xs truncate max-w-[176px]">
                    {enr.student_name}
                  </td>

                  {/* Compact Status Badges in Cells */}
                  {sessions.map((sess) => {
                    const key = `${sess.id}_${enr.id}`;
                    const status = recordMap.get(key) || 'P';

                    return (
                      <td
                        key={sess.id}
                        onClick={() => cycleStatus(sess.id, enr.id, status)}
                        className="px-1 py-1 text-center border-r border-[#E2E8F0] cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
                        title="Click to toggle (P -> A -> M)"
                      >
                        {status === 'P' ? (
                          <span className="inline-flex items-center justify-center w-7 h-6 text-[11px] font-black text-[#065F46] bg-emerald-50 border border-emerald-300 rounded-xs">
                            P
                          </span>
                        ) : status === 'A' ? (
                          <span className="inline-flex items-center justify-center w-7 h-6 text-[11px] font-black text-[#9F1239] bg-rose-50 border border-rose-300 rounded-xs">
                            A
                          </span>
                        ) : status === 'M' || status === 'DL' ? (
                          <span className="inline-flex items-center justify-center w-7 h-6 text-[11px] font-black text-[#92400E] bg-amber-50 border border-amber-300 rounded-xs">
                            M
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-6 text-[11px] text-slate-400">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Sticky Right Summary Cells */}
                  <td className="sticky right-40 bg-white z-20 px-2 py-2 text-center text-[#0F172A] border-l border-[#E2E8F0] font-bold text-xs whitespace-nowrap tabular-numbers">
                    {metrics?.attendedWeightedCredits} / {metrics?.totalWeightedClasses}
                  </td>
                  <td className={`sticky right-20 bg-white z-20 px-2 py-2 text-center font-black border-l border-[#E2E8F0] tabular-numbers text-xs whitespace-nowrap ${
                    isDetained ? 'text-[#9F1239]' : 'text-[#065F46]'
                  }`}>
                    {metrics?.percentage.toFixed(1)}%
                  </td>
                  <td className="sticky right-0 bg-white z-20 px-2 py-2 text-center border-l border-[#E2E8F0]">
                    {isDetained ? (
                      <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-[#9F1239] border border-rose-300 text-[10px] font-bold uppercase">
                        SHORT
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold uppercase">
                        SAFE
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Quick Legend Footer */}
      <div className="px-4 py-2 border-t-2 border-[#0F172A] bg-[#F8FAFC] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#64748B] gap-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#0F172A]">Legend:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 inline-block" /> Present (P)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3.5 h-3.5 bg-rose-100 border border-rose-300 inline-block" /> Absent (A)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 inline-block" /> Medical (M)
          </span>
        </div>
        <div className="text-[10px]">
          Click any status cell to instantly cycle: <strong>P → A → M</strong>
        </div>
      </div>
    </div>
  );
}
