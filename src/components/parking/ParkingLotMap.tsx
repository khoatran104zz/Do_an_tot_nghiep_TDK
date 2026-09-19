'use client';

import React, { useState, useMemo } from 'react';
import {
  Car,
  Bike,
  Zap,
  Accessibility,
  Wrench,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  ArrowUp,
  ArrowDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { SlotVehicleType, ParkingSlotStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

export interface ParkingLotMapProps {
  areaName: string;
  areaCode: string;
  floor: number;
  slots: any[];
  selectedSlotId?: string | null;
  highlightedSlotId?: string | null;
  onSelectSlot: (slot: any) => void;
  isManager?: boolean;
}

export function ParkingLotMap({
  areaName,
  areaCode,
  floor,
  slots = [],
  selectedSlotId,
  highlightedSlotId,
  onSelectSlot,
  isManager = false,
}: ParkingLotMapProps) {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Group slots by Zone or coordinate grid
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && slot.type !== typeFilter) return false;
      return true;
    });
  }, [slots, statusFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = slots.length;
    const available = slots.filter((s) => s.status === 'AVAILABLE').length;
    const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;
    const reserved = slots.filter((s) => s.status === 'RESERVED').length;
    const maintenance = slots.filter((s) => s.status === 'MAINTENANCE').length;
    const blocked = slots.filter((s) => s.status === 'BLOCKED').length;
    return { total, available, occupied, reserved, maintenance, blocked };
  }, [slots]);

  // Helper for status styling
  const getSlotConfig = (status: ParkingSlotStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/60 text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500 ring-emerald-400',
          badge: 'Trống',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/60 text-rose-700 dark:text-rose-300',
          dot: 'bg-rose-500 ring-rose-400',
          badge: 'Đã đỗ',
          badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
        };
      case 'RESERVED':
        return {
          bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/60 text-amber-700 dark:text-amber-300',
          dot: 'bg-amber-500 ring-amber-400',
          badge: 'Đã đặt',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/60 text-orange-700 dark:text-orange-300',
          dot: 'bg-orange-500 ring-orange-400',
          badge: 'Bảo trì',
          badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300',
        };
      case 'BLOCKED':
      default:
        return {
          bg: 'bg-slate-500/15 hover:bg-slate-500/25 border-slate-500/60 text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-500 ring-slate-400',
          badge: 'Khóa',
          badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-950/80 dark:text-slate-300',
        };
    }
  };

  const getVehicleIcon = (type: SlotVehicleType) => {
    switch (type) {
      case 'MOTORBIKE':
        return <Bike className="w-4 h-4" />;
      case 'EV':
        return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'DISABLED':
        return <Accessibility className="w-4 h-4 text-blue-500" />;
      case 'CAR':
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6 overflow-hidden">
      {/* Header & Map Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F6B4F]/10 text-[#0F6B4F]">
              Khu {areaCode} • Tầng {floor < 0 ? `Hầm ${Math.abs(floor)}` : floor === 0 ? 'Mặt đất' : `Tầng ${floor}`}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{areaName}</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sơ đồ bãi xe thời gian thực • Nhấp vào từng ô để xem chi tiết hoặc gửi đăng ký
          </p>
        </div>

        {/* Zoom Controls & Legend Quick Status */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center bg-muted/60 rounded-lg p-1 border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.4))}
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-mono px-2 text-muted-foreground">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-1"
              onClick={() => setZoomLevel(1)}
              title="Khôi phục cỡ chuẩn"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Chips & Interactive Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 rounded-xl p-3 border border-border/40">
        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted-foreground mr-1">Trạng thái:</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-all',
              statusFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background hover:bg-muted text-foreground border border-border/60'
            )}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('AVAILABLE')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-background hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Trống ({stats.available})
          </button>
          <button
            onClick={() => setStatusFilter('OCCUPIED')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'OCCUPIED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-background hover:bg-rose-50 text-rose-700 dark:text-rose-400 border border-rose-500/30'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Đã đỗ ({stats.occupied})
          </button>
          <button
            onClick={() => setStatusFilter('RESERVED')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'RESERVED'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-background hover:bg-amber-50 text-amber-700 dark:text-amber-400 border border-amber-500/30'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Đã đặt ({stats.reserved})
          </button>
          <button
            onClick={() => setStatusFilter('MAINTENANCE')}
            className={cn(
              'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5',
              statusFilter === 'MAINTENANCE'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-background hover:bg-orange-50 text-orange-700 dark:text-orange-400 border border-orange-500/30'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Bảo trì ({stats.maintenance})
          </button>
        </div>

        {/* Vehicle Type Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted-foreground mr-1">Loại xe:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tất cả loại xe</option>
            <option value="CAR">Ô tô</option>
            <option value="MOTORBIKE">Xe máy</option>
            <option value="EV">Xe điện (EV)</option>
            <option value="DISABLED">Ưu tiên người khuyết tật</option>
          </select>
        </div>
      </div>

      {/* Interactive Map Visual Stage */}
      <div className="relative w-full overflow-x-auto rounded-xl bg-slate-900 border border-slate-800 p-6 min-h-[580px] shadow-inner">
        {/* Real garage simulated canvas with scaling */}
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
          }}
          className="min-w-[920px] max-w-[1200px] mx-auto flex flex-col gap-6"
        >
          {/* Top Boundary & Facility Gates */}
          <div className="flex items-center justify-between bg-slate-800/90 rounded-lg p-3 border border-slate-700 text-slate-200">
            {/* Gate Entry Barrier */}
            <div className="flex items-center gap-3 bg-emerald-950/80 border border-emerald-500/50 rounded-md px-3 py-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-emerald-400" />
                  CỔNG VÀO (ENTRY GATE 01)
                </div>
                <div className="text-[10px] text-slate-300">Barie tự động • Nhận diện RFID & Biển số</div>
              </div>
            </div>

            {/* Pedestrian / Core Elevator */}
            <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-700/80 rounded-md px-4 py-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                🛗 Thang máy sảnh Sky A & B
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                🚶 Lối bộ hành an toàn
              </div>
            </div>

            {/* Gate Exit Barrier */}
            <div className="flex items-center gap-3 bg-rose-950/80 border border-rose-500/50 rounded-md px-3 py-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 justify-end">
                  CỔNG RA (EXIT GATE 01)
                  <ArrowUp className="w-3 h-3 text-rose-400" />
                </div>
                <div className="text-[10px] text-slate-300">Barie thu phí & Quẹt thẻ hoàn tất</div>
              </div>
              <div className="w-3 h-3 rounded-full bg-rose-400" />
            </div>
          </div>

          {/* Row A Slots (Top Bay) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#0F6B4F]" />
                Dãy đỗ A • Khu vực Ô tô & EV
              </span>
              <span className="text-[11px] text-slate-400">Đậu vuông góc 90°</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
              {filteredSlots.slice(0, 20).map((slot) => {
                const config = getSlotConfig(slot.status);
                const isSelected = selectedSlotId === slot.id;
                const isHighlighted = highlightedSlotId === slot.id;

                return (
                  <button
                    key={slot.id}
                    onClick={() => onSelectSlot(slot)}
                    className={cn(
                      'group relative flex flex-col items-center justify-between p-2 rounded-lg border-2 transition-all duration-150 text-left min-h-[95px]',
                      config.bg,
                      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-slate-900 border-primary shadow-lg scale-105 z-10',
                      isHighlighted && 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse z-20'
                    )}
                  >
                    {/* Top code & status dot */}
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs font-mono font-bold tracking-tight text-white group-hover:text-amber-300">
                        {slot.code}
                      </span>
                      <span className={cn('w-2 h-2 rounded-full ring-2', config.dot)} />
                    </div>

                    {/* Center Vehicle Graphic Icon */}
                    <div className="my-1.5 p-1 rounded bg-black/30 text-slate-200 group-hover:scale-110 transition-transform">
                      {getVehicleIcon(slot.type)}
                    </div>

                    {/* Bottom Status text */}
                    <div className="w-full text-center">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', config.badgeBg)}>
                        {config.badge}
                      </span>
                    </div>

                    {/* Active assigned plate hint if manager or own */}
                    {slot.assignments?.[0]?.vehicle?.licensePlate && (
                      <div className="mt-1 text-[8px] font-mono text-slate-300 truncate max-w-full">
                        {slot.assignments[0].vehicle.licensePlate}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Central Driving Lane / Driving Asphalt Roadway */}
          <div className="relative my-2 py-6 bg-slate-950 rounded-xl border border-dashed border-slate-700 flex items-center justify-around overflow-hidden shadow-inner">
            {/* Driving Direction Arrows */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-amber-400/50" />
            
            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs z-10 bg-slate-950 px-3">
              <ArrowDown className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>LÀN XE VÀO (TỐC ĐỘ TỐI ĐA 15 KM/H)</span>
            </div>

            <div className="flex items-center gap-4 z-10 bg-slate-900 px-3 py-1 rounded border border-slate-700 text-xs text-slate-300">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trạm sạc nhanh EV 60kW sẵn sàng</span>
            </div>

            <div className="flex items-center gap-2 text-slate-500 font-mono text-xs z-10 bg-slate-950 px-3">
              <span>LÀN XE RA</span>
              <ArrowUp className="w-4 h-4 text-rose-400 animate-bounce" />
            </div>
          </div>

          {/* Row B Slots (Bottom Bay) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
                Dãy đỗ B • Khu vực Xe máy, Xe điện & Vãng lai
              </span>
              <span className="text-[11px] text-slate-400">Đậu chéo 45°</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
              {filteredSlots.slice(20, 40).map((slot) => {
                const config = getSlotConfig(slot.status);
                const isSelected = selectedSlotId === slot.id;
                const isHighlighted = highlightedSlotId === slot.id;

                return (
                  <button
                    key={slot.id}
                    onClick={() => onSelectSlot(slot)}
                    className={cn(
                      'group relative flex flex-col items-center justify-between p-2 rounded-lg border-2 transition-all duration-150 text-left min-h-[95px]',
                      config.bg,
                      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-slate-900 border-primary shadow-lg scale-105 z-10',
                      isHighlighted && 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse z-20'
                    )}
                  >
                    {/* Top code & status dot */}
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs font-mono font-bold tracking-tight text-white group-hover:text-amber-300">
                        {slot.code}
                      </span>
                      <span className={cn('w-2 h-2 rounded-full ring-2', config.dot)} />
                    </div>

                    {/* Center Vehicle Graphic Icon */}
                    <div className="my-1.5 p-1 rounded bg-black/30 text-slate-200 group-hover:scale-110 transition-transform">
                      {getVehicleIcon(slot.type)}
                    </div>

                    {/* Bottom Status text */}
                    <div className="w-full text-center">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', config.badgeBg)}>
                        {config.badge}
                      </span>
                    </div>

                    {slot.assignments?.[0]?.vehicle?.licensePlate && (
                      <div className="mt-1 text-[8px] font-mono text-slate-300 truncate max-w-full">
                        {slot.assignments[0].vehicle.licensePlate}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
