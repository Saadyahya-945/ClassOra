'use client';

import React, { useEffect, useState } from 'react';
import { syncEngine, SyncState } from '@/lib/sync/syncEngine';
import { CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';

export function SyncStatusBanner() {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {syncState === 'offline' && pendingCount > 0 && (
        <div className="bg-[#FEF3C7] border-b-2 border-[#0F172A] text-[#92400E] px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
          <span className="break-words">
            <strong>WARNING:</strong> {pendingCount} change{pendingCount > 1 ? 's' : ''} saved on this device only. Connect to internet to back up to your Google Account.
          </span>
        </div>
      )}

      {syncState === 'offline' && pendingCount === 0 && (
        <div className="bg-[#F1F5F9] border-b-2 border-[#0F172A] text-[#475569] px-4 py-1.5 text-xs font-mono flex items-center justify-center gap-2">
          <CloudOff className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
          <span>Classroom Offline Mode active — local records cached in IndexedDB</span>
        </div>
      )}
    </>
  );
}

export function SyncPill() {
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  if (syncState === 'syncing') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-blue-50 border-2 border-[#0F172A] text-blue-800 shadow-[1px_1px_0px_#0F172A]">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
        <span>Syncing ({pendingCount})...</span>
      </div>
    );
  }

  if (syncState === 'pending') {
    return (
      <button
        onClick={() => syncEngine.triggerSync()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-amber-100 border-2 border-[#0F172A] text-[#92400E] shadow-[2px_2px_0px_#0F172A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
        title="Click to sync now"
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        <span>Pending ({pendingCount})</span>
      </button>
    );
  }

  if (syncState === 'offline') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 border-2 border-[#0F172A] text-slate-800 shadow-[1px_1px_0px_#0F172A]">
        <CloudOff className="w-3.5 h-3.5 text-slate-600" />
        <span>Offline</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-emerald-50 border-2 border-[#0F172A] text-[#065F46] shadow-[1px_1px_0px_#0F172A]">
      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
      <span className="hidden xs:inline">Synced</span>
    </div>
  );
}
