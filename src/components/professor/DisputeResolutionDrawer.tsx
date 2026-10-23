'use client';

import React, { useState } from 'react';
import { CorrectionRequest } from '@/types/database';
import { X, Check, Ban } from 'lucide-react';

interface DisputeResolutionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  disputes: CorrectionRequest[];
  onResolveDispute: (disputeId: string, action: 'approve' | 'reject', note: string) => void;
}

export function DisputeResolutionDrawer({
  isOpen,
  onClose,
  disputes,
  onResolveDispute,
}: DisputeResolutionDrawerProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [professorNotes, setProfessorNotes] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const pendingDisputes = disputes.filter((d) => d.status === 'pending');
  const resolvedDisputes = disputes.filter((d) => d.status !== 'pending');
  const displayed = activeTab === 'pending' ? pendingDisputes : resolvedDisputes;

  const handleAction = (disputeId: string, action: 'approve' | 'reject') => {
    const note = professorNotes[disputeId] || (action === 'approve' ? 'Approved by Professor' : 'Rejected after verification');
    onResolveDispute(disputeId, action, note);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l-2 border-[#0F172A] p-6 animate-in slide-in-from-right duration-200 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-4 mb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-[#0F172A] flex items-center gap-2">
                <span>Dispute &amp; Correction Queue</span>
                {pendingDisputes.length > 0 && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-xs font-mono font-bold border border-[#0F172A]">
                    {pendingDisputes.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">Audit-logged dispute resolution</p>
            </div>
            <button onClick={onClose} className="p-1 border border-[#0F172A] text-[#0F172A] hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-[#0F172A] mb-4 text-xs font-mono">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-4 font-bold border-b-4 transition-all ${
                activeTab === 'pending'
                  ? 'border-[#0F172A] text-[#0F172A] bg-slate-100'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Pending ({pendingDisputes.length})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`py-2 px-4 font-bold border-b-4 transition-all ${
                activeTab === 'resolved'
                  ? 'border-[#0F172A] text-[#0F172A] bg-slate-100'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Resolved History ({resolvedDisputes.length})
            </button>
          </div>

          {/* List of Disputes */}
          <div className="overflow-y-auto max-h-[calc(100vh-220px)] space-y-4">
            {displayed.length === 0 ? (
              <div className="p-8 text-center text-[#64748B] font-mono text-xs border-2 border-dashed border-[#CBD5E1]">
                No {activeTab} correction tickets found.
              </div>
            ) : (
              displayed.map((d) => (
                <div key={d.id} className="border-2 border-[#0F172A] p-4 bg-white shadow-[3px_3px_0px_#0F172A] space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#0F172A] truncate">
                        Roll {d.roll_number || '14'} — {d.student_name || 'Student'}
                      </div>
                      <div className="text-[#64748B] text-[11px] mt-0.5 truncate">
                        Target: <span className="font-bold text-[#0F172A]">{d.target_description || d.target_type}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase border border-[#0F172A] shrink-0 ${
                        d.status === 'pending'
                          ? 'bg-amber-100 text-amber-950'
                          : d.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-950'
                          : 'bg-rose-100 text-rose-950'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] border-2 border-[#E2E8F0] p-2.5 text-[#0F172A] italic break-words">
                    &ldquo;{d.student_message}&rdquo;
                  </div>

                  {d.status === 'pending' ? (
                    <div className="space-y-2 pt-2 border-t-2 border-[#E2E8F0]">
                      <input
                        type="text"
                        placeholder="Resolution note (optional)..."
                        value={professorNotes[d.id] || ''}
                        onChange={(e) =>
                          setProfessorNotes({ ...professorNotes, [d.id]: e.target.value })
                        }
                        className="w-full border-2 border-[#0F172A] p-1.5 text-xs bg-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(d.id, 'approve')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-1 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(d.id, 'reject')}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center justify-center gap-1 transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                      Resolution note: <strong>{d.professor_note || 'Resolved'}</strong>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#64748B] border-t-2 border-[#0F172A] pt-3 mt-4">
          All approvals and rejections write an immutable log to public.audit_logs.
        </div>
      </div>
    </div>
  );
}
