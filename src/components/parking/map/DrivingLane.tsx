'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrivingLaneProps {
  label?: string;
  isOneWay?: boolean;
  className?: string;
}

/**
 * DrivingLane Component
 * Renders dashed traffic lane markings with directional arrows or lane labels
 * as shown in the Figma Smart Parking Map design.
 */
export function DrivingLane({
  label = 'LANE A',
  isOneWay = false,
  className,
}: DrivingLaneProps) {
  if (isOneWay) {
    return (
      <div
        className={cn(
          'w-full py-2 flex items-center justify-center gap-3 select-none text-[10px] font-bold tracking-widest uppercase',
          'text-slate-400 dark:text-slate-500',
          className
        )}
      >
        <div className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700/80" />
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40">
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span>ONE-WAY TRAFFIC</span>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-700/80" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full py-2 flex items-center justify-center gap-3 select-none text-[10px] font-bold tracking-widest uppercase',
        'text-[#0F6B4F] dark:text-emerald-400',
        className
      )}
    >
      <div className="flex-1 border-b border-dashed border-[#0F6B4F]/30 dark:border-emerald-500/30" />
      <span className="px-2 py-0.5 rounded-md bg-[#E8F5ED]/60 dark:bg-emerald-950/40 border border-[#0F6B4F]/20 dark:border-emerald-500/20">
        {label}
      </span>
      <div className="flex-1 border-b border-dashed border-[#0F6B4F]/30 dark:border-emerald-500/30" />
    </div>
  );
}

export default DrivingLane;
