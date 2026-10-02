'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FloorItem {
  code: string;
  label?: string;
  badge?: string;
}

export interface ParkingFloorSelectorProps {
  floors?: (string | FloorItem)[];
  activeFloor: string;
  onSelectFloor: (floorCode: string) => void;
  className?: string;
}

/**
 * ParkingFloorSelector Component
 * Pill button group for switching basement floors and areas (B1, B2, B3, OUTDOOR)
 * Matching Figma design: #0F6B4F active background with subtle shadow
 */
export function ParkingFloorSelector({
  floors = ['B1', 'B2', 'B3', 'OUTDOOR'],
  activeFloor = 'B1',
  onSelectFloor,
  className,
}: ParkingFloorSelectorProps) {
  const normalizedFloors: FloorItem[] = floors.map((f) => {
    if (typeof f === 'string') {
      return {
        code: f,
        label: f === 'OUTDOOR' ? 'Ngoài trời' : f,
      };
    }
    return {
      code: f.code,
      label: f.label || f.code,
      badge: f.badge,
    };
  });

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs gap-1',
        className
      )}
      role="tablist"
      aria-label="Parking Area Selector"
    >
      {normalizedFloors.map((item) => {
        const isActive =
          activeFloor.toUpperCase() === item.code.toUpperCase() ||
          activeFloor.toUpperCase() === item.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        return (
          <button
            key={item.code}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectFloor(item.code)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold font-mono tracking-wider transition-all duration-150 cursor-pointer select-none flex items-center gap-1.5',
              isActive
                ? 'bg-[#0F6B4F] text-white shadow-sm shadow-[#0F6B4F]/30 scale-100'
                : 'text-slate-600 dark:text-slate-400 hover:text-[#0F6B4F] dark:hover:text-emerald-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            )}
          >
            <span>{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ParkingFloorSelector;
