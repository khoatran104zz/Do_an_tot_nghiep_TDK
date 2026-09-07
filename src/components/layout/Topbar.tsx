'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useShell } from './ShellContext';

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const { toggleMobile, setIsCommandOpen } = useShell();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur-md shadow-2xs">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg min-h-[40px] min-w-[40px]"
          onClick={toggleMobile}
          aria-label="Mở danh mục điều hướng"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Dynamic Breadcrumbs */}
        <Breadcrumb className="hidden sm:flex" />
      </div>

      {/* Right side: Global Search, ThemeToggle, Notification, UserMenu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Command Search Trigger */}
        <button
          type="button"
          onClick={() => setIsCommandOpen(true)}
          className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs transition-colors cursor-pointer select-none"
          title="Tìm kiếm nhanh chức năng (Ctrl + K)"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden lg:inline text-slate-400">Tìm chức năng...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Dark/Light Mode Switcher */}
        <ThemeToggle />

        {/* Notification Bell with Unread Counter */}
        <NotificationBell role={user?.role} />

        {/* User Profile Menu */}
        <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
