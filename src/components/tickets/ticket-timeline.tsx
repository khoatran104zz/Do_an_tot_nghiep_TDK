'use client';

import React from 'react';
import { TicketStatus } from '@prisma/client';
import { Clock, UserCheck, Wrench, CheckCircle2, CheckCheck, XCircle, Star, MessageSquare } from 'lucide-react';

export interface HistoryItem {
  id: string;
  fromStatus?: TicketStatus | null;
  toStatus: TicketStatus;
  changedById: string;
  changedBy?: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  changedAt: string | Date;
  note?: string | null;
}

interface TicketTimelineProps {
  history: HistoryItem[];
  rating?: number | null;
  ratingComment?: string | null;
}

export function TicketTimeline({ history, rating, ratingComment }: TicketTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-600">
        Chưa có nhật ký hoạt động nào được ghi nhận.
      </div>
    );
  }

  const getStatusIcon = (st: TicketStatus) => {
    switch (st) {
      case TicketStatus.NEW:
        return { icon: Clock, color: 'bg-indigo-100 text-indigo-700 ring-indigo-50' };
      case TicketStatus.ASSIGNED:
        return { icon: UserCheck, color: 'bg-blue-100 text-blue-700 ring-blue-50' };
      case TicketStatus.PROCESSING:
        return { icon: Wrench, color: 'bg-amber-100 text-amber-700 ring-amber-50' };
      case TicketStatus.RESOLVED:
        return { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 ring-emerald-50' };
      case TicketStatus.CLOSED:
        return { icon: CheckCheck, color: 'bg-slate-100 text-slate-700 ring-slate-50' };
      case TicketStatus.REJECTED:
        return { icon: XCircle, color: 'bg-rose-100 text-rose-700 ring-rose-50' };
      default:
        return { icon: MessageSquare, color: 'bg-slate-100 text-slate-700 ring-slate-50' };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
      {history.map((item, index) => {
        const { icon: Icon, color } = getStatusIcon(item.toStatus);
        const dateObj = new Date(item.changedAt);
        const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return (
          <div key={item.id || index} className="relative flex items-start gap-4">
            {/* Timeline bullet */}
            <div
              className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${color}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">
                    {item.changedBy?.fullName || 'Người dùng'}
                  </span>
                  <span className="text-2xs font-medium px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                    {item.changedBy?.role || 'Hệ thống'}
                  </span>
                </div>
                <span className="text-xs text-slate-600">
                  {timeStr} • {dateStr}
                </span>
              </div>

              {item.note && (
                <p className="mt-1 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/60">
                  {item.note}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* If rating submitted, display as the final star milestone */}
      {rating && (
        <div className="relative flex items-start gap-4">
          <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white bg-amber-100 text-amber-600">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          </div>
          <div className="flex-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-amber-900">Cư dân đánh giá chất lượng</span>
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-800">{rating}/5 sao</span>
            </div>
            {ratingComment && (
              <p className="mt-1 text-xs text-amber-900 italic">"{ratingComment}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
