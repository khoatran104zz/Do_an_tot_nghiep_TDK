'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { CommandSearchDialog } from './CommandSearchDialog';
import { ShellProvider } from './ShellContext';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  maxWidth?: '5xl' | '6xl' | '7xl' | 'full';
  role?: 'ADMIN' | 'MANAGER' | 'RESIDENT';
}

function AppShellContent({
  children,
  maxWidth = '7xl',
  role: propRole,
}: AppShellProps) {
  const { data: session } = useSession();
  const role = propRole || (session?.user?.role as any) || 'MANAGER';

  const maxWidthClasses = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Dynamic RBAC Sidebar */}
      <Sidebar role={role} />

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className={cn('mx-auto animate-in fade-in-50 duration-200', maxWidthClasses[maxWidth])}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Ergonomic Navigation */}
      <MobileBottomNav role={role} />

      {/* Global Quick Command Palette */}
      <CommandSearchDialog />
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <ShellProvider>
      <AppShellContent {...props} />
    </ShellProvider>
  );
}
