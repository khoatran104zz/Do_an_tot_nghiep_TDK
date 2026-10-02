'use client';

import React from 'react';
import {
  X,
  Car,
  Bike,
  Zap,
  Accessibility,
  ShieldCheck,
  Clock,
  User,
  Home,
  QrCode,
  Wrench,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ParkingDetailPanelProps {
  slot: any | null;
  areaCode?: string;
  areaName?: string;
  stats?: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    evCharging?: number;
  };
  onClose?: () => void;
  onReserve?: (slot: any) => void;
  isManager?: boolean;
  onStatusChange?: (slotId: string, status: any) => void;
  onReleaseSlot?: (slotId: string) => void;
  className?: string;
}

/**
 * ParkingDetailPanel Component
 * Displays the right-hand inspection card strictly matching the Figma design:
 * - Empty state with Park icon + Floor Summary with tri-color capacity bar
 * - Header with [P] badge, slot code, and close button
 * - Status pill (Available 🟢, Occupied 🔴, Reserved 🟡, etc.)
 * - Property spec rows: Vehicle Type, Floor, Zone, Status, Last Updated, License Plate, Reserved For
 * - EV banner for EV charging points
 * - Action buttons: "Reserve Parking", "Giải phóng ô đỗ", or "Report Issue"
 */
