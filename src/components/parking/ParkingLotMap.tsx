'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Car,
  Bike,
  Zap,
  Accessibility,
  Wrench,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  Search,
  List,
  Grid3X3,
  MapPin,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { SlotVehicleType, ParkingSlotStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

export interface ParkingLotMapProps {
  areaName: string;
  areaCode: string;
  floor: number;
  slots: any[];
  zones?: any[];
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
  zones = [],
  selectedSlotId,
  highlightedSlotId,
  onSelectSlot,
  isManager = false,
}: ParkingLotMapProps) {
  // View mode: Map vs List
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Zoom & Fullscreen
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Extract unique zones from slots or props
  const availableZones = useMemo(() => {
    if (zones && zones.length > 0) return zones;
    const map = new Map<string, { id: string; code: string; name: string; colorHex?: string }>();
    slots.forEach((s) => {
      if (s.zone) {
        map.set(s.zone.id, {
          id: s.zone.id,
          code: s.zone.code,
          name: s.zone.name,
          colorHex: s.zone.colorHex,
        });
      }
    });
    return Array.from(map.values());
  }, [slots, zones]);

  // Filtered slots based on all criteria
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && slot.type !== typeFilter) return false;
      if (zoneFilter !== 'ALL' && slot.zoneId !== zoneFilter && slot.zone?.code !== zoneFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchCode = slot.code?.toLowerCase().includes(query);
        const matchZone = slot.zone?.name?.toLowerCase().includes(query) || slot.zone?.code?.toLowerCase().includes(query);
        const matchPlate = slot.assignments?.[0]?.vehicle?.licensePlate?.toLowerCase().includes(query);
        if (!matchCode && !matchZone && !matchPlate) return false;
      }
      return true;
    });
  }, [slots, statusFilter, typeFilter, zoneFilter, searchQuery]);

  // Statistics (Real numbers from backend source of truth)
  const stats = useMemo(() => {
    const total = slots.length;
    const available = slots.filter((s) => s.status === 'AVAILABLE').length;
    const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;
    const reserved = slots.filter((s) => s.status === 'RESERVED').length;
    const maintenance = slots.filter((s) => s.status === 'MAINTENANCE').length;
    const blocked = slots.filter((s) => s.status === 'BLOCKED').length;
    return { total, available, occupied, reserved, maintenance, blocked };
  }, [slots]);

  // Group filtered slots by zone
  const slotsGroupedByZone = useMemo(() => {
    const grouped = new Map<string, { zoneInfo: any; slots: any[] }>();

    filteredSlots.forEach((slot) => {
      const zoneKey = slot.zone?.id || slot.zoneId || 'DEFAULT_ZONE';
      const zoneInfo = slot.zone || {
        id: zoneKey,
        code: slot.zone?.code || 'ZONE',
        name: slot.zone?.name || 'Phân khu đỗ xe',
        colorHex: '#0F6B4F',
      };

      if (!grouped.has(zoneKey)) {
        grouped.set(zoneKey, { zoneInfo, slots: [] });
      }
      grouped.get(zoneKey)!.slots.push(slot);
    });

    return Array.from(grouped.values());
  }, [filteredSlots]);

  // Status visual config conforming to K-Home brand tokens
  const getSlotConfig = (status: ParkingSlotStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500 ring-emerald-400',
          badge: 'Trống',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
          indicatorBorder: 'border-emerald-500',
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/50 text-rose-700 dark:text-rose-300',
          dot: 'bg-rose-500 ring-rose-400',
          badge: 'Đã đỗ',
          badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
          indicatorBorder: 'border-rose-500',
        };
      case 'RESERVED':
        return {
          bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300',
          dot: 'bg-amber-500 ring-amber-400',
          badge: 'Đã đặt',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
          indicatorBorder: 'border-amber-500',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/50 text-orange-700 dark:text-orange-300',
          dot: 'bg-orange-500 ring-orange-400',
          badge: 'Bảo trì',
          badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300',
          indicatorBorder: 'border-orange-500',
        };
      case 'BLOCKED':
      default:
        return {
          bg: 'bg-slate-500/15 hover:bg-slate-500/25 border-slate-500/50 text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-500 ring-slate-400',
          badge: 'Khóa',
          badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-950/80 dark:text-slate-300',
          indicatorBorder: 'border-slate-500',
        };
    }
  };

  const getVehicleIcon = (type: SlotVehicleType, isOccupied = false) => {
    switch (type) {
      case 'MOTORBIKE':
        return <Bike className={cn('w-4 h-4', isOccupied ? 'text-rose-400' : 'text-slate-300')} />;
      case 'EV':
        return <Zap className={cn('w-4 h-4', isOccupied ? 'text-amber-400' : 'text-emerald-400')} />;
      case 'DISABLED':
        return <Accessibility className="w-4 h-4 text-blue-400" />;
      case 'CAR':
      default:
        return <Car className={cn('w-4 h-4', isOccupied ? 'text-rose-400' : 'text-slate-300')} />;
    }
  };

  const getVehicleTypeLabel = (type: SlotVehicleType) => {
    switch (type) {
      case 'MOTORBIKE':
        return 'Xe máy';
      case 'EV':
        return 'Ô tô điện (EV)';
      case 'DISABLED':
        return 'Ưu tiên khuyết tật';
      case 'CAR':
      default:
        return 'Ô tô tiêu chuẩn';
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className={cn(
        'flex flex-col gap-4 bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6 overflow-hidden transition-all',
        isFullscreen && 'fixed inset-0 z-50 rounded-none h-screen w-screen p-6 overflow-y-auto bg-slate-950'
      )}
    >
      {/* 1. Header & Summary Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F6B4F]/10 text-[#0F6B4F] dark:bg-[#0F6B4F]/20 dark:text-emerald-400 border border-[#0F6B4F]/20">
              Khu {areaCode} • Tầng {floor < 0 ? `Hầm ${Math.abs(floor)}` : floor === 0 ? 'Mặt đất' : `Tầng ${floor}`}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{areaName}</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Sơ đồ bãi xe thông minh thời gian thực • Nhấp vào vị trí để xem chi tiết, đăng ký hoặc điều phối
          </p>
        </div>

        {/* Live Summary Counter Bar (Section 11) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium w-full lg:w-auto">
          <div className="bg-muted/60 px-2.5 py-1 rounded-lg border border-border flex items-center gap-1.5">
            <span className="text-muted-foreground">Tổng số:</span>
            <span className="font-bold text-foreground font-mono">{stats.total}</span>
          </div>
          <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Trống:</span>
            <span className="font-bold font-mono">{stats.available}</span>
          </div>
          <div className="bg-rose-500/10 text-rose-800 dark:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Đã đỗ:</span>
            <span className="font-bold font-mono">{stats.occupied}</span>
          </div>
          <div className="bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Đã đặt:</span>
            <span className="font-bold font-mono">{stats.reserved}</span>
          </div>
          {stats.maintenance > 0 && (
            <div className="bg-orange-500/10 text-orange-800 dark:text-orange-300 px-2.5 py-1 rounded-lg border border-orange-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Bảo trì:</span>
              <span className="font-bold font-mono">{stats.maintenance}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter, Search & View Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/40 rounded-xl p-3 border border-border/50">
        {/* Search and Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Quick Search */}
          <div className="relative min-w-[140px] max-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã ô, biển số..."
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          {/* Zone Filter */}
          {availableZones.length > 0 && (
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="h-8 px-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-[#0F6B4F]"
            >
              <option value="ALL">Tất cả phân khu</option>
              {availableZones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          )}

          {/* Vehicle Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-[#0F6B4F]"
          >
            <option value="ALL">Tất cả loại xe</option>
            <option value="CAR">Ô tô</option>
            <option value="MOTORBIKE">Xe máy</option>
            <option value="EV">Ô tô điện (EV)</option>
            <option value="DISABLED">Ưu tiên người khuyết tật</option>
          </select>

          {/* Status Filter Pills */}
          <div className="hidden xl:flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all',
                statusFilter === 'ALL'
                  ? 'bg-[#0F6B4F] text-white shadow-xs'
                  : 'bg-background hover:bg-muted text-foreground border border-border/60'
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5',
                statusFilter === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-background hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Trống ({stats.available})
            </button>
            <button
              onClick={() => setStatusFilter('OCCUPIED')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5',
                statusFilter === 'OCCUPIED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-background hover:bg-rose-50 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Đã đỗ ({stats.occupied})
            </button>
          </div>
        </div>

        {/* View Mode & Map Zoom Controls */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background rounded-lg p-0.5 border border-border">
            <button
              onClick={() => setViewMode('MAP')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all',
                viewMode === 'MAP'
                  ? 'bg-[#0F6B4F] text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Xem bản đồ trực quan"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bản đồ</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all',
                viewMode === 'LIST'
                  ? 'bg-[#0F6B4F] text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Xem danh sách dạng bảng"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
          </div>

          {/* Map Controls */}
          {viewMode === 'MAP' && (
            <div className="flex items-center bg-background rounded-lg p-0.5 border border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.4))}
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-mono px-1.5 text-muted-foreground">
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
                className="h-7 w-7"
                onClick={() => setZoomLevel(1)}
                title="Khôi phục cỡ chuẩn 100%"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Empty State Check */}
      {filteredSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-muted/20 border border-dashed border-border rounded-xl">
          <div className="p-3 rounded-full bg-muted mb-3">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="text-base font-bold text-foreground">Không tìm thấy ô đỗ xe phù hợp</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Không có vị trí đỗ nào thỏa mãn bộ lọc hiện tại. Vui lòng thay đổi trạng thái, phân khu hoặc xóa từ khóa tìm kiếm.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter('ALL');
              setTypeFilter('ALL');
              setZoneFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-4 text-xs"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : viewMode === 'LIST' ? (
        /* 4. LIST VIEW (Mobile Friendly & Table Fallback) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto p-1">
          {filteredSlots.map((slot) => {
            const config = getSlotConfig(slot.status);
            const isSelected = selectedSlotId === slot.id;
            const isHighlighted = highlightedSlotId === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  'p-3.5 rounded-xl border bg-card hover:bg-muted/50 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs',
                  isSelected && 'ring-2 ring-[#0F6B4F] border-[#0F6B4F]',
                  isHighlighted && 'ring-2 ring-amber-500 animate-pulse'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-foreground">
                        {slot.code}
                      </span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', config.badgeBg)}>
                        {config.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {slot.zone?.name || 'Phân khu'} • Tầng {slot.floor < 0 ? `B${Math.abs(slot.floor)}` : slot.floor}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                    {getVehicleIcon(slot.type, slot.status === 'OCCUPIED')}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50 text-muted-foreground">
                  <span>{getVehicleTypeLabel(slot.type)}</span>
                  {slot.assignments?.[0]?.vehicle?.licensePlate ? (
                    <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                      {slot.assignments[0].vehicle.licensePlate}
                    </span>
                  ) : (
                    <span className="text-[11px] text-primary hover:underline">Chi tiết →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 5. MODERN ARCHITECTURAL PARKING LOT MAP */
        <div className="relative w-full overflow-x-auto rounded-xl bg-slate-950 border border-slate-800 p-4 sm:p-6 min-h-[580px] shadow-2xl">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-out',
            }}
            className="min-w-[940px] max-w-[1240px] mx-auto flex flex-col gap-6"
          >
            {/* Top Facility Boundary & Real Barrier Gates */}
            <div className="flex items-center justify-between bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-slate-200 shadow-md">
              {/* Gate Entry Barrier */}
              <div className="flex items-center gap-3 bg-emerald-950/80 border border-emerald-500/40 rounded-lg px-3.5 py-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    CỔNG VÀO (ENTRY GATE 01)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Camera ANPR & RFID Nhận diện tự động</div>
                </div>
              </div>

              {/* Sky Lobby & Pedestrian Core */}
              <div className="flex items-center gap-4 bg-slate-950/90 border border-slate-800 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  🛗 Sảnh thang máy Sky A-B
                </div>
                <div className="w-px h-4 bg-slate-800" />
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  🚶 Lối bộ hành an toàn
                </div>
              </div>

              {/* Gate Exit Barrier */}
              <div className="flex items-center gap-3 bg-rose-950/80 border border-rose-500/40 rounded-lg px-3.5 py-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 justify-end">
                    CỔNG RA (EXIT GATE 01)
                    <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Barie thu phí & Quẹt thẻ hoàn tất</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              </div>
            </div>

            {/* Dynamic Zone Bays with Architectural Layout */}
            {slotsGroupedByZone.map((group, groupIdx) => {
              const { zoneInfo, slots: zoneSlots } = group;

              return (
                <div key={zoneInfo.id || groupIdx} className="space-y-2">
                  {/* Zone Header Bar */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zoneInfo.colorHex || '#0F6B4F' }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        {zoneInfo.name} ({zoneInfo.code})
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {zoneSlots.filter((s) => s.status === 'AVAILABLE').length} trống / {zoneSlots.length} ô
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span>Đậu vuông góc 90°</span>
                      <span className="text-slate-600">•</span>
                      <span>Giới hạn tải trọng 3.5T</span>
                    </span>
                  </div>

                  {/* Zone Slots Grid with Architectural Concrete Columns */}
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    {zoneSlots.map((slot, sIdx) => {
                      const config = getSlotConfig(slot.status);
                      const isSelected = selectedSlotId === slot.id;
                      const isHighlighted = highlightedSlotId === slot.id;
                      const isOccupied = slot.status === 'OCCUPIED';

                      // Tooltip content
                      const tooltipContent = (
                        <div className="text-left space-y-1 p-0.5">
                          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1">
                            <span className="font-mono font-bold text-foreground text-xs">{slot.code}</span>
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.2 rounded', config.badgeBg)}>
                              {config.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            <div>Loại: <span className="text-foreground font-medium">{getVehicleTypeLabel(slot.type)}</span></div>
                            <div>Khu vực: <span className="text-foreground">{zoneInfo.name}</span></div>
                            {slot.assignments?.[0]?.vehicle?.licensePlate && (
                              <div className="font-mono text-primary font-bold mt-1">
                                Biển số: {slot.assignments[0].vehicle.licensePlate}
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] text-[#0F6B4F] pt-0.5 font-semibold">
                            Nhấp để mở chi tiết & thao tác →
                          </div>
                        </div>
                      );

                      return (
                        <React.Fragment key={slot.id}>
                          {/* Inject a structural concrete pillar every 5 slots for realistic parking look */}
                          {sIdx > 0 && sIdx % 5 === 0 && (
                            <div className="hidden lg:flex flex-col items-center justify-center p-1 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 select-none">
                              <span className="text-[9px] font-mono font-bold">C-{Math.floor(sIdx / 5)}</span>
                              <span className="text-[8px] text-slate-500">CỘT</span>
                            </div>
                          )}

                          <Tooltip content={tooltipContent} delay={150}>
                            <button
                              onClick={() => onSelectSlot(slot)}
                              className={cn(
                                'group relative flex flex-col items-center justify-between p-2 rounded-lg border-2 transition-all duration-150 text-left min-h-[96px] w-full cursor-pointer',
                                config.bg,
                                isSelected && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 border-emerald-400 shadow-xl scale-105 z-20',
                                isHighlighted && 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse z-30'
                              )}
                              aria-label={`Ô đỗ ${slot.code} - ${config.badge}`}
                            >
                              {/* Top code & status dot */}
                              <div className="w-full flex items-center justify-between">
                                <span className="text-xs font-mono font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                                  {slot.code}
                                </span>
                                <span className={cn('w-2 h-2 rounded-full ring-2', config.dot)} />
                              </div>

                              {/* Center Vehicle Graphic Icon */}
                              <div className="my-1 p-1 rounded bg-black/40 text-slate-200 group-hover:scale-110 transition-transform">
                                {getVehicleIcon(slot.type, isOccupied)}
                              </div>

                              {/* Bottom Status text */}
                              <div className="w-full text-center">
                                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase block truncate', config.badgeBg)}>
                                  {config.badge}
                                </span>
                              </div>

                              {/* Active assigned plate hint if manager or own slot */}
                              {slot.assignments?.[0]?.vehicle?.licensePlate && (
                                <div className="mt-1 text-[8px] font-mono text-emerald-300 truncate max-w-full font-bold">
                                  {slot.assignments[0].vehicle.licensePlate}
                                </div>
                              )}
                            </button>
                          </Tooltip>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Central Driving Lane after the first zone */}
                  {groupIdx === 0 && slotsGroupedByZone.length > 1 && (
                    <div className="relative my-4 py-6 bg-slate-950 rounded-xl border border-dashed border-slate-700/80 flex items-center justify-around overflow-hidden shadow-inner">
                      {/* Driving Direction Arrows */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-amber-400/40" />

                      <div className="flex items-center gap-2 text-slate-400 font-mono text-xs z-10 bg-slate-950 px-3 py-1 rounded">
                        <ArrowDown className="w-4 h-4 text-emerald-400 animate-bounce" />
                        <span>LÀN XE VÀO (TỐC ĐỘ TỐI ĐA 15 KM/H)</span>
                      </div>

                      <div className="flex items-center gap-3 z-10 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Trạm sạc nhanh EV 60kW sẵn sàng</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 font-mono text-xs z-10 bg-slate-950 px-3 py-1 rounded">
                        <span>LÀN XE RA</span>
                        <ArrowUp className="w-4 h-4 text-rose-400 animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ParkingLotMap;
