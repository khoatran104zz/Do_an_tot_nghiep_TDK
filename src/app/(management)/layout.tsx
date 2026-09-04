'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CommandSearchDialog } from '@/components/layout/CommandSearchDialog';
import { ShellProvider } from '@/components/layout/ShellContext';
import { useSession } from 'next-auth/react';

function ManagementShellContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = session?.user?.role || 'MANAGER';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/80">
      {/* Grouped Sidebar (collapsible on desktop, drawer on mobile) */}
      <Sidebar role={role} />

      {/* Main Layout Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl animate-in fade-in-50 duration-200">{children}</div>
        </main>
      </div>

      {/* Ergonomic Mobile Bottom Nav for one-hand use */}
      <MobileBottomNav role={role} />

      {/* Quick Jump Command Palette (Ctrl + K) */}
      <CommandSearchDialog />
    </div>
  );
}

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <ManagementShellContent>{children}</ManagementShellContent>
    </ShellProvider>
  );
}
