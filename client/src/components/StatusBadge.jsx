import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ArrowRightCircle, 
  ShieldAlert,
  Send
} from 'lucide-react';

export function StatusBadge({ status, type = 'default' }) {
  if (!status) return null;

  // OUTPASS STATUSES
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        APPROVED
      </span>
    );
  }

  if (status === 'PENDING_WARDEN_APPROVAL') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        Pending Warden Review
      </span>
    );
  }

  if (status === 'PENDING_CHIEF_APPROVAL') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
        <ArrowRightCircle className="w-3.5 h-3.5 animate-pulse text-blue-400" />
        Pending Chief Warden Approval
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" />
        REJECTED
      </span>
    );
  }

  // COMPLAINT & CALL STATUSES
  if (status === 'Resolved' || status === 'Closed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3" />
        {status}
      </span>
    );
  }

  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock className="w-3 h-3 animate-spin" />
        In Progress
      </span>
    );
  }

  if (status === 'Assigned') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
        <ArrowRightCircle className="w-3 h-3" />
        Assigned
      </span>
    );
  }

  if (status === 'Received') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-cyan-600 border border-sky-500/30">
        <Clock className="w-3 h-3" />
        Received
      </span>
    );
  }

  if (status === 'Submitted' || status === 'Open') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/30">
        <Send className="w-3 h-3" />
        {status}
      </span>
    );
  }

  // PRIORITY BADGES
  if (status === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white animate-pulse">
        <ShieldAlert className="w-3 h-3" />
        CRITICAL
      </span>
    );
  }

  if (status === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-slate-900 dark:text-white">
        <AlertTriangle className="w-3 h-3" />
        HIGH
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
      {status}
    </span>
  );
}
