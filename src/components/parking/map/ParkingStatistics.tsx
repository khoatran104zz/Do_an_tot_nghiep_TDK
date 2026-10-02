'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ParkingStatisticsProps {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  evCharging: number;
  className?: string;
}

/**
 * ParkingStatistics Component
 * Strictly matching Figma Smart Parking Map design:
 * - Total Spaces
 * - Available (Green theme & percentage bar)
 * - Occupied (Red theme & percentage bar)
 * - Reserved (Amber theme & percentage bar)
 * - EV Charging (Emerald theme & percentage bar)
 */
export function ParkingStatistics({
  total = 120,
  available = 42,
  occupied = 68,
  reserved = 10,
  evCharging = 6,
  className,
}: ParkingStatisticsProps) {
  const safeTotal = total > 0 ? total : 1;
  const availPct = Math.min(100, Math.round((available / safeTotal) * 100));
  const occPct = Math.min(100, Math.round((occupied / safeTotal) * 100));
  const resPct = Math.min(100, Math.round((reserved / safeTotal) * 100));
  const evPct = Math.min(100, Math.round((evCharging / safeTotal) * 100));

  const cards = [
    {
      label: 'Total Spaces',
      labelVi: 'TỔNG SỐ CHỖ',
      value: total,
      color: 'text-slate-900 dark:text-white',
      bg: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200/90 dark:border-slate-800',
      pct: null,
      barColor: '',
    },
    {
      label: 'Available',
      labelVi: 'CÒN TRỐNG',
      value: available,
      color: 'text-[#15803D] dark:text-emerald-300',
      bg: 'bg-[#DCFCE7]/70 dark:bg-emerald-950/40',
      border: 'border-[#22C55E]/60 dark:border-emerald-500/50',
      pct: availPct,
      barColor: 'bg-[#22C55E]',
    },
    {
      label: 'Occupied',
      labelVi: 'ĐÃ ĐỖ XE',
      value: occupied,
      color: 'text-[#B91C1C] dark:text-rose-300',
      bg: 'bg-[#FEE2E2]/70 dark:bg-rose-950/40',
      border: 'border-[#EF4444]/60 dark:border-rose-500/50',
      pct: occPct,
      barColor: 'bg-[#EF4444]',
    },
    {
      label: 'Reserved',
      labelVi: 'ĐÃ ĐẶT CHỖ',
      value: reserved,
      color: 'text-[#92400E] dark:text-amber-300',
      bg: 'bg-[#FEF3C7]/70 dark:bg-amber-950/40',
      border: 'border-[#F59E0B]/60 dark:border-amber-500/50',
      pct: resPct,
      barColor: 'bg-[#F59E0B]',
    },
    {
      label: 'EV Charging',
      labelVi: 'TRẠM SẠC EV',
      value: evCharging,
      color: 'text-[#0F6B4F] dark:text-emerald-300',
      bg: 'bg-[#E8F5ED]/90 dark:bg-emerald-950/40',
      border: 'border-[#0F6B4F]/60 dark:border-emerald-500/50',
      pct: evPct,
      barColor: 'bg-[#0F6B4F] dark:bg-emerald-400',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3', className)}>
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            'rounded-xl px-4 py-3 flex flex-col justify-between border transition-all duration-150 shadow-2xs',
            c.bg,
            c.border
          )}
        >
          <div>
            <div
              className={cn(
                'text-2xl font-black font-mono tracking-tight leading-none',
                c.color
              )}
            >
              {c.value}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  c.color,
                  'opacity-85'
                )}
              >
                {c.label}
              </span>
              {c.pct !== null && (
                <span className={cn('text-[10px] font-mono font-bold', c.color, 'opacity-70')}>
                  {c.pct}%
                </span>
              )}
            </div>
          </div>

          {c.pct !== null ? (
            <div className="w-full h-1.5 rounded-full mt-2 bg-black/8 dark:bg-white/10 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', c.barColor)}
                style={{ width: `${c.pct}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-1.5 mt-2 opacity-0" />
          )}
        </div>
      ))}
    </div>
  );
}

export default ParkingStatistics;
