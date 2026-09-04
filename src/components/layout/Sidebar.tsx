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
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useShell } from './ShellContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function Sidebar({ role = 'MANAGER' }: { role?: string }) {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isMobileOpen, setIsMobileOpen } = useShell();

  // Management Navigation Groups
  const managerGroups: NavGroup[] = [
    {
      groupName: 'Tổng quan',
      items: [
        { name: 'Bảng điều khiển', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      groupName: 'Căn hộ & Cư dân',
      items: [
        { name: 'Quản lý Căn hộ', href: '/apartments', icon: Building2 },
        { name: 'Hồ sơ Cư dân', href: '/residents', icon: Users },
        { name: 'Quản lý Hợp đồng', href: '/contracts', icon: FileText },
      ],
    },
    {
      groupName: 'Tài chính & Dịch vụ',
      items: [
        { name: 'Quản lý Hóa đơn', href: '/invoices', icon: Receipt },
        { name: 'Danh mục Phí', href: '/fees', icon: CreditCard },
      ],
    },
    {
      groupName: 'Vận hành & Hỗ trợ',
      items: [
        { name: 'Phản ánh & Sự cố', href: '/feedbacks', icon: MessageSquareWarning },
        { name: 'Thông báo', href: '/notifications', icon: Bell },
      ],
    },
  ];

  // Resident Navigation Groups
  const residentGroups: NavGroup[] = [
    {
      groupName: 'Tổng quan',
      items: [
        { name: 'Trang chủ Cư dân', href: '/home', icon: Home },
      ],
    },
    {
      groupName: 'Tài chính Căn hộ',
      items: [
        { name: 'Hóa đơn của tôi', href: '/resident/invoices', icon: Receipt },
      ],
    },
    {
      groupName: 'Dịch vụ & Hỗ trợ',
      items: [
        { name: 'Báo sự cố & Đánh giá', href: '/resident/feedback', icon: MessageSquareWarning },
        { name: 'Thông báo Ban Quản Lý', href: '/resident/notifications', icon: Bell },
      ],
    },
  ];

  const navGroups = role === 'RESIDENT' ? residentGroups : managerGroups;
  const homeHref = role === 'RESIDENT' ? '/home' : '/dashboard';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden transition-opacity duration-200"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside element */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-200 ease-in-out md:static shadow-xs',
          // Desktop collapse widths
          isCollapsed ? 'md:w-[72px]' : 'md:w-64',
          // Mobile slide-over drawer
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Sidebar Header: Logo & Branding */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80">
          <Link href={homeHref} className="flex items-center gap-3 overflow-hidden group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="transition-opacity duration-150 overflow-hidden whitespace-nowrap">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight block">SMART APARTMENT</span>
                <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase block">
                  {role === 'RESIDENT' ? 'Cư Dân Portal' : 'Ban Quản Lý'}
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden text-slate-500 rounded-lg min-h-[44px] min-w-[44px]"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng thanh điều hướng"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Desktop collapse toggle button */}
          {!isMobileOpen && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
              aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Grouped Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {/* Group Title or divider */}
              {(!isCollapsed || isMobileOpen) ? (
                <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 select-none">
                  {group.groupName}
                </p>
              ) : (
                <div className="h-px bg-slate-100 mx-2 my-2" />
              )}

              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl min-h-[44px] sm:min-h-[40px] px-3 py-2 text-sm font-medium transition-all duration-150 ease-out relative select-none active:scale-[0.98]',
                        isCollapsed && !isMobileOpen ? 'justify-center px-0' : '',
                        isActive
                          ? 'bg-blue-50/90 text-blue-700 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 animate-in fade-in-50 duration-200" />
                      )}
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-all duration-150 group-hover:scale-105',
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  );

                  // Show Tooltip when sidebar is collapsed on desktop
                  if (isCollapsed && !isMobileOpen) {
                    return (
                      <Tooltip key={item.href} content={item.name} position="right" delay={100}>
                        {linkContent}
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Role Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {role === 'RESIDENT' ? 'CD' : 'BQL'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-900 truncate">Hệ thống v1.0</p>
                  <p className="text-[11px] text-slate-500 truncate">High-Tech Building</p>
                </div>
              </div>
              <Badge variant={role === 'RESIDENT' ? 'success' : 'default'} size="sm">
                {role === 'ADMIN' ? 'Admin' : role === 'MANAGER' ? 'BQL' : 'Cư Dân'}
              </Badge>
            </div>
          ) : (
            <div className="flex justify-center">
              <Tooltip content={role === 'RESIDENT' ? 'Cư Dân' : 'Ban Quản Lý'} position="right">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs cursor-default">
                  {role === 'RESIDENT' ? 'CD' : 'BQL'}
                </div>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
