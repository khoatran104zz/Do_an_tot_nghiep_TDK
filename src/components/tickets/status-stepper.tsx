'use client';

import React from 'react';
import { TicketStatus } from '@prisma/client';
import { CheckCircle2, Clock, Wrench, UserCheck, CheckCheck, XCircle } from 'lucide-react';

interface StatusStepperProps {
  status: TicketStatus;
  rejectReason?: string | null;
  history?: Array<{
    toStatus: TicketStatus;
    changedAt: string | Date;
  }>;
}

const STEPS: Array<{ key: TicketStatus; label: string; icon: any }> = [
  { key: TicketStatus.NEW, label: 'Mới tiếp nhận', icon: Clock },
  { key: TicketStatus.ASSIGNED, label: 'Đã phân công', icon: UserCheck },
  { key: TicketStatus.PROCESSING, label: 'Đang sửa chữa', icon: Wrench },
  { key: TicketStatus.RESOLVED, label: 'Đã xử lý', icon: CheckCircle2 },
  { key: TicketStatus.CLOSED, label: 'Đã đóng', icon: CheckCheck },
];

export function StatusStepper({ status, rejectReason }: StatusStepperProps) {
  if (status === TicketStatus.REJECTED) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
        <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-rose-900 text-sm">Yêu cầu đã bị từ chối tiếp nhận</h4>
          <p className="text-sm text-rose-700 mt-1">
            {rejectReason ? `Lý do: ${rejectReason}` : 'Ban Quản Lý đã xem xét và từ chối yêu cầu bảo trì này.'}
          </p>
        </div>
      </div>
    );
  }

  const getStepIndex = (st: TicketStatus) => {
    switch (st) {
      case TicketStatus.NEW:
        return 0;
      case TicketStatus.ASSIGNED:
        return 1;
      case TicketStatus.PROCESSING:
        return 2;
      case TicketStatus.RESOLVED:
        return 3;
      case TicketStatus.CLOSED:
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative">
        {/* Connecting progress line */}
        <div className="absolute top-5 left-6 right-6 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-xs shadow-xs ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-emerald-200 ring-4 ring-emerald-50'
                    : isCurrent
                    ? 'bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-100 animate-pulse'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span
                className={`mt-2 text-xs text-center font-medium max-w-[80px] leading-tight ${
                  isDone
                    ? 'text-emerald-700 font-semibold'
                    : isCurrent
                    ? 'text-indigo-700 font-bold'
                    : 'text-slate-600'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
