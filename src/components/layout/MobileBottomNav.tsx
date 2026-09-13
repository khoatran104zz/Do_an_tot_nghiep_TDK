'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  MessageSquareWarning,
  Menu,
  Home,
  Bell,
} from 'lucide-react';
import { useShell } from './ShellContext';
import { cn } from '@/lib/utils';

export function MobileBottomNav({ role = 'MANAGER' }: { role?: string }) {
  const pathname = usePathname();
  const { toggleMobile } = useShell();

  const managerItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Căn hộ', href: '/apartments', icon: Building2 },
    { name: 'Hóa đơn', href: '/invoices', icon: Receipt },
    { name: 'Sự cố', href: '/feedbacks', icon: MessageSquareWarning },
  ];

  const technicianItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sự cố', href: '/feedbacks', icon: MessageSquareWarning },
    { name: 'Căn hộ', href: '/apartments', icon: Building2 },
    { name: 'Thông báo', href: '/notifications', icon: Bell },
  ];

  const securityItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Xe cộ', href: '/vehicles', icon: Building2 },
    { name: 'Thẻ xe', href: '/parking-cards', icon: Receipt },
    { name: 'Thông báo', href: '/notifications', icon: Bell },
  ];

  const receptionistItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Cư dân', href: '/residents', icon: Building2 },
    { name: 'Căn hộ', href: '/apartments', icon: Building2 },
    { name: 'Thông báo', href: '/notifications', icon: Bell },
  ];

  const residentItems = [
    { name: 'Trang chủ', href: '/home', icon: Home },
    { name: 'Hóa đơn', href: '/resident/invoices', icon: Receipt },
    { name: 'Báo sự cố', href: '/resident/feedback', icon: MessageSquareWarning },
    { name: 'Thông báo', href: '/resident/notifications', icon: Bell },
  ];

  let items = managerItems;
  if (role === 'RESIDENT') items = residentItems;
  else if (role === 'STAFF_TECHNICIAN') items = technicianItems;
  else if (role === 'STAFF_SECURITY') items = securityItems;
  else if (role === 'STAFF_RECEPTIONIST') items = receptionistItems;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-md px-2 py-1 shadow-lg shadow-slate-900/10"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl transition-all select-none',
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-0.5">{item.name}</span>
            </Link>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <button
          type="button"
          onClick={toggleMobile}
          className="flex flex-col items-center justify-center min-h-[48px] min-w-[56px] py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all select-none cursor-pointer"
          aria-label="Mở tất cả menu"
        >
          <div className="p-1 rounded-lg text-slate-500">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-0.5">Tất cả</span>
        </button>
      </div>
    </nav>
  );
}
