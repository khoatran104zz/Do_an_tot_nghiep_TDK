import { VisitorStatus } from '@prisma/client';

export const VISITOR_STATUS_MAP: Record<
  VisitorStatus,
  { label: string; color: string; badgeClass: string }
> = {
  PENDING: {
    label: 'Chờ đến',
    color: '#eab308',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  CHECKED_IN: {
    label: 'Đang trong tòa nhà',
    color: '#22c55e',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  CHECKED_OUT: {
    label: 'Đã rời đi',
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  EXPIRED: {
    label: 'Hết hạn',
    color: '#64748b',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: '#ef4444',
    badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  },
};
