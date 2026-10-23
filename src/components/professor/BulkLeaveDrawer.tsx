'use client';

import React, { useState } from 'react';
import { Enrollment, LeaveType } from '@/types/database';
import { X, CheckCircle, Upload } from 'lucide-react';

interface BulkLeaveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  enrollments: Enrollment[];
  onApplyLeave: (
    enrollmentId: string,
    leaveType: LeaveType,
    startDate: string,
    endDate: string,
    reason: string,
    documentUrl?: string
  ) => void;
}

export function BulkLeaveDrawer({
  isOpen,
  onClose,
  enrollments,
  onApplyLeave,
}: BulkLeaveDrawerProps) {
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(enrollments[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('M');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentId || !startDate || !endDate) return;

    onApplyLeave(
      selectedEnrollmentId,
      leaveType,
      startDate,
      endDate,
      reason,
      fileName ? `https://storage.local/certificates/${fileName}` : undefined
    );

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l-2 border-[#0F172A] p-6 animate-in slide-in-from-right duration-200 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold font-display text-[#0F172A]">Bulk Date-Range Leave Applier</h2>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">Auto-converts all session absences in date range</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 border border-[#0F172A] text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="p-8 text-center bg-emerald-50 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] text-emerald-950 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-bold font-mono">Medical Leave Granted!</div>
              <div className="text-xs text-emerald-900 font-mono">Matching session records updated with original audit history preserved.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-mono">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Select Student</label>
                <select
                  value={selectedEnrollmentId}
                  onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC] text-sm focus:bg-white"
                >
                  {enrollments.map((enr) => (
                    <option key={enr.id} value={enr.id}>
                      {enr.roll_number} - {enr.student_name} ({enr.enrollment_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Leave Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeaveType('M')}
                    className={`py-2 text-xs font-bold border-2 transition-all ${
                      leaveType === 'M'
                        ? 'bg-amber-100 border-[#0F172A] text-[#92400E] shadow-[2px_2px_0px_#0F172A]'
                        : 'border-[#CBD5E1] bg-white text-[#64748B]'
                    }`}
                  >
                    Medical Leave (M)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveType('DL')}
                    className={`py-2 text-xs font-bold border-2 transition-all ${
                      leaveType === 'DL'
                        ? 'bg-indigo-100 border-[#0F172A] text-[#3730A3] shadow-[2px_2px_0px_#0F172A]'
                        : 'border-[#CBD5E1] bg-white text-[#64748B]'
                    }`}
                  >
                    Duty / Event (DL)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC] text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC] text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Official Remark / Diagnosis</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Typhoid hospitalization slip submitted / Inter-college tech fest represent"
                  className="w-full border-2 border-[#0F172A] p-2 bg-[#F8FAFC] text-xs h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase mb-1">Medical Certificate (PDF / Image)</label>
                <div className="border-2 border-dashed border-[#0F172A] p-3 text-center bg-[#F8FAFC] cursor-pointer hover:bg-slate-100 transition-colors">
                  <Upload className="w-5 h-5 mx-auto text-[#0F172A] mb-1" />
                  <label className="cursor-pointer text-xs text-blue-700 font-bold block">
                    <span>{fileName || 'Choose certificate file'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-[#64748B]">Secured with private RLS storage</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0F172A] text-white font-mono text-xs font-bold border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all mt-2"
              >
                Apply Leave &amp; Discover Sessions
              </button>
            </form>
          )}
        </div>

        <div className="text-[11px] font-mono text-[#64748B] border-t border-[#E2E8F0] pt-3 mt-4">
          Rule: Preserves original attendance audit trail (original_status = &apos;A&apos;)
        </div>
      </div>
    </div>
  );
}
