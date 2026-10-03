'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface KHomeLogoProps {
  variant?: 'primary' | 'horizontal' | 'inverse' | 'icon-only' | 'app-icon' | 'banner' | 'monochrome';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  sloganLang?: 'en' | 'vi';
  brandTitle?: string;
  href?: string;
  className?: string;
}

/**
 * Redesigned Smart Apartment / K-Home Brand Mark
 * Geometric silhouette combining:
 * - Modern Smart Building / High-Rise Architecture
 * - 4-Window Smart Apartment Aperture (Connected Living)
 * - Eco Leaf / Dynamic Structural Angle in Emerald Green (#22C55E)
 * - Solid Architectural Foundation in Forest Green (#0F6B4F)
 * Scalable down to 16px, 24px, 32px with pixel-perfect clarity.
 */
export function KHomeIcon({
  className = 'h-8 w-8',
  inverse = false,
  monochrome,
  size,
}: {
  className?: string;
  inverse?: boolean;
  monochrome?: 'dark' | 'light';
  size?: number | string;
}) {
  // Color configuration
  let primaryColor = '#0F6B4F'; // Forest Green
  let accentColor = '#22C55E';  // Emerald Green

  if (inverse) {
    primaryColor = '#FFFFFF';
    accentColor = '#34D399';
  } else if (monochrome === 'dark') {
    primaryColor = '#1F2937';
    accentColor = '#4B5563';
  } else if (monochrome === 'light') {
    primaryColor = '#FFFFFF';
    accentColor = '#F3F4F6';
  }

  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none transition-transform duration-200', className)}
      {...dimensionProps}
      aria-label="Smart Apartment Logo"
    >
      {/* 1. Structural Left Tower & Vertical Spine (Building silhouette & K vertical stem) */}
      <path
        d="M6 30V10.8C6 9.8 6.8 9 7.8 9H13.2C14.2 9 15 9.8 15 10.8V30C15 30.6 14.6 31 14 31H7C6.4 31 6 30.6 6 30Z"
        fill={primaryColor}
      />

      {/* 2. Modern Angled Penthouse / Upper Architectural Facade */}
      <path
        d="M15 17.5L25.6 6.8C26.3 6.1 27.5 6.5 27.6 7.5L28.9 14.2C29.1 14.9 28.7 15.6 28 16L15 22.5V17.5Z"
        fill={primaryColor}
        opacity={inverse ? 0.95 : 0.88}
      />

      {/* 3. Sustainable Living Eco-Leaf Curve & Lower Wing (Green sweep forming dynamic K) */}
      <path
        d="M15 19L27.2 26.5C28.2 27.1 28.1 28.6 27.1 29.1L24.2 30.5C23.5 30.8 22.7 30.7 22.1 30.1L15 22.8V19Z"
        fill={accentColor}
      />

      {/* 4. Smart Apartment 2x2 Modular Window Grid (Connected IoT Living) */}
      <rect x="8.5" y="12" width="2.2" height="2.2" rx="0.6" fill={inverse ? accentColor : '#E8F5ED'} />
      <rect x="11.5" y="12" width="2.2" height="2.2" rx="0.6" fill={inverse ? accentColor : '#E8F5ED'} />
      <rect x="8.5" y="15.5" width="2.2" height="2.2" rx="0.6" fill={inverse ? accentColor : '#E8F5ED'} />
      <rect x="11.5" y="15.5" width="2.2" height="2.2" rx="0.6" fill={inverse ? accentColor : '#E8F5ED'} />

      {/* 5. Smart Connection Node on Upper Facade (IoT Pulse Indicator) */}
      <circle cx="23.5" cy="11.5" r="1.3" fill={accentColor} />
      <circle cx="23.5" cy="11.5" r="2.4" stroke={accentColor} strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}

