'use client';

import React from 'react';
import { TicketPriority } from '@prisma/client';
import { AlertCircle, AlertTriangle, Flame, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const configs: Record<
    TicketPriority,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    LOW: {
      label: 'Ưu tiên Thấp',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: Info,
    },
    MEDIUM: {
      label: 'Bình thường',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: AlertCircle,
    },
    HIGH: {
      label: 'Ưu tiên Cao',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: AlertTriangle,
    },
    URGENT: {
      label: 'Khẩn cấp (4h)',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: Flame,
    },
    CRITICAL: {
      label: 'Khẩn cấp (4h)',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: Flame,
    },
  };

  const config = configs[priority] || configs.MEDIUM;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}
