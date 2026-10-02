'use client';

import React from 'react';
import {
  Car,
  Bike,
  Zap,
  Accessibility,
  Lock,
  Wrench,
  Info,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ParkingSlotVisualStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'selected'
  | 'maintenance'
  | 'ev'
  | 'accessible'
  | 'unavailable';

export interface ParkingSlotProps {
  id: string;
  code: string;
  status: ParkingSlotVisualStatus;
  vehicleType?: 'car' | 'motorcycle' | 'ev' | 'accessible';
  isSelected?: boolean;
  isLocked?: boolean;
  hasInfo?: boolean;
  statusLabel?: string;
  onClick?: () => void;
  className?: string;
  size?: 'normal' | 'compact' | 'mini';
}

/**
 * Reusable ParkingSlot Component
 * Strictly adheres to the K-Home Design System & Figma visual specifications:
 * - Available: #22C55E border & text, #E8F5ED soft background (Dark: emerald-950/50, border-emerald-500/80)
 * - Occupied: #EF4444 border & text, very light red background (Dark: rose-950/50, border-rose-500/80)
 * - Reserved: #F59E0B border & text, very light amber background (Dark: amber-950/50, border-amber-500/80)
 * - Selected: Forest Green #0F6B4F strong border, ring, elevation, clear visual feedback
 * - EV: Lightning icon
 * - Accessible: Accessibility wheelchair icon
 * - Unavailable: Muted gray background, border, and text
 */
export function ParkingSlot({
  id,
  code,
  status,
  vehicleType = 'car',
  isSelected = false,
  isLocked = false,
  hasInfo = false,
  statusLabel,
  onClick,
  className,
  size = 'normal',
}: ParkingSlotProps) {
  // Determine displayed text badge (AVAI, OCCU, RESE, ACCESS, N/A, etc.)
  const displayText =
    statusLabel ||
    (status === 'available'
      ? 'AVAI'
      : status === 'occupied'
      ? 'OCCU'
      : status === 'reserved'
      ? 'RESE'
      : status === 'accessible'
      ? 'ACCESS'
      : status === 'maintenance'
      ? 'MAIN'
      : status === 'unavailable'
      ? 'N/A'
      : 'SLOT');

  // Choose icon based on type / status
  const renderIcon = () => {
    if (status === 'accessible' || vehicleType === 'accessible') {
      return <Accessibility className="w-5 h-5 transition-transform group-hover:scale-110" />;
    }
    if (status === 'ev' || vehicleType === 'ev') {
      return <Zap className="w-4 h-4 transition-transform group-hover:scale-110" />;
    }
    if (vehicleType === 'motorcycle') {
      return <Bike className="w-4 h-4 transition-transform group-hover:scale-110" />;
    }
    if (status === 'maintenance') {
      return <Wrench className="w-4 h-4 transition-transform group-hover:scale-110" />;
    }
    return <Car className="w-5 h-5 transition-transform group-hover:scale-110" />;
  };

  // Base styling for each semantic state
  const statusStyles: Record<ParkingSlotVisualStatus, string> = {
    available: cn(
      'bg-[#E8F5ED] border-[#22C55E] text-[#15803D]',
      'dark:bg-emerald-950/40 dark:border-emerald-500/80 dark:text-emerald-300',
      'hover:bg-[#d8eedf] dark:hover:bg-emerald-950/70 hover:shadow-xs'
    ),
    occupied: cn(
      'bg-[#FEE2E2]/60 border-[#EF4444] text-[#B91C1C]',
      'dark:bg-rose-950/40 dark:border-rose-500/80 dark:text-rose-300',
      'hover:bg-[#fed1d1] dark:hover:bg-rose-950/70 hover:shadow-xs'
    ),
    reserved: cn(
      'bg-[#FEF3C7]/60 border-[#F59E0B] text-[#B45309]',
      'dark:bg-amber-950/40 dark:border-amber-500/80 dark:text-amber-300',
      'hover:bg-[#fde68a] dark:hover:bg-amber-950/70 hover:shadow-xs'
    ),
    selected: cn(
      'bg-[#E8F5ED] border-[#0F6B4F] text-[#0F6B4F] ring-2 ring-[#0F6B4F]/40 shadow-sm',
      'dark:bg-emerald-950/70 dark:border-emerald-400 dark:text-emerald-200 dark:ring-emerald-400/50'
    ),
    accessible: cn(
      'bg-[#E8F5ED] border-[#22C55E] text-[#0F6B4F]',
      'dark:bg-emerald-950/50 dark:border-emerald-500 dark:text-emerald-300',
      'hover:bg-[#d8eedf] dark:hover:bg-emerald-950/80 hover:shadow-xs'
    ),
    ev: cn(
      'bg-[#E8F5ED] border-[#22C55E] text-[#0F6B4F]',
      'dark:bg-emerald-950/50 dark:border-emerald-500 dark:text-emerald-300',
      'hover:bg-[#d8eedf] dark:hover:bg-emerald-950/80 hover:shadow-xs'
    ),
    maintenance: cn(
      'bg-slate-100 border-amber-500/70 text-amber-700',
      'dark:bg-slate-800/70 dark:border-amber-500/60 dark:text-amber-400'
    ),
    unavailable: cn(
      'bg-slate-100/80 border-slate-300 text-slate-400 opacity-80',
      'dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-500'
    ),
  };

  return (
    <button
      type="button"
      id={`slot-${id}`}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-between',
        'rounded-xl border transition-all duration-150 cursor-pointer select-none text-center',
        // Dimensions matching Figma ratio: rectangular parking bay
        size === 'normal' && 'h-[74px] min-w-[100px] w-full px-2 py-1.5',
        size === 'compact' && 'h-[64px] min-w-[80px] w-full px-1.5 py-1',
        size === 'mini' && 'h-[50px] min-w-[60px] px-1 py-1 text-[10px]',
        statusStyles[status],
        isSelected &&
          'border-2 border-[#0F6B4F] dark:border-emerald-400 ring-2 ring-[#0F6B4F]/30 dark:ring-emerald-400/40 scale-[1.02] z-10 shadow-md',
        className
      )}
      aria-label={`Parking slot ${code}, status ${status}`}
    >
      {/* Top row: Code + Corner Badges (Lock or Info) */}
      <div className="w-full flex items-center justify-between text-left leading-none">
        <span
          className={cn(
            'font-bold tracking-tight',
            size === 'normal' ? 'text-xs' : 'text-[11px]'
          )}
        >
          {code}
        </span>

        {/* Lock indicator for reserved */}
        {isLocked && (
          <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <Lock className="w-2.5 h-2.5" />
          </span>
        )}

        {/* Info indicator for special access */}
        {hasInfo && (
          <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <Info className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {/* Center Icon */}
      <div className="my-0.5 flex items-center justify-center opacity-90 group-hover:opacity-100">
        {renderIcon()}
      </div>

      {/* Bottom status abbreviation */}
      <span
        className={cn(
          'text-[9px] font-bold tracking-wider uppercase leading-none opacity-85',
          size === 'mini' && 'text-[8px]'
        )}
      >
        {displayText}
      </span>
    </button>
  );
}

export default ParkingSlot;
