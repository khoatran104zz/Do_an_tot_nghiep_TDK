import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
          <Compass className="h-8 w-8 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-3">
          404 ERROR
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          Không tìm thấy trang yêu cầu
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được di chuyển sang địa chỉ khác trong hệ thống.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5">
              <Home className="h-4 w-4" />
              Bảng điều khiển
            </Button>
          </Link>

          <Link href="/home" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-10 px-5"
            >
              <ArrowLeft className="h-4 w-4" />
              Trang chủ Cư dân
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