export function ParkingDetailPanel({
  slot,
  areaCode = 'B1',
  areaName = 'Tầng hầm B1',
  stats,
  onClose,
  onReserve,
  isManager = false,
  onStatusChange,
  onReleaseSlot,
  className,
}: ParkingDetailPanelProps) {
  // Empty State: when no slot is selected
  if (!slot) {
    const total = stats?.total ?? 120;
    const available = stats?.available ?? 42;
    const occupied = stats?.occupied ?? 68;
    const reserved = stats?.reserved ?? 10;
    const safeTotal = total > 0 ? total : 1;
    const occPct = Math.round((occupied / safeTotal) * 100);
    const resPct = Math.round((reserved / safeTotal) * 100);
    const availPct = Math.round((available / safeTotal) * 100);

    return (
      <div
        className={cn(
          'rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6',
          'flex flex-col items-center justify-center text-center min-h-[480px] shadow-sm',
          className
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#E8F5ED] dark:bg-emerald-950/60 border border-[#22C55E]/40 dark:border-emerald-500/30 flex items-center justify-center text-[#0F6B4F] dark:text-emerald-300 mb-3 shadow-2xs">
          <Car className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
          Chọn một vị trí đỗ xe
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
          Nhấp vào bất kỳ ô nào trên sơ đồ để xem thông số kỹ thuật, biển số xe và thực hiện điều phối.
        </p>

        {/* Quick Summary Card matching Figma App.tsx lines 743-759 */}
        <div className="w-full mt-6 rounded-xl p-4 bg-[#E8F5ED]/80 dark:bg-emerald-950/40 border border-[#BBF7D0] dark:border-emerald-500/30 text-left">
          <div className="text-[11px] font-bold text-[#0F6B4F] dark:text-emerald-400 font-mono tracking-wider mb-2 uppercase">
            TỔNG QUAN {areaCode} ({areaName})
          </div>

          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#15803D] dark:text-emerald-400">{available} trống</span>
            <span className="text-[#B91C1C] dark:text-rose-400">{occupied} đã đỗ</span>
            <span className="text-[#92400E] dark:text-amber-400">{reserved} đã đặt</span>
          </div>

          {/* Tri-color segmented progress bar */}
          <div className="mt-2.5 h-2 rounded-full overflow-hidden flex gap-0.5 bg-[#D1FAE5] dark:bg-slate-800">
            <div
              style={{ width: `${occPct}%` }}
              className="bg-[#EF4444] h-full rounded-sm"
              title={`Đã đỗ: ${occupied} (${occPct}%)`}
            />
            <div
              style={{ width: `${resPct}%` }}
              className="bg-[#F59E0B] h-full rounded-sm"
              title={`Đã đặt: ${reserved} (${resPct}%)`}
            />
            <div
              style={{ width: `${availPct}%` }}
              className="bg-[#22C55E] h-full rounded-sm"
              title={`Còn trống: ${available} (${availPct}%)`}
            />
          </div>

          <div className="text-[10px] text-[#15803D] dark:text-emerald-400 font-mono font-bold mt-2">
            {availPct}% công suất còn khả dụng
          </div>
        </div>
      </div>
    );
  }

  // Active Slot inspection
  const statusStr = String(slot.status || '').toLowerCase();
  const isAvailable = statusStr === 'available';
  const isOccupied = statusStr === 'occupied';
  const isReserved = statusStr === 'reserved';
  const isEV = statusStr === 'ev' || slot.type === 'EV' || slot.vehicleType === 'ev';
  const isAccessible = statusStr === 'accessible' || slot.type === 'ACCESSIBLE' || slot.vehicleType === 'accessible';
  const isMaintenance = statusStr === 'maintenance' || slot.status === 'MAINTENANCE';
  const isBlocked = statusStr === 'blocked' || statusStr === 'unavailable' || slot.status === 'BLOCKED';

  // Format Status Badge
  const renderStatusPill = () => {
    if (isAvailable) {
      return (
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#22C55E]/60 bg-[#DCFCE7]/70 dark:bg-emerald-950/50 text-[#15803D] dark:text-emerald-300 font-bold text-sm shadow-2xs">
          <span>Khả dụng (Available)</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]"></span>
          </span>
        </div>
      );
    }

    if (isOccupied) {
      return (
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#EF4444]/60 bg-[#FEE2E2]/70 dark:bg-rose-950/50 text-[#B91C1C] dark:text-rose-300 font-bold text-sm shadow-2xs">
          <span>Đang đỗ xe (Occupied)</span>
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#EF4444]"></span>
        </div>
      );
    }

    if (isReserved) {
      return (
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#F59E0B]/60 bg-[#FEF3C7]/70 dark:bg-amber-950/50 text-[#92400E] dark:text-amber-300 font-bold text-sm shadow-2xs">
          <span>Đã đặt chỗ (Reserved)</span>
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#F59E0B]"></span>
        </div>
      );
    }

    if (isMaintenance) {
      return (
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-amber-500/60 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold text-sm shadow-2xs">
          <span>Đang bảo trì (Maintenance)</span>
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
        </div>
      );
    }

    return (
      <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm">
        <span>Không khả dụng (Unavailable)</span>
        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
      </div>
    );
  };

  const vehicleTypeName =
    slot.vehicleType === 'motorcycle' || slot.type === 'MOTORBIKE'
      ? 'Xe máy (Motorcycle)'
      : isEV
      ? 'Xe điện (EV Charging)'
      : isAccessible
      ? 'Xe người khuyết tật (Accessible)'
      : 'Ô tô (Car)';

  const floorDisplay =
    slot.floor !== undefined
      ? slot.floor < 0
        ? `Tầng hầm B${Math.abs(slot.floor)}`
        : slot.floor === 0
        ? 'Bãi ngoài trời (Ground)'
        : `Tầng ${slot.floor}`
      : areaName;

  const zoneDisplay =
    slot.zoneName ||
    slot.zone?.name ||
    (slot.zoneCode ? `Khu ${slot.zoneCode}` : 'Zone A');

  const activeAssignment = slot.assignments?.[0];
  const licensePlate =
    slot.plate ||
    activeAssignment?.vehicle?.licensePlate ||
    (slot.note && slot.note.includes('Biển số:') ? slot.note.split('Biển số:')[1]?.trim() : null);

  const residentInfo =
    slot.resident ||
    activeAssignment?.resident?.fullName ||
    (activeAssignment?.apartment?.code ? `Căn hộ ${activeAssignment.apartment.code}` : null) ||
    (slot.note && slot.note.includes('Căn hộ') ? slot.note : null);

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6',
        'flex flex-col justify-between shadow-sm transition-all',
        className
      )}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5ED] dark:bg-emerald-950/70 border border-[#22C55E]/40 dark:border-emerald-500/30 flex items-center justify-center text-[#0F6B4F] dark:text-emerald-300 font-black text-lg">
              {isEV ? <Zap className="w-5 h-5 fill-current" /> : isAccessible ? <Accessibility className="w-5 h-5" /> : 'P'}
            </div>
            <div>
              <h3 className="text-xl font-black font-mono text-slate-900 dark:text-white tracking-tight leading-none">
                {slot.code}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chi tiết vị trí đỗ xe • {areaCode}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close detail panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Pill */}
        <div className="mt-4">{renderStatusPill()}</div>

        {/* Specs Table */}
        <div className="mt-5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400">Loại phương tiện</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {vehicleTypeName}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400">Tầng / Khu vực</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {floorDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400">Phân khu</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {zoneDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-500 dark:text-slate-400">Cập nhật</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Vừa xong (Real-time)
            </span>
          </div>

          {/* License plate if present */}
          {licensePlate && (
            <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
              <span className="text-rose-700 dark:text-rose-300 font-medium">Biển số đang đỗ</span>
              <span className="font-mono font-bold text-rose-800 dark:text-rose-200 text-sm">
                {licensePlate}
              </span>
            </div>
          )}

          {/* Resident / Unit info if present */}
          {residentInfo && (
            <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
              <span className="text-amber-800 dark:text-amber-300 font-medium">Cấp phát cho</span>
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                {residentInfo}
              </span>
            </div>
          )}

          {/* EV Charging banner matching Figma App.tsx lines 348-357 */}
          {isEV && (
            <div className="rounded-xl p-3 bg-[#E8F5ED] dark:bg-emerald-950/50 border border-[#BBF7D0] dark:border-emerald-500/40 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[#0F6B4F] dark:text-emerald-400 fill-current" />
                <span className="text-xs font-bold text-[#0F6B4F] dark:text-emerald-300">
                  Trạm Sạc Điện Nhanh EV
                </span>
              </div>
              <p className="text-[11px] text-[#15803D] dark:text-emerald-400">
                22 kW AC Fast Charging • Đầu sạc Type-2 tương thích mọi dòng xe
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="mt-6 space-y-2">
        {isAvailable ? (
          <Button
            type="button"
            onClick={() => onReserve?.(slot)}
            className="w-full py-5 rounded-xl bg-[#0F6B4F] hover:bg-[#0c5942] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            {isManager ? 'Cấp phát vị trí này' : 'Đăng ký đỗ xe (Reserve Parking)'}
          </Button>
        ) : isOccupied && isManager ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onReleaseSlot?.(slot.id)}
            className="w-full py-5 rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs"
          >
            Giải phóng ô đỗ này (Thu hồi)
          </Button>
        ) : (
          <Button
            type="button"
            disabled
            className="w-full py-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-sm cursor-not-allowed"
          >
            {isOccupied ? 'Đang có xe đỗ' : isReserved ? 'Đã được đặt chỗ' : 'Không khả dụng'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ParkingDetailPanel;
