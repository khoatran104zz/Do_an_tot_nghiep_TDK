'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <AppShell maxWidth="7xl">{children}</AppShell>;
}
