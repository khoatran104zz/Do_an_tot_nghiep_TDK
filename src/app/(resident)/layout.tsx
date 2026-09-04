'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CommandSearchDialog } from '@/components/layout/CommandSearchDialog';
import { ShellProvider } from '@/components/layout/ShellContext';

function ResidentShellContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Resident Sidebar */}
      <Sidebar role="RESIDENT" />

      {/* Main Layout Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-5xl animate-in fade-in-50 duration-200">{children}</div>
        </main>
      </div>

      {/* Ergonomic Mobile Bottom Nav for Residents */}
      <MobileBottomNav role="RESIDENT" />

      {/* Quick Jump Command Palette (Ctrl + K) */}
      <CommandSearchDialog />
    </div>
  );
}

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <ResidentShellContent>{children}</ResidentShellContent>
    </ShellProvider>
  );
}
