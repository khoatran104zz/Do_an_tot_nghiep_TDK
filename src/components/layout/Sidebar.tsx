'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Bell,
  Home,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  role?: 'ADMIN' | 'MANAGER' | 'RESIDENT';
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role = 'MANAGER', isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const managerNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý Căn hộ', href: '/apartments', icon: Building2 },
    { name: 'Quản lý Cư dân', href: '/residents', icon: Users },
    { name: 'Quản lý Hợp đồng', href: '/contracts', icon: FileText },
    { name: 'Danh mục Phí', href: '/fees', icon: CreditCard },
    { name: 'Quản lý Hóa đơn', href: '/invoices', icon: Receipt },
    { name: 'Phản ánh & Sự cố', href: '/feedbacks', icon: MessageSquareWarning },
    { name: 'Thông báo', href: '/notifications', icon: Bell },
  ];

  const residentNavItems = [
    { name: 'Trang chủ', href: '/home', icon: Home },
    { name: 'Hóa đơn của tôi', href: '/resident/invoices', icon: Receipt },
    { name: 'Gửi Phản ánh', href: '/resident/feedback', icon: MessageSquareWarning },
    { name: 'Thông báo', href: '/resident/notifications', icon: Bell },
  ];

  const navItems = role === 'RESIDENT' ? residentNavItems : managerNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
          <Link href={role === 'RESIDENT' ? '/home' : '/dashboard'} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-none block">SMART APARTMENT</span>
              <span className="text-[10px] font-medium text-blue-600 tracking-wider uppercase">
                {role === 'RESIDENT' ? 'Cư Dân Portal' : 'Ban Quản Lý'}
              </span>
            </div>
          </Link>
          {onClose && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Danh mục chức năng
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-slate-400')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Role Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {role === 'RESIDENT' ? 'CD' : 'BQL'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">Hệ thống v1.0</p>
              <p className="text-[11px] text-slate-500 truncate">
                {role === 'ADMIN' ? 'Quản trị viên' : role === 'MANAGER' ? 'Ban Quản Lý' : 'Cư Dân'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
