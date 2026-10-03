'use client';

import React from 'react';
import {
  ShieldCheck,
  Building2,
  Zap,
  Sparkles,
} from 'lucide-react';
import { KHomeIcon } from '@/components/shared/KHomeLogo';
import { cn } from '@/lib/utils';

export interface AuthBrandingProps {
  quote?: string;
  supportingText?: string;
  activeRoleBadge?: string;
  className?: string;
}

/**
 * AuthBranding Component
 * Left-side visual branding area for Smart Apartment Management:
 * - Clean editorial geometric vector illustration of modern apartment buildings
 * - Subtle eco-living, smart windows, connected IoT nodes, parking & green terraces
 * - Clear brand message: "Smart Living, Better Together"
 * - Minimal, elegant, enterprise-ready visual aesthetic
 */
export function AuthBranding({
  quote = 'Smart Living, Better Together',
  supportingText = 'Nền tảng quản lý vận hành chung cư thông minh toàn diện — Sống Thông Minh · Gắn Kết Cộng Đồng.',
  activeRoleBadge,
  className,
}: AuthBrandingProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between p-8 sm:p-10 lg:p-12 overflow-hidden select-none',
        'bg-[#0a231b] dark:bg-[#061812] text-white',
        className
      )}
    >
      {/* ── Background Subtle Gradient & Grid Mesh ── */}
      <div className="absolute inset-0 bg-[radial-gradient(#22C55E_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#0F6B4F]/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#22C55E]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#15803D]/15 blur-2xl pointer-events-none" />

      {/* ── 1. Top Brand Header ── */}
      <div className="relative z-10">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F6B4F] text-white shadow-lg shadow-[#0F6B4F]/40 ring-1 ring-white/20 p-2">
            <KHomeIcon className="h-8 w-8" inverse />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white leading-tight">
                K-Home
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
                Smart Apartment
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
              Hệ Thống Quản Lý Vận Hành Chung Cư Thông Minh
            </p>
          </div>
        </div>

        {activeRoleBadge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mt-3 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Phân hệ: {activeRoleBadge}</span>
          </div>
        )}
      </div>

      {/* ── 2. Center: Minimal Architectural Smart Building Vector Illustration ── */}
      <div className="relative z-10 my-8 py-4 flex flex-col items-center justify-center">
        <svg
          viewBox="0 0 460 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full max-w-[420px] h-auto drop-shadow-2xl transition-all duration-500 hover:scale-[1.01]"
          aria-hidden="true"
        >
          {/* Ground Plane & Landscaping */}
          <rect x="20" y="270" width="420" height="4" rx="2" fill="#22C55E" fillOpacity="0.4" />
          <path d="M40 270L60 230L80 270Z" fill="#15803D" fillOpacity="0.6" />
          <path d="M50 270L65 240L80 270Z" fill="#22C55E" fillOpacity="0.8" />
          <path d="M380 270L400 235L420 270Z" fill="#15803D" fillOpacity="0.6" />
          <path d="M390 270L405 245L420 270Z" fill="#22C55E" fillOpacity="0.8" />

          {/* Tower 1 (Left Wing - Residential Block A) */}
          <rect x="70" y="100" width="95" height="170" rx="6" fill="#0D3528" stroke="#15803D" strokeWidth="1.5" />
          {/* Rooftop Garden on Tower 1 */}
          <rect x="75" y="92" width="85" height="8" rx="3" fill="#22C55E" fillOpacity="0.7" />
          <circle cx="85" cy="88" r="4" fill="#34D399" />
          <circle cx="100" cy="86" r="6" fill="#22C55E" />
          <circle cx="115" cy="88" r="4" fill="#34D399" />
          {/* Solar Panels on Tower 1 */}
          <rect x="125" y="86" width="30" height="6" rx="1.5" fill="#38BDF8" fillOpacity="0.8" />

          {/* Tower 1 Windows Grid (Smart Apartment Modules) */}
          {[120, 150, 180, 210, 240].map((y, rowIdx) => (
            <React.Fragment key={y}>
              <rect x="85" y={y} width="16" height="18" rx="3" fill={rowIdx % 2 === 0 ? '#E8F5ED' : '#22C55E'} fillOpacity={rowIdx % 2 === 0 ? '0.85' : '0.6'} />
              <rect x="110" y={y} width="16" height="18" rx="3" fill={rowIdx === 1 ? '#34D399' : '#E8F5ED'} fillOpacity="0.75" />
              <rect x="135" y={y} width="16" height="18" rx="3" fill={rowIdx === 3 ? '#22C55E' : '#E8F5ED'} fillOpacity="0.8" />
            </React.Fragment>
          ))}

          {/* Main Tower (Center High-Rise Landmark Block) */}
          <rect x="180" y="45" width="130" height="225" rx="8" fill="#072219" stroke="#22C55E" strokeWidth="2" />
          {/* Penthouse Crown Roof Angle */}
          <path d="M180 45L245 15L310 45H180Z" fill="#0F6B4F" stroke="#22C55E" strokeWidth="1.5" />
          {/* Central Beacon IoT Node */}
          <circle cx="245" cy="15" r="4" fill="#22C55E" />
          <circle cx="245" cy="15" r="8" stroke="#34D399" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
          <line x1="245" y1="15" x2="245" y2="4" stroke="#34D399" strokeWidth="1.5" />
          <circle cx="245" cy="4" r="2" fill="#38BDF8" />

          {/* Central Skybridge connecting Tower 1 and Main Tower */}
          <rect x="165" y="150" width="15" height="16" fill="#0F6B4F" stroke="#15803D" strokeWidth="1" />
          <rect x="165" y="154" width="15" height="8" fill="#E8F5ED" fillOpacity="0.6" />

          {/* Main Tower Windows Grid with Ambient Living Glows */}
          {[65, 95, 125, 155, 185, 215, 245].map((y, rowIdx) => (
            <React.Fragment key={y}>
              <rect x="196" y={y} width="18" height="16" rx="3" fill={rowIdx === 2 || rowIdx === 5 ? '#22C55E' : '#E8F5ED'} fillOpacity={rowIdx === 2 ? '0.9' : '0.8'} />
              <rect x="224" y={y} width="18" height="16" rx="3" fill={rowIdx % 3 === 0 ? '#34D399' : '#E8F5ED'} fillOpacity="0.75" />
              <rect x="252" y={y} width="18" height="16" rx="3" fill="#E8F5ED" fillOpacity={rowIdx === 4 ? '0.9' : '0.7'} />
              <rect x="280" y={y} width="18" height="16" rx="3" fill={rowIdx === 1 ? '#22C55E' : '#E8F5ED'} fillOpacity="0.85" />
            </React.Fragment>
          ))}

          {/* Main Tower Grand Entrance Lobby */}
          <rect x="225" y="245" width="40" height="25" rx="4" fill="#0F6B4F" stroke="#34D399" strokeWidth="1.5" />
          <rect x="235" y="252" width="20" height="18" rx="2" fill="#E8F5ED" fillOpacity="0.9" />

          {/* Tower 2 (Right Wing - Eco Services Block) */}
          <rect x="325" y="120" width="85" height="150" rx="6" fill="#0D3528" stroke="#15803D" strokeWidth="1.5" />
          {/* Rooftop Garden on Tower 2 */}
          <rect x="330" y="112" width="75" height="8" rx="3" fill="#22C55E" fillOpacity="0.7" />
          <circle cx="345" cy="108" r="5" fill="#34D399" />
          <circle cx="360" cy="106" r="6" fill="#22C55E" />
          <circle cx="375" cy="108" r="4" fill="#34D399" />

          {/* Tower 2 Windows */}
          {[135, 165, 195, 225].map((y, rowIdx) => (
            <React.Fragment key={y}>
              <rect x="340" y={y} width="16" height="16" rx="3" fill={rowIdx === 1 ? '#22C55E' : '#E8F5ED'} fillOpacity="0.8" />
              <rect x="365" y={y} width="16" height="16" rx="3" fill="#E8F5ED" fillOpacity="0.7" />
              <rect x="390" y={y} width="16" height="16" rx="3" fill={rowIdx === 2 ? '#34D399' : '#E8F5ED'} fillOpacity="0.85" />
            </React.Fragment>
          ))}

          {/* Right Skybridge */}
          <rect x="310" y="180" width="15" height="16" fill="#0F6B4F" stroke="#15803D" strokeWidth="1" />
          <rect x="310" y="184" width="15" height="8" fill="#E8F5ED" fillOpacity="0.6" />

          {/* Ground Smart Features: EV Charging Station & Smart Barrier Gate */}
          {/* Smart Parking Barrier */}
          <rect x="100" y="260" width="4" height="10" fill="#E8F5ED" />
          <rect x="94" y="262" width="30" height="2" fill="#EF4444" rx="1" />
          <circle cx="102" cy="258" r="2.5" fill="#22C55E" />

          {/* EV Charging Pedestal */}
          <rect x="335" y="255" width="8" height="15" rx="2" fill="#0F6B4F" stroke="#22C55E" strokeWidth="1" />
          <path d="M339 258L337 263H341L339 267" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Smart Waves & IoT Transmission Pulses */}
          <path d="M225 35C235 30 255 30 265 35" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" opacity="0.8" />
          <path d="M215 28C230 20 260 20 275 28" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 4" opacity="0.6" />
        </svg>

        {/* Feature Badges under illustration */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-medium text-emerald-200">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>200+ Căn hộ</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Trạm sạc EV thông minh</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>An ninh ANPR 24/7</span>
          </span>
        </div>
      </div>

      {/* ── 3. Bottom Brand Message ── */}
      <div className="relative z-10 pt-4 border-t border-emerald-900/60">
        <blockquote className="space-y-1.5">
          <p className="text-base sm:text-lg font-bold text-white tracking-tight">
            “{quote}”
          </p>
          <p className="text-xs text-emerald-200/80 leading-relaxed font-normal">
            {supportingText}
          </p>
        </blockquote>

        <div className="flex items-center justify-between text-[11px] text-emerald-300/70 pt-4 mt-3 border-t border-emerald-900/40">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
            </span>
            <span>Hệ thống trực tuyến 99.9% Uptime</span>
          </div>
          <span>Bảo mật chuẩn ISO/IEC</span>
        </div>
      </div>
    </div>
  );
}

export default AuthBranding;
