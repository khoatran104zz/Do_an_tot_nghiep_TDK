'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface KHomeLogoProps {
  variant?: 'primary' | 'horizontal' | 'inverse' | 'icon-only' | 'app-icon' | 'banner';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  sloganLang?: 'en' | 'vi';
  href?: string;
  className?: string;
}

/**
 * K-Home Brand Mark (Icon SVG)
 * Mô phỏng chính xác biểu tượng nhận diện K-Home:
 * - Khung nhà viền đậm bo góc (#0F6B4F)
 * - Cột trụ chữ K màu xanh đậm (#0F6B4F)
 * - Cánh tay chéo chữ K màu xanh lục bảo tươi (#22C55E)
 * - 4 ô cửa sổ căn hộ thông minh 2x2 (#22C55E)
 */
export function KHomeIcon({
  className = 'h-8 w-8',
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  const frameColor = inverse ? '#FFFFFF' : '#0F6B4F';
  const stemColor = inverse ? '#FFFFFF' : '#0F6B4F';
  const accentColor = inverse ? '#34D399' : '#22C55E';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none transition-transform duration-200', className)}
      aria-label="K-Home Icon"
    >
      {/* Outer House Contour with smooth apex and rounded base */}
      <path
        d="M50 8L88 38V84C88 88.4 84.4 92 80 92H20C15.6 92 12 88.4 12 84V38L50 8Z"
        stroke={frameColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stylized 'K' Vertical Stem */}
      <path
        d="M32 36V74"
        stroke={stemColor}
        strokeWidth="8.5"
        strokeLinecap="round"
      />

      {/* Dynamic 'K' Upper Branch */}
      <path
        d="M36 55L52 38"
        stroke={accentColor}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Dynamic 'K' Lower Branch */}
      <path
        d="M40 51L56 74"
        stroke={accentColor}
        strokeWidth="8.5"
        strokeLinecap="round"
      />

      {/* 2x2 Smart Apartment Window Grid */}
      <rect x="62" y="52" width="6.5" height="6.5" rx="1.8" fill={accentColor} />
      <rect x="71.5" y="52" width="6.5" height="6.5" rx="1.8" fill={accentColor} />
      <rect x="62" y="61.5" width="6.5" height="6.5" rx="1.8" fill={accentColor} />
      <rect x="71.5" y="61.5" width="6.5" height="6.5" rx="1.8" fill={accentColor} />
    </svg>
  );
}