export function KHomeLogo({
  variant = 'horizontal',
  size = 'md',
  showSlogan = true,
  sloganLang = 'en',
  brandTitle = 'K-Home',
  href,
  className,
}: KHomeLogoProps) {
  const isInverse = variant === 'inverse';
  const isMonochrome = variant === 'monochrome';

  const sizeClasses = {
    xs: {
      icon: 'h-6 w-6',
      title: 'text-sm font-bold tracking-tight',
      slogan: 'text-[8px] tracking-wider',
      gap: 'gap-1.5',
    },
    sm: {
      icon: 'h-7 w-7',
      title: 'text-base font-bold tracking-tight',
      slogan: 'text-[9px] tracking-wider',
      gap: 'gap-2',
    },
    md: {
      icon: 'h-9 w-9',
      title: 'text-lg sm:text-xl font-bold tracking-tight',
      slogan: 'text-[10px] tracking-wider',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 'h-11 w-11',
      title: 'text-2xl font-bold tracking-tight',
      slogan: 'text-xs tracking-wider',
      gap: 'gap-3',
    },
    xl: {
      icon: 'h-14 w-14',
      title: 'text-3xl font-extrabold tracking-tight',
      slogan: 'text-xs tracking-wide',
      gap: 'gap-3.5',
    },
  }[size];

  const sloganText =
    sloganLang === 'vi'
      ? 'Sống Thông Minh · Gắn Kết Cộng Đồng'
      : 'Smart Living, Better Together';

  // 1. Icon-only variant (Favicon, Mobile Nav, Collapsed Sidebar)
  if (variant === 'icon-only') {
    const iconElem = (
      <KHomeIcon
        className={sizeClasses.icon}
        inverse={isInverse}
        monochrome={isMonochrome ? 'dark' : undefined}
      />
    );
    return href ? (
      <Link href={href} className={cn('inline-flex items-center justify-center', className)}>
        {iconElem}
      </Link>
    ) : (
      <div className={cn('inline-flex items-center justify-center', className)}>{iconElem}</div>
    );
  }

  // 2. App Icon variant (Squircle badge for splash, mobile cards)
  if (variant === 'app-icon') {
    const appIconElem = (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl p-2.5 shadow-md border transition-transform duration-200 hover:scale-105',
          isInverse
            ? 'bg-[#0F6B4F] border-[#15803D]/40 text-white'
            : 'bg-white border-slate-200/90 dark:border-slate-800 dark:bg-slate-900',
          className
        )}
      >
        <KHomeIcon
          className={sizeClasses.icon}
          inverse={isInverse}
          monochrome={isMonochrome ? 'dark' : undefined}
        />
      </div>
    );
    return href ? <Link href={href}>{appIconElem}</Link> : appIconElem;
  }

  // 3. Primary Vertical variant (Centered icon with text underneath)
  if (variant === 'primary') {
    const primaryElem = (
      <div className={cn('flex flex-col items-center text-center', sizeClasses.gap, className)}>
        <div className="flex items-center justify-center p-2 rounded-2xl bg-[#E8F5ED] dark:bg-emerald-950/50 border border-[#22C55E]/30 shadow-2xs">
          <KHomeIcon className={sizeClasses.icon} inverse={isInverse} />
        </div>
        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h1
              className={cn(
                sizeClasses.title,
                isInverse ? 'text-white' : 'text-slate-900 dark:text-white font-extrabold'
              )}
            >
              {brandTitle}
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#0F6B4F]/10 dark:bg-emerald-500/20 text-[#0F6B4F] dark:text-emerald-400 uppercase tracking-widest">
              Smart
            </span>
          </div>
          {showSlogan && (
            <p
              className={cn(
                sizeClasses.slogan,
                'font-medium mt-0.5 tracking-wide',
                isInverse ? 'text-emerald-200/90' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {sloganText}
            </p>
          )}
        </div>
      </div>
    );
    return href ? <Link href={href}>{primaryElem}</Link> : primaryElem;
  }

  // 4. Inverse variant (Forest green card banner)
  if (variant === 'inverse') {
    const inverseElem = (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl p-5 bg-[#0F6B4F] text-white shadow-lg border border-[#15803D]/40',
          className
        )}
      >
        <KHomeIcon className={sizeClasses.icon} inverse={true} />
        <span className={cn(sizeClasses.title, 'text-white mt-2.5 font-bold')}>
          {brandTitle}
        </span>
        {showSlogan && (
          <span className={cn(sizeClasses.slogan, 'text-emerald-200/90 mt-0.5 tracking-wide')}>
            {sloganText}
          </span>
        )}
      </div>
    );
    return href ? <Link href={href}>{inverseElem}</Link> : inverseElem;
  }

  // 5. Full Header Banner variant
  if (variant === 'banner') {
    const bannerElem = (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-1.5 rounded-xl bg-[#E8F5ED] dark:bg-emerald-950/60 border border-[#22C55E]/30">
            <KHomeIcon className={sizeClasses.icon} inverse={isInverse} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  sizeClasses.title,
                  isInverse ? 'text-white' : 'text-slate-900 dark:text-white font-extrabold'
                )}
              >
                {brandTitle}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0F6B4F]/10 dark:bg-emerald-500/20 text-[#0F6B4F] dark:text-emerald-400">
                PRO
              </span>
            </div>
            {showSlogan && (
              <span
                className={cn(
                  sizeClasses.slogan,
                  'font-medium tracking-wide',
                  isInverse ? 'text-emerald-200/90' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {sloganText}
              </span>
            )}
          </div>
        </div>

        {/* Vietnamese Mission Divider */}
        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex flex-col text-slate-500 dark:text-slate-400 text-[11px] leading-tight font-medium">
            <span>Sống Thông Minh</span>
            <span className="text-[#0F6B4F] dark:text-emerald-400 font-semibold">Gắn Kết Cộng Đồng</span>
          </div>
        </div>
      </div>
    );
    return href ? <Link href={href}>{bannerElem}</Link> : bannerElem;
  }

  // 6. Horizontal variant (Standard for Topbar, Sidebar, Headers)
  const horizontalElem = (
    <div className={cn('flex items-center', sizeClasses.gap, className)}>
      <div className="flex items-center justify-center p-1 rounded-xl bg-[#E8F5ED] dark:bg-emerald-950/60 border border-[#22C55E]/30 shrink-0">
        <KHomeIcon
          className={sizeClasses.icon}
          inverse={isInverse}
          monochrome={isMonochrome ? 'dark' : undefined}
        />
      </div>
      <div className="flex flex-col truncate">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              sizeClasses.title,
              'leading-none',
              isInverse ? 'text-white' : 'text-slate-900 dark:text-white font-extrabold tracking-tight'
            )}
          >
            {brandTitle}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0F6B4F] text-white tracking-widest uppercase scale-90 origin-left">
            Apartment
          </span>
        </div>
        {showSlogan && (
          <span
            className={cn(
              sizeClasses.slogan,
              'font-medium mt-1 leading-none truncate',
              isInverse ? 'text-emerald-200/90' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {sloganText}
          </span>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="inline-flex items-center group">
      {horizontalElem}
    </Link>
  ) : (
    horizontalElem
  );
}

export default KHomeLogo;
