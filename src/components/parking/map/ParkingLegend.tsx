'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ParkingLegendProps {
  className?: string;
}

/**
 * ParkingLegend Component
 * Displays the semantic color dot indicators matching the Figma design:
 * Available, Occupied, Reserved, EV / Accessible, Unavailable
 */
export function ParkingLegend({ className }: ParkingLegendProps) {
  const items = [
    { label: 'Available', dotClass: 'bg-[#22C55E]' },
    { label: 'Occupied', dotClass: 'bg-[#EF4444]' },
    { label: 'Reserved', dotClass: 'bg-[#F59E0B]' },
    { label: 'EV / Accessible', dotClass: 'bg-[#0F6B4F] dark:bg-emerald-400' },
    { label: 'Unavailable', dotClass: 'bg-slate-300 dark:bg-slate-600' },
  ];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none',
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', item.dotClass)} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default ParkingLegend;