export function KHomeLogo({
  variant = 'horizontal',
  size = 'md',
  showSlogan = true,
  sloganLang = 'en',
  href,
  className,
}: KHomeLogoProps) {
  const isInverse = variant === 'inverse';

  const sizeClasses = {
    sm: {
      icon: 'h-7 w-7',
      title: 'text-base font-extrabold tracking-tight',
      slogan: 'text-[9px] tracking-wider',
      gap: 'gap-2',
    },
    md: {
      icon: 'h-9 w-9',
      title: 'text-xl font-extrabold tracking-tight',
      slogan: 'text-[10px] tracking-wider',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 'h-12 w-12',
      title: 'text-2xl font-extrabold tracking-tight',
      slogan: 'text-xs tracking-wider',
      gap: 'gap-3',
    },
    xl: {
      icon: 'h-16 w-16',
      title: 'text-3xl font-extrabold tracking-tight',
      slogan: 'text-sm tracking-wide',
      gap: 'gap-4',
    },
  }[size];

  const sloganText =
    sloganLang === 'vi'
      ? 'Quản lý thông minh · Kiến tạo cộng đồng'
      : 'Smart Living, Better Together';

  // 1. Icon-only variant
  if (variant === 'icon-only') {
    const iconElem = <KHomeIcon className={sizeClasses.icon} inverse={isInverse} />;
    return href ? (
      <Link href={href} className={cn('inline-flex items-center justify-center', className)}>
        {iconElem}
      </Link>
    ) : (
      <div className={cn('inline-flex items-center justify-center', className)}>{iconElem}</div>
    );
  }

  // 2. App Icon variant (Squircle container matching prompt)
  if (variant === 'app-icon') {
    const appIconElem = (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl p-2.5 shadow-md border transition-transform duration-200 hover:scale-105',
          isInverse
            ? 'bg-[#0F6B4F] border-[#15803D]/40 text-white'
            : 'bg-white border-slate-200/80 dark:border-slate-800 dark:bg-slate-900',
          className
        )}
      >
        <KHomeIcon className={sizeClasses.icon} inverse={isInverse} />
      </div>
    );
    return href ? <Link href={href}>{appIconElem}</Link> : appIconElem;
  }

  // 3. Vertical (Primary) variant (Icon on top, K-Home and Slogan centered underneath)
  if (variant === 'primary') {
    const primaryElem = (
      <div className={cn('flex flex-col items-center text-center', sizeClasses.gap, className)}>
        <KHomeIcon className={sizeClasses.icon} inverse={isInverse} />
        <div>
          <h1
            className={cn(
              sizeClasses.title,
              isInverse ? 'text-white' : 'text-[#0F6B4F] dark:text-emerald-400 font-extrabold'
            )}
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            K-Home
          </h1>
          {showSlogan && (
            <p
              className={cn(
                sizeClasses.slogan,
                'font-medium mt-0.5 tracking-wide',
                isInverse ? 'text-emerald-200/90' : 'text-[#6B7280] dark:text-slate-400'
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

  // 4. Inverse Logo (Dark forest green container with crisp white/emerald elements)
  if (variant === 'inverse') {
    const inverseElem = (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl p-6 bg-[#0F6B4F] text-white shadow-lg border border-[#15803D]/40',
          className
        )}
      >
        <KHomeIcon className={sizeClasses.icon} inverse={true} />
        <span
          className={cn(sizeClasses.title, 'text-white mt-2.5 font-extrabold')}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          K-Home
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

  // 5. Full Header Banner variant (As shown in reference image header)
  if (variant === 'banner') {
    const bannerElem = (
      <div className={cn('flex items-center gap-5', className)}>
        <div className="flex items-center gap-3">
          <KHomeIcon className={sizeClasses.icon} inverse={isInverse} />
          <div className="flex flex-col">
            <span
              className={cn(
                sizeClasses.title,
                isInverse ? 'text-white' : 'text-[#0F6B4F] dark:text-emerald-400 font-extrabold'
              )}
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              K-Home
            </span>
            <span
              className={cn(
                sizeClasses.slogan,
                'font-medium tracking-wide mt-0.5',
                isInverse ? 'text-emerald-200/90' : 'text-[#6B7280] dark:text-slate-400'
              )}
            >
              Smart Living, Better Together
            </span>
          </div>
        </div>

        {/* Vietnamese Mission Divider */}
        <div className="hidden lg:flex items-center gap-4 pl-5 border-l border-slate-300/80 dark:border-slate-700 text-xs">
          <div className="flex flex-col text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
            <span>Quản lý thông minh</span>
            <span>Kiến tạo cộng đồng</span>
            <span>Cuộc sống tốt đẹp hơn</span>
            <span className="w-6 h-0.5 bg-[#22C55E] rounded-full mt-0.5" />
          </div>
        </div>
      </div>
    );
    return href ? <Link href={href}>{bannerElem}</Link> : bannerElem;
  }

  // 6. Horizontal variant (Standard for Header / Sidebar / Topbar)
  const horizontalElem = (
    <div className={cn('flex items-center', sizeClasses.gap, className)}>
      <KHomeIcon className={sizeClasses.icon} inverse={isInverse} />
      <div className="flex flex-col truncate">
        <span
          className={cn(
            sizeClasses.title,
            'leading-none',
            isInverse ? 'text-white' : 'text-[#0F6B4F] dark:text-emerald-400 font-extrabold'
          )}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          K-Home
        </span>
        {showSlogan && (
          <span
            className={cn(
              sizeClasses.slogan,
              'font-medium mt-1 leading-none truncate',
              isInverse ? 'text-emerald-200/90' : 'text-[#6B7280] dark:text-slate-400'
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
