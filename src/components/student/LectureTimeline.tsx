'use client';

import React, { useState } from 'react';
import { AttendanceRecord, AttendanceSession } from '@/types/database';
import { Clock, CheckCircle2, XCircle, ShieldCheck, Flag } from 'lucide-react';
import { DisputeModal } from './DisputeModal';

interface LectureTimelineProps {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  enrollmentId: string;
  courseId: string;
  onRaiseCorrection: (targetType: 'attendance' | 'assessment', targetId: string, message: string) => void;
}

export function LectureTimeline({
  sessions,
  records,
  enrollmentId,
  courseId,
  onRaiseCorrection,
}: LectureTimelineProps) {
  const [activeDisputeTarget, setActiveDisputeTarget] = useState<{
    id: string;
    description: string;
  } | null>(null);

  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    if (r.enrollment_id === enrollmentId) {
      recordMap.set(r.session_id, r);
    }
  });

  const sortedSessions = [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date));

  return (
    <div className="space-y-4 w-full min-w-0">
      <div>
        <h3 className="text-base sm:text-lg font-bold font-display text-[#0F172A] flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <span>Lecture Transaction Timeline</span>
        </h3>
        <p className="text-xs text-[#64748B] font-mono">
          Real-time ledger feed with 1-click error flagger
        </p>
      </div>

      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] divide-y-2 divide-[#E2E8F0] overflow-hidden w-full min-w-0">
        {sortedSessions.map((sess) => {
          const rec = recordMap.get(sess.id);
          const status = rec ? rec.status : 'P';

          let statusBadge = (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-emerald-100 text-[#065F46] border border-[#065F46]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46]" />
              PRESENT
            </span>
          );

          if (status === 'A') {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-rose-100 text-[#9F1239] border border-[#9F1239]">
                <XCircle className="w-3.5 h-3.5 text-[#9F1239]" />
                ABSENT
              </span>
            );
          } else if (status === 'M' || status === 'DL') {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-amber-100 text-[#92400E] border border-[#92400E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#92400E]" />
                {status === 'M' ? 'MEDICAL' : 'DUTY LEAVE'}
              </span>
            );
          } else if (status === 'NA') {
            statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 text-[#64748B] border border-[#CBD5E1]">
                NOT APPLICABLE
              </span>
            );
          }

          return (
            <div
              key={sess.id}
              className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 bg-[#F8FAFC] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] text-[#0F172A] shrink-0 font-mono text-center min-w-[54px]">
                  <div className="text-[10px] uppercase font-bold text-[#64748B]">
                    {new Date(sess.session_date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-base font-black text-[#0F172A] leading-none">
                    {sess.session_date.split('-')[2]}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-[#0F172A] flex flex-wrap items-center gap-2">
                    <span className="truncate">{sess.slot_label}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-[#0F172A]">
                      {sess.weight}x {sess.session_type}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B] font-mono mt-0.5 break-words">
                    {sess.topic_covered || 'Standard syllabus lecture & attendance verification'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {statusBadge}

                <button
                  onClick={() =>
                    setActiveDisputeTarget({
                      id: sess.id,
                      description: `${sess.session_date} — ${sess.slot_label} (${sess.weight}x)`,
                    })
                  }
                  className="px-2.5 py-1 text-xs font-mono font-bold text-[#0F172A] hover:bg-[#0F172A] hover:text-white border border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none transition-all flex items-center gap-1"
                  title="Flag error or dispute attendance"
                >
                  <Flag className="w-3 h-3" />
                  <span>Flag</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispute Modal */}
      {activeDisputeTarget && (
        <DisputeModal
          isOpen={true}
          onClose={() => setActiveDisputeTarget(null)}
          targetType="attendance"
          targetId={activeDisputeTarget.id}
          targetDescription={activeDisputeTarget.description}
          courseId={courseId}
          enrollmentId={enrollmentId}
          onSubmit={onRaiseCorrection}
        />
      )}
    </div>
  );
}
