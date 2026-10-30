'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  WifiOff,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { seedDemoDataIfEmpty } from '@/lib/mockData';

export default function LandingPage() {
  useEffect(() => {
    seedDemoDataIfEmpty();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#0F172A] selection:text-white overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="border-b-2 border-[#0F172A] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-[#0F172A] flex items-center justify-center text-white font-black font-display text-lg shrink-0 border border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
              C
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="font-display font-black text-xl tracking-tight text-[#0F172A]">ClassOra</span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-[#0F172A] font-bold border border-[#0F172A]">
                DIGITAL CR
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-[#0F172A] text-[#0F172A] text-xs font-mono font-bold shadow-[2px_2px_0px_#0F172A]">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Dual-Personality Academic Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black font-display tracking-tight text-[#0F172A] leading-tight break-words">
            Classroom Dead-Zones,{' '}
            <span className="text-blue-600 underline decoration-4 decoration-[#0F172A]">
              Conquered.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#475569] leading-relaxed font-sans max-w-2xl mx-auto px-2">
            A zero-clutter <strong>Swiss Ledger</strong> that takes attendance in under 45 seconds for veteran professors, paired with an <strong>Academic Fintech Wallet</strong> and 75% Attendance Radar for students.
          </p>

          {/* Dual Entry Cards with Unified Box Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left w-full max-w-4xl mx-auto">
            {/* Professor Workspace Card */}
            <Link
              href="/professor"
              className="group p-5 sm:p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex items-center justify-between mb-4 gap-2">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-900 font-mono text-xs font-bold uppercase border border-slate-300 shrink-0">
                    Faculty Portal
                  </span>
                  <UserCheck className="w-6 h-6 text-[#0F172A] shrink-0" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F172A] mb-2 group-hover:text-blue-700 transition-colors break-words">
                  Professor Workspace →
                </h3>
                <p className="text-xs text-[#475569] font-mono leading-relaxed mb-4 break-words">
                  Podium 60-second quick roll call, Cabin spreadsheet with frozen columns, bulk date-range medical leaves, automated Best-of-N sessional math, and 1-click HOD exports.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono font-bold text-[#0F172A]">
                <span>                Professor Login</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Student Workspace Card - UNIFIED TO MATCH THE SAME SWISS BOX THEME */}
            <Link
              href="/student"
              className="group p-5 sm:p-6 bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex items-center justify-between mb-4 gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-900 font-mono text-xs font-bold uppercase border border-blue-300 shrink-0">
                    Student Portal
                  </span>
                  <GraduationCap className="w-6 h-6 text-blue-600 shrink-0" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-[#0F172A] mb-2 group-hover:text-blue-700 transition-colors break-words">
                  Student Academic Wallet →
                </h3>
                <p className="text-xs text-[#475569] font-mono leading-relaxed mb-4 break-words">
                  Live 75% Attendance Radar with glowing progress rings, tactile &quot;What-If&quot; attendance simulator, published sessional marks breakdown, and 1-click correction dispute tickets.
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono font-bold text-[#0F172A]">
                <span>Student Login (Demo: Rahul #14)</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Feature Badges Grid - Unified Sharp Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-12 sm:mt-16 pt-8 border-t-2 border-[#0F172A] font-mono text-xs w-full">
          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] min-w-0">
            <Zap className="w-5 h-5 text-amber-500 mb-2" />
            <div className="font-bold text-[#0F172A] break-words">45-Second Attendance</div>
            <p className="text-[11px] text-[#64748B] mt-1 break-words">Numpad roll call &amp; Mark All Present defaults.</p>
          </div>

          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] min-w-0">
            <WifiOff className="w-5 h-5 text-blue-600 mb-2" />
            <div className="font-bold text-[#0F172A] break-words">Dead-Zone Safe</div>
            <p className="text-[11px] text-[#64748B] mt-1 break-words">Dexie.js IndexedDB local-first cache with auto-retry sync.</p>
          </div>

          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="font-bold text-[#0F172A] break-words">HOD One-Click Export</div>
            <p className="text-[11px] text-[#64748B] mt-1 break-words">Formatted Excel .xlsx and official PDF with signature lines.</p>
          </div>

          <div className="p-4 bg-white border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] min-w-0">
            <ShieldCheck className="w-5 h-5 text-indigo-600 mb-2" />
            <div className="font-bold text-[#0F172A] break-words">Audit-Proof Security</div>
            <p className="text-[11px] text-[#64748B] mt-1 break-words">Immutable correction history &amp; medical leave tracking.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#0F172A] bg-white py-6 text-center text-xs font-mono text-[#64748B] px-4">
        <span>ClassOra — Arman Ahmad &amp; Yahya Kidwai| Version 1.0</span>
      </footer>
    </div>
  );
}
