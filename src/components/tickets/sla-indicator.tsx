'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export interface SLAData {
  dueAt: string | Date;
  status: 'ON_TRACK' | 'APPROACHING' | 'OVERDUE';
  remainingHours: number;
  label: string;
  isOverdue: boolean;
}

interface SLAIndicatorProps {
  sla?: SLAData | null;
  size?: 'sm' | 'md' | 'lg';
}

export function SLAIndicator({ sla, size = 'md' }: SLAIndicatorProps) {
  if (!sla) return null;

  const configs = {
    ON_TRACK: {
      dot: 'bg-emerald-500 ring-emerald-200',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      text: '🟢 On track (Đúng cam kết SLA)',
    },
    APPROACHING: {
      dot: 'bg-amber-500 ring-amber-200 animate-ping',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      text: '🟡 Approaching (Sắp đến hạn SLA)',
    },
    OVERDUE: {
      dot: 'bg-rose-500 ring-rose-200 animate-pulse',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertOctagon,
      text: '🔴 Overdue (Quá hạn SLA)',
    },
  };

  const config = configs[sla.status] || configs.ON_TRACK;
  const Icon = config.icon;

  const formattedDueDate = new Date(sla.dueAt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 font-medium ${config.badge} ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}
      title={`Hạn chót SLA: ${formattedDueDate}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
      </span>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="font-semibold">{config.text}</span>
      <span className="text-slate-400 font-normal">| Hạn: {formattedDueDate}</span>
    </div>
  );
}
