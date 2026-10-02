'use client';

import React from 'react';
import { Footprints, LogOut, Building, Milestone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FacilitiesBoxProps {
  className?: string;
}

/**
 * FacilitiesBox Component
 * Displays facility indicators (Elevator, Stairs, Walkway, Exit)
 * matching the Figma Smart Parking Map design.
 */
export function FacilitiesBox({ className }: FacilitiesBoxProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 dark:border-slate-800 p-3',
        'bg-white/80 dark:bg-slate-900/80 shadow-2xs flex flex-col justify-between',
        className
      )}
    >
      {/* Header */}
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
        FACILITIES
      </span>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <Building className="w-3.5 h-3.5 text-blue-500" />
          <span>ELEVATOR</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <Footprints className="w-3.5 h-3.5 text-amber-500" />
          <span>STAIRS</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <Milestone className="w-3.5 h-3.5 text-slate-400" />
          <span>WALKWAY</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
          <span>EXIT</span>
        </div>
      </div>
    </div>
  );
}

export default FacilitiesBox;
