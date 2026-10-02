'use client';

import React from 'react';
import { ArrowUp, ArrowDown, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ParkingEntrance({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F6B4F] text-white font-bold text-xs shadow-xs select-none',
        className
      )}
    >
      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
      <span>ENTRY</span>
    </div>
  );
}

export function SecurityBooth({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-2xs select-none',
        className
      )}
    >
      <Shield className="w-3.5 h-3.5 text-slate-400" />
      <span>SECURITY</span>
    </div>
  );
}

export function ParkingExit({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#EF4444] text-white font-bold text-xs shadow-xs select-none',
        className
      )}
    >
      <ArrowDown className="w-3 h-3 stroke-[2.5]" />
      <span>EXIT</span>
      <ArrowRight className="w-3 h-3 stroke-[2.5]" />
    </div>
  );
}
