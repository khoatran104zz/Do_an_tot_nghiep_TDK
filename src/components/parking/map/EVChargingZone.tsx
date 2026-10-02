'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EVSlotItem {
  id: string;
  code: string;
  status: 'available' | 'occupied' | 'reserved';
}

export interface EVChargingZoneProps {
  slots?: EVSlotItem[];
  selectedSlotId?: string | null;
  onSelectSlot?: (slot: any) => void;
  className?: string;
}

const DEFAULT_EV_SLOTS: EVSlotItem[] = [
  { id: 'EV-01', code: 'EV-01', status: 'available' },
  { id: 'EV-02', code: 'EV-02', status: 'available' },
  { id: 'EV-03', code: 'EV-03', status: 'available' },
];

/**
 * EVChargingZone Component
 * Displays the green rounded box with EV-01, EV-02, EV-03 charging bays
 * matching Figma design.
 */
export function EVChargingZone({
  slots = DEFAULT_EV_SLOTS,
  selectedSlotId,
  onSelectSlot,
  className,
}: EVChargingZoneProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-[#22C55E]/40 dark:border-emerald-500/30 p-3',
        'bg-[#E8F5ED]/30 dark:bg-emerald-950/20 flex flex-col justify-between',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F6B4F] dark:text-emerald-300 uppercase tracking-wider mb-2">
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>EV CHARGING</span>
      </div>

      {/* Slots row */}
      <div className="flex items-center gap-2">
        {slots.map((s) => {
          const isSelected = selectedSlotId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSlot?.(s)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl border transition-all cursor-pointer',
                'bg-white dark:bg-slate-900 border-[#22C55E]/50 dark:border-emerald-500/50',
                'hover:border-[#0F6B4F] hover:shadow-xs',
                isSelected &&
                  'border-2 border-[#0F6B4F] dark:border-emerald-400 ring-2 ring-[#0F6B4F]/30 bg-[#E8F5ED] dark:bg-emerald-950/60'
              )}
            >
              <Zap className="w-3.5 h-3.5 text-[#0F6B4F] dark:text-emerald-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                {s.code}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EVChargingZone;
