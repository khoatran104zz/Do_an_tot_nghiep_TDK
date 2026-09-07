'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  debounceMs?: number;
  className?: string;
  showShortcut?: boolean;
}

export function SearchInput({
  placeholder = 'Tìm kiếm nhanh...',
  value: controlledValue,
  onChange,
  debounceMs = 300,
  className,
  showShortcut = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');

  // Synchronize internal state with external controlled value
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounced change trigger
  useEffect(() => {
    if (!onChange) return;
    const timer = setTimeout(() => {
      if (internalValue !== controlledValue) {
        onChange(internalValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange]);

  const handleClear = () => {
    setInternalValue('');
    if (onChange) onChange('');
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-2xs"
      />
      {internalValue ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
          aria-label="Xóa tìm kiếm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : showShortcut ? (
        <kbd className="absolute right-2.5 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
          /
        </kbd>
      ) : null}
    </div>
  );
}
