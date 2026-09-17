'use client';

import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ChevronDown, Home, Bell, LogOut, Shield } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownDivider,
  DropdownHeader,
} from '@/components/ui/dropdown';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  const role = user?.role || 'RESIDENT';
  const homeHref = role === 'RESIDENT' ? '/home' : '/dashboard';
  const notificationsHref = role === 'RESIDENT' ? '/resident/notifications' : '/notifications';

  const roleLabels: Record<string, string> = {
    ADMIN: 'Quản trị viên Cấp cao (Super Admin)',
    MANAGER: 'Quản lý Tòa nhà (BQL)',
    STAFF_TECHNICIAN: 'Kỹ thuật viên',
    STAFF_SECURITY: 'Nhân viên An ninh',
    STAFF_RECEPTIONIST: 'Nhân viên Lễ tân',
    RESIDENT: 'Cư Dân',
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <div
          className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none min-h-[40px]"
          aria-label="Menu tài khoản"
        >
          <Avatar
            name={user?.name || 'User'}
            src={user?.avatarUrl}
            size="default"
            status="online"
          />
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {user?.name || 'Người dùng'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 font-medium">
              {roleLabels[role] || 'Người dùng'}
            </span>
          </div>
          <ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400 ml-0.5" />
        </div>
      </DropdownTrigger>

      <DropdownContent align="right" className="w-60">
        <DropdownHeader>Tài khoản người dùng</DropdownHeader>
        <div className="px-3 py-2">
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
            {user?.name || 'Người dùng'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {user?.email}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge type="role" status={role} />
            <ThemeToggle />
          </div>
        </div>

        <DropdownDivider />

        <Link href={homeHref}>
          <DropdownItem icon={<Home className="h-4 w-4" />}>
            {role === 'ADMIN'
              ? 'Trung tâm Điều hành Hệ thống'
              : role === 'RESIDENT'
              ? 'Trang chủ Cư dân'
              : 'Bàn làm việc Tòa nhà'}
          </DropdownItem>
        </Link>

        <Link href={notificationsHref}>
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
  );
}
