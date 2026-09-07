'use client';

import React from 'react';
import { RotateCcw, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

export interface ActiveFilterTag {
  key: string;
  label: string;
  valueLabel: string;
  onRemove: () => void;
}

interface FilterBarProps {
  children?: React.ReactNode;
  activeTags?: ActiveFilterTag[];
  hasActiveFilters?: boolean;
  onReset?: () => void;
  totalCount?: number;
  totalCountLabel?: string;
  extraActions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  children,
  activeTags = [],
  hasActiveFilters = false,
  onReset,
  totalCount,
  totalCountLabel = 'kết quả',
  extraActions,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs', className)}>
      {/* Controls row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {children}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalCount !== undefined && (
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              {totalCount} {totalCountLabel}
            </div>
          )}

          {hasActiveFilters && onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 gap-1.5 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </Button>
          )}

          {extraActions}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Đang lọc theo:
          </span>
          {activeTags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800"
            >
              <span className="text-slate-500 dark:text-slate-400">{tag.label}:</span>
              <span className="font-semibold">{tag.valueLabel}</span>
              <button
                type="button"
                onClick={tag.onRemove}
                className="hover:text-blue-900 dark:hover:text-blue-100 cursor-pointer ml-0.5"
                aria-label={`Xóa bộ lọc ${tag.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
