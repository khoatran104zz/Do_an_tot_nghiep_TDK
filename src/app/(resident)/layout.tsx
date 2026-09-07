'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return <AppShell maxWidth="6xl" role="RESIDENT">{children}</AppShell>;
}
