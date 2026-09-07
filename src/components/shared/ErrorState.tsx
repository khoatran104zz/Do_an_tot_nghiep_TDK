'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có lỗi xảy ra trong quá trình xử lý yêu cầu. Vui lòng kiểm tra lại kết nối và thử lại.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/40 animate-in fade-in-50 duration-200',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-3 shadow-2xs">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-normal">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-1.5 text-xs font-semibold hover:bg-white dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Thử lại ngay
        </Button>
      )}
    </div>
  );
}
