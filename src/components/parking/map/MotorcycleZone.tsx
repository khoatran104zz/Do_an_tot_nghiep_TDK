'use client';

import React from 'react';
import { Bike } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MotorcycleSlotItem {
  id: string;
  code: string;
  status: 'available' | 'occupied' | 'reserved';
}

export interface MotorcycleZoneProps {
  slots?: MotorcycleSlotItem[];
  selectedSlotId?: string | null;
  onSelectSlot?: (slot: any) => void;
  className?: string;
}

const DEFAULT_MOTO_SLOTS: MotorcycleSlotItem[] = [
  { id: 'MB1', code: 'MB1', status: 'occupied' },
  { id: 'MB2', code: 'MB2', status: 'available' },
  { id: 'MB3', code: 'MB3', status: 'available' },
  { id: 'MB4', code: 'MB4', status: 'occupied' },
  { id: 'MB5', code: 'MB5', status: 'available' },
  { id: 'MB6', code: 'MB6', status: 'occupied' },
];

/**
 * MotorcycleZone Component
 * Displays the motorcycle parking area with compact MB1..MB6 slots
 * matching the Figma design.
 */
export function MotorcycleZone({
  slots = DEFAULT_MOTO_SLOTS,
  selectedSlotId,
  onSelectSlot,
  className,
}: MotorcycleZoneProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 dark:border-slate-800 p-3',
        'bg-white/80 dark:bg-slate-900/80 flex flex-col justify-between shadow-2xs',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
        <Bike className="w-3.5 h-3.5 text-slate-500" />
        <span>MOTORCYCLE ZONE</span>
      </div>

      {/* Slots row */}
      <div className="grid grid-cols-6 gap-1.5">
        {slots.map((s) => {
          const isOccupied = s.status === 'occupied';
          const isSelected = selectedSlotId === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSlot?.(s)}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer',
                isOccupied
                  ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-500/70 dark:text-rose-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-500/70 dark:text-emerald-300',
                isSelected &&
                  'ring-2 ring-[#0F6B4F] dark:ring-emerald-400 border-[#0F6B4F] scale-105 z-10'
              )}
            >
              <Bike className="w-3 h-3 mb-0.5" />
              <span className="text-[9px] font-bold tracking-tight">{s.code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MotorcycleZone;
