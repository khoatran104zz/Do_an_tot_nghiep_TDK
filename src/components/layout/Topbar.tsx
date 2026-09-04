'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Search, LogOut, ChevronDown, Home, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownDivider,
  DropdownHeader,
} from '@/components/ui/dropdown';
import { Breadcrumb } from './Breadcrumb';
import { NotificationDropdown } from './NotificationDropdown';
import { useShell } from './ShellContext';
import Link from 'next/link';

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const { toggleMobile, setIsCommandOpen } = useShell();

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Quản trị viên'
      : user?.role === 'MANAGER'
      ? 'Ban Quản Lý'
      : 'Cư Dân';

  const roleBadgeVariant =
    user?.role === 'ADMIN'
      ? 'default'
      : user?.role === 'MANAGER'
      ? 'info'
      : 'success';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-sm shadow-2xs">
      {/* Left side: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden text-slate-600 hover:text-slate-900 rounded-lg min-h-[44px] min-w-[44px]"
          onClick={toggleMobile}
          aria-label="Mở danh mục điều hướng"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Dynamic Breadcrumbs */}
        <Breadcrumb className="hidden sm:flex" />
      </div>

      {/* Right side: Quick Search, Notification, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Command Search Trigger Button */}
        <button
          type="button"
          onClick={() => setIsCommandOpen(true)}
          className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs transition-colors cursor-pointer select-none"
          title="Tìm kiếm nhanh chức năng (Ctrl + K)"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden lg:inline text-slate-400">Tìm chức năng...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Live Notification Popover */}
        <NotificationDropdown role={user?.role} />

        {/* User Profile Dropdown Menu */}
        <div className="pl-1 sm:pl-2 border-l border-slate-200">
          <Dropdown>
            <DropdownTrigger>
              <div
                className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer select-none min-h-[44px]"
                aria-label="Menu tài khoản"
              >
                <Avatar
                  name={user?.name || 'User'}
                  src={user?.avatarUrl}
                  size="default"
                  status="online"
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user?.name || 'Người dùng'}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400 ml-0.5" />
              </div>
            </DropdownTrigger>

            <DropdownContent align="right" className="w-56">
              <DropdownHeader>Tài khoản người dùng</DropdownHeader>
              <div className="px-2.5 py-2">
                <p className="font-bold text-xs text-slate-900 truncate">{user?.name || 'Người dùng'}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant={roleBadgeVariant} size="sm" dot>
                    {roleLabel}
                  </Badge>
                </div>
              </div>

              <DropdownDivider />

              <Link href={user?.role === 'RESIDENT' ? '/home' : '/dashboard'}>
                <DropdownItem icon={<Home className="h-4 w-4" />}>
                  {user?.role === 'RESIDENT' ? 'Trang chủ Cư dân' : 'Bảng điều khiển BQL'}
                </DropdownItem>
              </Link>

              <Link href={user?.role === 'RESIDENT' ? '/resident/notifications' : '/notifications'}>
                <DropdownItem icon={<Bell className="h-4 w-4" />}>
                  Trung tâm Thông báo
                </DropdownItem>
              </Link>

              <DropdownDivider />

              <DropdownItem
                destructive
                icon={<LogOut className="h-4 w-4" />}
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Đăng xuất
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
