'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'attendance' | 'assessment';
  targetId: string;
  targetDescription: string;
  courseId: string;
  enrollmentId: string;
  onSubmit: (targetType: 'attendance' | 'assessment', targetId: string, message: string) => void;
}

export function DisputeModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetDescription,
  onSubmit,
}: DisputeModalProps) {
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSubmit(targetType, targetId, message.trim());
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-6 border-2 border-[#0F172A] shadow-[6px_6px_0px_#0F172A]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#0F172A]">
          <div>
            <h3 className="font-bold font-display text-base text-[#0F172A]">Flag Correction Request</h3>
            <p className="text-xs text-[#64748B] font-mono mt-0.5">Submit verification dispute to Professor</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#0F172A] hover:bg-slate-100 border border-[#0F172A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSent ? (
          <div className="p-6 text-center space-y-2 bg-emerald-50 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A]">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold font-display text-emerald-950 text-sm">Dispute Ticket Submitted</div>
            <p className="text-xs text-emerald-800 font-mono">
              The professor will review your claim and verify attendance logs.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-[#F8FAFC] border-2 border-[#0F172A]">
              <span className="text-[10px] uppercase text-[#64748B] font-bold block mb-0.5">Target Record</span>
              <div className="font-bold text-[#0F172A] text-sm break-words">{targetDescription}</div>
              <div className="text-[11px] text-blue-700 font-semibold capitalize mt-0.5">Category: {targetType}</div>
            </div>

            <div>
              <label className="block text-[#0F172A] font-bold mb-1">
                Explanation for Professor:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Sir, I was present in the lab on 14 Oct. You signed my register sheet..."
                rows={3}
                required
                className="w-full p-2.5 border-2 border-[#0F172A] bg-white text-xs text-[#0F172A] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-[#0F172A] bg-white text-[#0F172A] font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0F172A] text-white font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Ticket
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
