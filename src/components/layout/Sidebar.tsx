'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Car,
  KeyRound,
  Wrench,
  Boxes,
  Sparkles,
  UserCheck,
  Package,
  Megaphone,
  Vote,
  ShieldCheck,
  BarChart3,
  Zap,
  Settings,
  ClipboardList,
  QrCode,
  History,
  FileClock,
  Bell,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
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
  badge?: string | number;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function Sidebar({ role = 'MANAGER' }: { role?: string }) {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isMobileOpen, setIsMobileOpen, setIsCommandOpen } = useShell();

  // =========================================================================
  // 1. BAN QUẢN LÝ (Admin & Manager) Navigation
  // =========================================================================
  const managementGroups: NavGroup[] = [
    {
      groupName: 'Tổng quan',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Smart Operations', href: '/smart-operations', icon: Zap },
      ],
    },
    {
      groupName: 'Bất động sản & Cư dân',
      items: [
        { name: 'Property', href: '/apartments', icon: Building2 },
        { name: 'Residents', href: '/residents', icon: Users },
        { name: 'Contracts', href: '/contracts', icon: FileText },
      ],
    },
    {
      groupName: 'Tài chính & Thanh toán',
      items: [
        { name: 'Billing', href: '/invoices', icon: Receipt },
        { name: 'Payments', href: '/payments', icon: CreditCard },
      ],
    },
    {
      groupName: 'Phương tiện & An ninh',
      items: [
        { name: 'Vehicles', href: '/vehicles', icon: Car },
        { name: 'Parking', href: '/parking-cards', icon: KeyRound },
        { name: 'Visitors', href: '/visitors', icon: UserCheck },
      ],
    },
    {
      groupName: 'Vận hành & Tiện ích',
      items: [
        { name: 'Maintenance', href: '/feedbacks', icon: Wrench },
        { name: 'Assets', href: '/assets', icon: Boxes },
        { name: 'Facilities', href: '/facilities', icon: Sparkles },
        { name: 'Parcels', href: '/parcels', icon: Package },
      ],
    },
    {
      groupName: 'Cộng đồng & Quản trị',
      items: [
        { name: 'Announcements', href: '/notifications', icon: Megaphone },
        { name: 'Polls', href: '/polls', icon: Vote },
        { name: 'Staff', href: '/staff', icon: ShieldCheck },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  // =========================================================================
  // 2. NHÂN VIÊN VẬN HÀNH (Staff) Navigation by specific role
  // =========================================================================
  const technicianGroups: NavGroup[] = [
    {
      groupName: 'Kỹ thuật viên',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Tasks', href: '/tasks', icon: ClipboardList },
        { name: 'Maintenance', href: '/feedbacks', icon: Wrench },
        { name: 'Assets', href: '/assets', icon: Boxes },
        { name: 'Maintenance Schedule', href: '/maintenance-schedule', icon: FileClock },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ],
    },
  ];

  const securityGroups: NavGroup[] = [
    {
      groupName: 'An ninh & Cổng vào',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Visitor Check-in', href: '/visitors/check-in', icon: QrCode },
        { name: 'Visitor History', href: '/visitors/history', icon: History },
        { name: 'Parking', href: '/parking-cards', icon: KeyRound },
        { name: 'Parking Access Logs', href: '/parking-logs', icon: FileClock },
        { name: 'Vehicles', href: '/vehicles', icon: Car },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ],
    },
  ];

  const receptionistGroups: NavGroup[] = [
    {
      groupName: 'Lễ tân & Sảnh',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Parcels', href: '/parcels', icon: Package },
        { name: 'Residents', href: '/residents', icon: Users },
        { name: 'Visitor Overview', href: '/visitors', icon: UserCheck },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ],
    },
  ];

  // =========================================================================
  // 3. CƯ DÂN (Resident) Navigation
  // =========================================================================
  const residentGroups: NavGroup[] = [
    {
      groupName: 'Căn hộ của tôi',
      items: [
        { name: 'Home', href: '/home', icon: Home },
        { name: 'My Apartment', href: '/resident/apartment', icon: Building2 },
        { name: 'My Family', href: '/resident/family', icon: Users },
      ],
    },
    {
      groupName: 'Dịch vụ Cư dân',
      items: [
        { name: 'Bills & Payments', href: '/resident/invoices', icon: Receipt },
        { name: 'Vehicles', href: '/resident/vehicles', icon: Car },
        { name: 'Maintenance Requests', href: '/resident/feedback', icon: Wrench },
        { name: 'Facilities', href: '/resident/facilities', icon: Sparkles },
        { name: 'Visitors', href: '/resident/visitors', icon: UserCheck },
        { name: 'Parcels', href: '/resident/parcels', icon: Package },
      ],
    },
    {
      groupName: 'Cộng đồng',
      items: [
        { name: 'Announcements', href: '/resident/announcements', icon: Megaphone },
        { name: 'Polls', href: '/resident/polls', icon: Vote },
        { name: 'Notifications', href: '/resident/notifications', icon: Bell },
      ],
    },
  ];

  // Resolve active nav groups by role
  let navGroups = residentGroups;
  if (role === 'ADMIN' || role === 'MANAGER') navGroups = managementGroups;
  else if (role === 'STAFF_TECHNICIAN') navGroups = technicianGroups;
  else if (role === 'STAFF_SECURITY') navGroups = securityGroups;
  else if (role === 'STAFF_RECEPTIONIST') navGroups = receptionistGroups;

  const homeHref = role === 'RESIDENT' ? '/home' : '/dashboard';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden transition-opacity duration-200"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out md:static shadow-xs',
          isCollapsed ? 'md:w-[72px]' : 'md:w-64',
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <Link href={homeHref} className="flex items-center gap-3 overflow-hidden group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  Smart Building
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase">
                  {role === 'ADMIN'
                    ? 'Super Admin'
                    : role === 'MANAGER'
                    ? 'Management'
                    : role === 'STAFF_TECHNICIAN'
                    ? 'Technician'
                    : role === 'STAFF_SECURITY'
                    ? 'Security'
                    : role === 'STAFF_RECEPTIONIST'
                    ? 'Receptionist'
                    : 'Resident Portal'}
                </span>
              </div>
            )}
          </Link>

          {/* Close on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Command Bar */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>Tìm kiếm nhanh...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  {group.groupName}
                </div>
              )}

              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname.startsWith(item.href + '/') &&
                      item.href !== '/dashboard' &&
                      item.href !== '/home');
                  const Icon = item.icon;

                  const navLink = (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 relative group cursor-pointer',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
                        isCollapsed && 'justify-center px-2 py-2.5'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}

                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full" />
                      )}

                      {!isCollapsed && item.badge && (
                        <span className="ml-auto bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href} content={item.name} side="right">
                        {navLink}
                      </Tooltip>
                    );
                  }

                  return navLink;
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Desktop Collapse Toggle Footer */}
        <div className="hidden md:flex p-3 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn(
              'w-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer',
              isCollapsed ? 'justify-center px-0' : 'justify-start'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Thu gọn menu</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
