'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side exception to console for diagnosis
    console.error('Unhandled Global Exception caught by Error Boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/50">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          Đã xảy ra sự cố không mong muốn
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Hệ thống ghi nhận sự cố khi hiển thị trang này. Bạn có thể bấm thử lại hoặc quay về trang chủ.
        </p>

        {error.digest && (
          <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Mã tham chiếu: <span className="font-semibold text-slate-700 dark:text-slate-200">{error.digest}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5"
          >
            <RefreshCw className="h-4 w-4" />
            Thử tải lại
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-10 px-5"
            >
              <Home className="h-4 w-4" />
              Về Bảng điều khiển
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
