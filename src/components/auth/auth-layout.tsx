'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AuthBranding, AuthBrandingProps } from './auth-branding';

export interface AuthLayoutProps {
  children: React.ReactNode;
  brandingProps?: AuthBrandingProps;
  className?: string;
}

/**
 * AuthLayout Component
 * Modern two-column authentication layout for Login and Register pages:
 * - Desktop: 50% / 50% split (Branding Visual + Form)
 * - Tablet: Optimized proportions
 * - Mobile: Single-column with clean, high-comfort touch targets (>= 44px)
 * - Light and Dark mode native support
 */
export function AuthLayout({
  children,
  brandingProps,
  className,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#07130e] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden">
      {/* ── Background Subtle Gradient Mesh ── */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#0F6B4F]/10 dark:bg-[#0F6B4F]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#22C55E]/10 dark:bg-[#22C55E]/15 blur-3xl pointer-events-none" />

      {/* ── Main Two-Column Card Container ── */}
      <div
        className={cn(
          'w-full max-w-6xl rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90',
          'bg-white dark:bg-slate-900 shadow-2xl backdrop-blur-xl',
          'grid grid-cols-1 lg:grid-cols-12 min-h-[660px] relative z-10',
          className
        )}
      >
        {/* ── Left Column: Branding & Architectural Smart Building Showcase (5 cols) ── */}
        <div className="hidden lg:flex lg:col-span-5 border-r border-slate-100 dark:border-slate-800">
          <AuthBranding {...brandingProps} className="w-full h-full" />
        </div>

        {/* ── Right Column: Form Area (7 cols) ── */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
