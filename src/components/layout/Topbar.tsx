'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="hidden sm:inline-block text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Tòa nhà High-Tech Apartment
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell link */}
        <Link href={user?.role === 'RESIDENT' ? '/resident/notifications' : '/notifications'}>
          <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          </Button>
        </Link>

        {/* User profile dropdown info */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {user?.name || 'Người dùng'}
            </span>
            <span className="text-[11px] text-slate-500">
              {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'MANAGER' ? 'Ban Quản Lý' : 'Cư Dân'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 ml-1"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
