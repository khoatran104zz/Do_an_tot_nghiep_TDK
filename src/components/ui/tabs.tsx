'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export function Tabs({ items, activeId, onChange, variant = 'pills', className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center',
        variant === 'pills' && 'gap-1 rounded-xl bg-slate-100 p-1',
        variant === 'underline' && 'gap-6 border-b border-slate-200',
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 cursor-pointer -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B4F]/25 rounded-t-lg active:scale-[0.98] min-h-[44px]',
                isActive
                  ? 'text-[#0F6B4F] dark:text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                tab.disabled && 'cursor-not-allowed opacity-50 active:scale-100'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-200',
                    isActive ? 'bg-[#E8F5ED] text-[#0F6B4F] dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F6B4F] dark:bg-emerald-500 rounded-full animate-in fade-in-50 duration-200" />
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-200 ease-out cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B4F]/25 active:scale-[0.98] min-h-[38px]',
              isActive
                ? 'bg-white dark:bg-slate-900 text-[#0F6B4F] dark:text-emerald-400 shadow-2xs font-bold scale-[1.01]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200',
              tab.disabled && 'cursor-not-allowed opacity-50 active:scale-100'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold transition-colors duration-200',
                  isActive ? 'bg-[#E8F5ED] text-[#0F6B4F] dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
