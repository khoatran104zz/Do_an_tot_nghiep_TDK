'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, { label: string; parent?: string }> = {
  '/dashboard': { label: 'Bảng điều khiển' },
  '/apartments': { label: 'Quản lý Căn hộ', parent: 'Căn hộ & Cư dân' },
  '/residents': { label: 'Hồ sơ Cư dân', parent: 'Căn hộ & Cư dân' },
  '/contracts': { label: 'Hợp đồng', parent: 'Căn hộ & Cư dân' },
  '/fees': { label: 'Danh mục Phí', parent: 'Tài chính' },
  '/invoices': { label: 'Quản lý Hóa đơn', parent: 'Tài chính' },
  '/feedbacks': { label: 'Phản ánh & Sự cố', parent: 'Vận hành' },
  '/notifications': { label: 'Thông báo', parent: 'Vận hành' },
  '/home': { label: 'Trang chủ Cư dân' },
  '/resident/invoices': { label: 'Hóa đơn & Thanh toán', parent: 'Cổng Cư Dân' },
  '/resident/feedback': { label: 'Báo sự cố & Đánh giá', parent: 'Cổng Cư Dân' },
  '/resident/notifications': { label: 'Thông báo Ban Quản Lý', parent: 'Cổng Cư Dân' },
};

export function Breadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const currentRoute = routeLabels[pathname] || { label: 'Tổng quan' };
  const isResident = pathname.startsWith('/home') || pathname.startsWith('/resident');
  const homeHref = isResident ? '/home' : '/dashboard';

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-xs text-slate-500', className)}>
      <Link
        href={homeHref}
        className="flex items-center gap-1 hover:text-slate-900 transition-colors p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
        title="Trang chủ"
      >
        <Home className="h-3.5 w-3.5 text-slate-400 hover:text-blue-600 transition-colors" />
        <span className="sr-only">Trang chủ</span>
      </Link>

      {currentRoute.parent && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-400 hidden sm:inline">{currentRoute.parent}</span>
        </>
      )}

      <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
      <span className="font-semibold text-slate-900 truncate max-w-48 sm:max-w-xs">
        {currentRoute.label}
      </span>
    </nav>
  );
}
