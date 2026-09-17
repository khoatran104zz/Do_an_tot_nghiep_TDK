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
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  // 1. QUẢN TRỊ VIÊN CẤP CAO TOÀN HỆ THỐNG (SUPER ADMIN) Navigation
  // =========================================================================
  const adminGroups: NavGroup[] = [
    {
      groupName: 'Quản trị Tối cao',
      items: [
        { name: 'Bảng điều khiển hệ thống', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Phân quyền & Managers', href: '/settings/access-control', icon: KeyRound, badge: 'Admin' },
        { name: 'Cấu hình Biểu phí Chuẩn', href: '/fees', icon: Receipt, badge: 'Toàn cục' },
        { name: 'Giám sát Vận hành IoT', href: '/smart-operations', icon: Zap },
      ],
    },
    {
      groupName: 'Bất động sản & Cư dân',
      items: [
        { name: 'Căn hộ & Khối nhà', href: '/apartments', icon: Building2 },
        { name: 'Hồ sơ Cư dân', href: '/residents', icon: Users },
        { name: 'Hợp đồng Thuê & Mua', href: '/contracts', icon: FileText },
      ],
    },
    {
      groupName: 'Tài chính & Thu phí',
      items: [
        { name: 'Hóa đơn toàn hệ thống', href: '/invoices', icon: Receipt },
        { name: 'Giao dịch thanh toán', href: '/payments', icon: CreditCard },
      ],
    },
    {
      groupName: 'Kỹ thuật, Bảo trì & Tiện ích',
      items: [
        { name: 'Bảo trì & Sự cố', href: '/feedbacks', icon: Wrench },
        { name: 'Lịch bảo trì định kỳ', href: '/maintenance-schedules', icon: FileClock },
        { name: 'Tài sản tòa nhà', href: '/assets', icon: Boxes },
        { name: 'Tiện ích chung cư', href: '/facilities', icon: Sparkles },
        { name: 'Quản lý Bưu kiện', href: '/parcels', icon: Package },
      ],
    },
    {
      groupName: 'Phương tiện & An ninh',
      items: [
        { name: 'Phương tiện đăng ký', href: '/vehicles', icon: Car },
        { name: 'Thẻ gửi xe', href: '/parking-cards', icon: KeyRound },
        { name: 'Lịch sử ra vào xe', href: '/parking-logs', icon: History },
        { name: 'Kiểm soát Khách thăm', href: '/visitors', icon: UserCheck },
      ],
    },
    {
      groupName: 'Nhân sự, Truyền thông & Hệ thống',
      items: [
        { name: 'Nhân sự vận hành', href: '/staff', icon: ShieldCheck },
        { name: 'Bản tin thông báo', href: '/announcements', icon: Megaphone },
        { name: 'Khảo sát ý kiến', href: '/polls', icon: Vote },
        { name: 'Báo cáo toàn hệ thống', href: '/reports', icon: BarChart3 },
        { name: 'Thông báo hệ thống', href: '/notifications', icon: Bell },
        { name: 'Cài đặt hệ thống', href: '/settings', icon: Settings },
      ],
    },
  ];

  // =========================================================================
  // 1.1 BAN QUẢN LÝ TÒA NHÀ (MANAGER - CẤP VẬN HÀNH) Navigation
  // =========================================================================
  const managerGroups: NavGroup[] = [
    {
      groupName: 'Vận hành Tòa nhà',
      items: [
        { name: 'Bàn làm việc vận hành', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Vận hành thông minh', href: '/smart-operations', icon: Zap },
      ],
    },
    {
      groupName: 'Bất động sản & Cư dân',
      items: [
        { name: 'Căn hộ thuộc tòa', href: '/apartments', icon: Building2 },
        { name: 'Cư dân thuộc tòa', href: '/residents', icon: Users },
        { name: 'Hợp đồng thuê', href: '/contracts', icon: FileText },
      ],
    },
    {
      groupName: 'Tài chính & Thu phí',
      items: [
        { name: 'Hóa đơn tòa nhà', href: '/invoices', icon: Receipt },
        { name: 'Thanh toán', href: '/payments', icon: CreditCard },
      ],
    },
    {
      groupName: 'Phương tiện & An ninh',
      items: [
        { name: 'Phương tiện đăng ký', href: '/vehicles', icon: Car },
        { name: 'Thẻ gửi xe', href: '/parking-cards', icon: KeyRound },
        { name: 'Khách ra vào', href: '/visitors', icon: UserCheck },
      ],
    },
    {
      groupName: 'Bảo trì & Tiện ích',
      items: [
        { name: 'Bảo trì & Sự cố', href: '/feedbacks', icon: Wrench },
        { name: 'Lịch bảo dưỡng', href: '/maintenance-schedules', icon: FileClock },
        { name: 'Tài sản tòa nhà', href: '/assets', icon: Boxes },
        { name: 'Tiện ích', href: '/facilities', icon: Sparkles },
        { name: 'Bưu kiện', href: '/parcels', icon: Package },
      ],
    },
    {
      groupName: 'Cộng đồng & Đội ngũ',
      items: [
        { name: 'Bản tin tòa nhà', href: '/announcements', icon: Megaphone },
        { name: 'Khảo sát ý kiến', href: '/polls', icon: Vote },
        { name: 'Thông báo', href: '/notifications', icon: Bell },
        { name: 'Nhân viên trực tòa', href: '/staff', icon: ShieldCheck },
        { name: 'Báo cáo vận hành', href: '/reports', icon: BarChart3 },
      ],
    },
  ];

  // =========================================================================
  // 2. NHÂN VIÊN VẬN HÀNH Navigation
  // =========================================================================
  const technicianGroups: NavGroup[] = [
    {
      groupName: 'Kỹ thuật viên',
      items: [
        { name: 'Bảng điều khiển', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Nhiệm vụ của tôi', href: '/tasks', icon: ClipboardList },
        { name: 'Bảo trì & Sự cố', href: '/feedbacks', icon: Wrench },
        { name: 'Tài sản', href: '/assets', icon: Boxes },
        { name: 'Lịch bảo trì', href: '/maintenance-schedule', icon: FileClock },
        { name: 'Thông báo', href: '/notifications', icon: Bell },
      ],
    },
  ];

  const securityGroups: NavGroup[] = [
    {
      groupName: 'An ninh & Cổng vào',
      items: [
        { name: 'Bảng điều khiển', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Đón tiếp khách', href: '/visitors/check-in', icon: QrCode },
        { name: 'Lịch sử khách', href: '/visitors/history', icon: History },
        { name: 'Thẻ gửi xe', href: '/parking-cards', icon: KeyRound },
        { name: 'Lịch sử ra vào xe', href: '/parking-logs', icon: FileClock },
        { name: 'Phương tiện', href: '/vehicles', icon: Car },
        { name: 'Thông báo', href: '/notifications', icon: Bell },
      ],
    },
  ];

  const receptionistGroups: NavGroup[] = [
    {
      groupName: 'Lễ tân & Sảnh',
      items: [
        { name: 'Bảng điều khiển', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Bưu kiện', href: '/parcels', icon: Package },
        { name: 'Cư dân', href: '/residents', icon: Users },
        { name: 'Khách ra vào', href: '/visitors', icon: UserCheck },
        { name: 'Thông báo', href: '/notifications', icon: Bell },
      ],
    },
  ];

  // =========================================================================
  // 3. CƯ DÂN Navigation
  // =========================================================================
  const residentGroups: NavGroup[] = [
    {
      groupName: 'Căn hộ của tôi',
      items: [
        { name: 'Trang chủ', href: '/home', icon: Home },
        { name: 'Căn hộ của tôi', href: '/resident/apartment', icon: Building2 },
        { name: 'Thành viên gia đình', href: '/resident/family', icon: Users },
      ],
    },
    {
      groupName: 'Dịch vụ cư dân',
      items: [
        { name: 'Hóa đơn & Thanh toán', href: '/resident/invoices', icon: Receipt },
        { name: 'Phương tiện', href: '/resident/vehicles', icon: Car },
        { name: 'Yêu cầu bảo trì', href: '/resident/feedback', icon: Wrench },
        { name: 'Đặt tiện ích', href: '/resident/facilities', icon: Sparkles },
        { name: 'Đăng ký khách', href: '/resident/visitors', icon: UserCheck },
        { name: 'Bưu kiện', href: '/resident/parcels', icon: Package },
      ],
    },
    {
      groupName: 'Cộng đồng',
      items: [
        { name: 'Bản tin cư dân', href: '/resident/announcements', icon: Megaphone },
        { name: 'Khảo sát ý kiến', href: '/resident/polls', icon: Vote },
        { name: 'Thông báo', href: '/resident/notifications', icon: Bell },
      ],
    },
  ];

  // Resolve active nav groups by role
  let navGroups = residentGroups;
  if (role === 'ADMIN') navGroups = adminGroups;
  else if (role === 'MANAGER') navGroups = managerGroups;
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
          'relative fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ease-in-out md:relative shadow-xs',
          isCollapsed ? 'md:w-[72px]' : 'md:w-64',
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:relative'
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
                  Tòa Nhà Thông Minh
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  {role === 'ADMIN' ? (
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold flex items-center gap-1">
                      <Crown className="h-3 w-3 text-amber-500 inline" /> Super Admin
                    </span>
                  ) : role === 'MANAGER' ? (
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      🏢 Ban Quản Lý Tòa Nhà
                    </span>
                  ) : role === 'STAFF_TECHNICIAN' ? (
                    'Kỹ thuật viên'
                  ) : role === 'STAFF_SECURITY' ? (
                    'An ninh bảo vệ'
                  ) : role === 'STAFF_RECEPTIONIST' ? (
                    'Lễ tân'
                  ) : (
                    'Cổng thông tin cư dân'
                  )}
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

        {/* Collapse Toggle Button - Centered Vertically in the Middle of Sidebar */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 h-7 w-7 items-center justify-center rounded-full border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 shadow-md transition-all cursor-pointer hover:scale-110"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          aria-label="Thu gọn menu"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>
    </>
  );
}
