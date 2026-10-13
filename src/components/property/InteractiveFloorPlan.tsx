'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Layers,
  Hash,
  Home,
  Users,
  Receipt,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  RotateCcw,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { ApartmentStatus } from '@prisma/client';

interface InteractiveFloorPlanProps {
  apartments: any[];
  hierarchy: any[];
  isLoading?: boolean;
  onInspectApartment: (apt: any) => void;
  onSelectApartment?: (apt: any) => void;
}

export function InteractiveFloorPlan({
  apartments,
  hierarchy,
  isLoading,
  onInspectApartment,
  onSelectApartment,
}: InteractiveFloorPlanProps) {
  // Filters
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('ALL');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('ALL');
  const [selectedFloorNum, setSelectedFloorNum] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique blocks and floors available
  const availableBlocks = useMemo(() => {
    const blocks: { id: string; name: string; buildingId: string }[] = [];
    hierarchy.forEach((b: any) => {
      (b.blocks || []).forEach((blk: any) => {
        blocks.push({ id: blk.id, name: `${blk.name} (${b.name})`, buildingId: b.id });
      });
    });
    return blocks;
  }, [hierarchy]);

  const availableFloors = useMemo(() => {
    const floorNums = new Set<number>();
    apartments.forEach((apt: any) => {
      if (apt.floor) floorNums.add(apt.floor);
    });
    return Array.from(floorNums).sort((a, b) => a - b);
  }, [apartments]);

  // Reset filters
  const handleReset = () => {
    setSelectedBuildingId('ALL');
    setSelectedBlockId('ALL');
    setSelectedFloorNum('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  // Group apartments: Block -> Floor -> Apartments[]
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter apartments
    const matchedApts = apartments.filter((apt: any) => {
      // Building filter
      if (selectedBuildingId !== 'ALL' && apt.buildingId && apt.buildingId !== selectedBuildingId) {
        return false;
      }
      // Block filter
      if (selectedBlockId !== 'ALL' && apt.blockId && apt.blockId !== selectedBlockId) {
        return false;
      }
      // Floor filter
      if (selectedFloorNum !== 'ALL' && apt.floor?.toString() !== selectedFloorNum) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && apt.status !== statusFilter) {
        return false;
      }
      // Search query
      if (query) {
        const matchesCode = apt.code?.toLowerCase().includes(query);
        const matchesOwner = apt.owner?.fullName?.toLowerCase().includes(query);
        const matchesResident = apt.residents?.some((r: any) =>
          r.fullName?.toLowerCase().includes(query)
        );
        if (!matchesCode && !matchesOwner && !matchesResident) {
          return false;
        }
      }
      return true;
    });

    // 2. Group by Block -> Floor
    const groups: Record<
      string,
      {
        blockName: string;
        blockCode: string;
        floors: Record<number, any[]>;
        stats: { total: number; occupied: number; vacant: number; maintenance: number };
      }
    > = {};

    matchedApts.forEach((apt: any) => {
      const bName = apt.building || 'Khối Tháp';
      const bKey = apt.blockId || bName;

      if (!groups[bKey]) {
        groups[bKey] = {
          blockName: bName,
          blockCode: apt.blockCode || bName,
          floors: {},
          stats: { total: 0, occupied: 0, vacant: 0, maintenance: 0 },
        };
      }

      groups[bKey].stats.total += 1;
      if (apt.status === 'OCCUPIED') groups[bKey].stats.occupied += 1;
      else if (apt.status === 'UNDER_MAINTENANCE') groups[bKey].stats.maintenance += 1;
      else groups[bKey].stats.vacant += 1;

      const floorNum = apt.floor || 1;
      if (!groups[bKey].floors[floorNum]) {
        groups[bKey].floors[floorNum] = [];
      }
      groups[bKey].floors[floorNum].push(apt);
    });

    return groups;
  }, [apartments, selectedBuildingId, selectedBlockId, selectedFloorNum, statusFilter, searchQuery]);

  // Overall totals for legend
  const totalInView = useMemo(() => {
    let total = 0;
    let occ = 0;
    let vac = 0;
    let main = 0;
    Object.values(filteredGroups).forEach((g) => {
      total += g.stats.total;
      occ += g.stats.occupied;
      vac += g.stats.vacant;
      main += g.stats.maintenance;
    });
    return { total, occ, vac, main };
  }, [filteredGroups]);

  const hasActiveFilters =
    selectedBuildingId !== 'ALL' ||
    selectedBlockId !== 'ALL' ||
    selectedFloorNum !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchQuery.trim().length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Interactive Toolbar */}
      <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search and filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Tìm mã căn, tên chủ hộ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 h-9 text-xs bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            {/* Building selector */}
            {hierarchy.length > 1 && (
              <div className="w-40">
                <Select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                >
                  <option value="ALL">Tất cả tòa nhà</option>
                  {hierarchy.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Block selector */}
            {availableBlocks.length > 0 && (
              <div className="w-44">
                <Select
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                >
                  <option value="ALL">Tất cả khối / tháp</option>
                  {availableBlocks.map((blk) => (
                    <option key={blk.id} value={blk.id}>
                      {blk.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Floor selector */}
            <div className="w-36">
              <Select
                value={selectedFloorNum}
                onChange={(e) => setSelectedFloorNum(e.target.value)}
                className="h-9 text-xs rounded-xl"
              >
                <option value="ALL">Tất cả tầng</option>
                {availableFloors.map((fl) => (
                  <option key={fl} value={fl.toString()}>
                    Tầng {fl.toString().padStart(2, '0')}
                  </option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs h-9 text-slate-500 hover:text-slate-800 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Đặt lại
              </Button>
            )}
          </div>

          {/* Quick Legend & Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-xl border transition-all cursor-pointer',
                statusFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-2xs font-bold'
                  : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/60'
              )}
            >
              Tất cả ({totalInView.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('OCCUPIED')}
              className={cn(
                'px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5',
                statusFilter === 'OCCUPIED'
                  ? 'bg-[#0F6B4F] text-white border-[#0F6B4F] shadow-2xs font-bold'
                  : 'bg-[#E8F5ED]/50 dark:bg-[#0F6B4F]/10 text-[#0F6B4F] dark:text-emerald-300 border-[#0F6B4F]/20 hover:bg-[#E8F5ED]'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              Đang ở ({totalInView.occ})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('VACANT')}
              className={cn(
                'px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5',
                statusFilter === 'VACANT'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-2xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-200'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Trống ({totalInView.vac})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('UNDER_MAINTENANCE')}
              className={cn(
                'px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5',
                statusFilter === 'UNDER_MAINTENANCE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900 hover:bg-amber-100'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Bảo dưỡng ({totalInView.main})
            </button>
          </div>
        </div>
      </Card>

      {/* Main Floor Plan Grid */}
      {Object.keys(filteredGroups).length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed border-slate-300 dark:border-slate-800">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy căn hộ nào phù hợp
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
          </p>
          <Button size="sm" variant="outline" onClick={handleReset} className="mt-4 text-xs gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Đặt lại tất cả bộ lọc
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredGroups).map(([bKey, bGroup]) => {
            const floorEntries = Object.entries(bGroup.floors).sort(
              ([f1], [f2]) => parseInt(f1) - parseInt(f2)
            );

            return (
              <Card
                key={bKey}
                className="border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs"
              >
                {/* Block Banner Header */}
                <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-[#E8F5ED]/30 to-slate-50 dark:from-slate-900 dark:via-[#0F6B4F]/10 dark:to-slate-900 border-b border-slate-200/90 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#0F6B4F] text-white shadow-sm shadow-[#0F6B4F]/20">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                            {bGroup.blockName}
                          </CardTitle>
                          <Badge variant="outline" className="text-[11px] font-semibold bg-white/80 dark:bg-slate-800 font-mono">
                            {floorEntries.length} Tầng hiển thị
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-0.5">
                          Sơ đồ trực quan mặt bằng phân bổ căn hộ và tình trạng vận hành thực tế
                        </CardDescription>
                      </div>
                    </div>

                    {/* Block Mini Stats */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5ED] text-[#0F6B4F] dark:bg-[#0F6B4F]/20 dark:text-emerald-300 font-semibold border border-[#0F6B4F]/20">
                        <span className="h-2 w-2 rounded-full bg-[#0F6B4F]" />
                        {bGroup.stats.occupied} Đang ở
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold border border-slate-200">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        {bGroup.stats.vacant} Trống
                      </span>
                      {bGroup.stats.maintenance > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold border border-amber-200">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          {bGroup.stats.maintenance} Bảo dưỡng
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Floors content */}
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {floorEntries.map(([floorNum, aptList]) => {
                    const floorOccupied = aptList.filter((a: any) => a.status === 'OCCUPIED').length;
                    const floorRate = aptList.length > 0 ? Math.round((floorOccupied / aptList.length) * 100) : 0;

                    return (
                      <div key={floorNum} className="space-y-3">
                        {/* Floor Row Banner */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                              <Layers className="h-3.5 w-3.5 text-[#0F6B4F]" />
                              Tầng {floorNum.toString().padStart(2, '0')}
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                              ({aptList.length} Căn hộ)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="hidden sm:inline">Lấp đầy:</span>
                            <span className="font-bold text-[#0F6B4F] dark:text-emerald-400 font-mono">
                              {floorRate}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-gradient-to-r from-[#0F6B4F] to-[#22C55E] rounded-full"
                                style={{ width: `${floorRate}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Apartment Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                          {aptList.map((apt: any) => {
                            const isOccupied = apt.status === 'OCCUPIED';
                            const isMaintenance = apt.status === 'UNDER_MAINTENANCE';
                            const hasDebt = apt.unpaidInvoicesCount > 0 || (apt.invoices?.length > 0);
                            const hasTicket = apt.openTicketsCount > 0 || (apt.feedbacks?.length > 0);

                            return (
                              <div
                                key={apt.id}
                                onClick={() => {
                                  onInspectApartment(apt);
                                  onSelectApartment?.(apt);
                                }}
                                className={cn(
                                  'p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-md hover:-translate-y-0.5 select-none relative',
                                  isOccupied
                                    ? 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-[#0F6B4F]'
                                    : isMaintenance
                                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500'
                                    : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800 hover:border-slate-400'
                                )}
                              >
                                {/* Top Unit Code & Status */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-[#0F6B4F] transition-colors">
                                    {apt.code}
                                  </span>
                                  <StatusBadge type="apartment" status={apt.status} />
                                </div>

                                {/* Owner & Resident Info */}
                                <div className="space-y-1 text-xs mb-3">
                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <span>Chủ hộ:</span>
                                    <span
                                      className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]"
                                      title={apt.owner?.fullName}
                                    >
                                      {apt.owner?.fullName || (
                                        <span className="italic font-normal text-slate-400">Chưa có</span>
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <span>Cư dân:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                      <Users className="h-3 w-3 text-slate-400" />
                                      {apt.residentsCount || apt.residents?.length || 0} người
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <span>Quy mô:</span>
                                    <span className="font-mono font-medium">
                                      {apt.bedrooms}PN &bull; {apt.area}m²
                                    </span>
                                  </div>
                                </div>

                                {/* Bottom alerts & actions */}
                                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    {hasDebt ? (
                                      <span
                                        className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded flex items-center gap-1"
                                        title="Chưa hoàn tất thanh toán"
                                      >
                                        <Receipt className="h-3 w-3" /> Nợ phí
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Đã nộp
                                      </span>
                                    )}

                                    {hasTicket && (
                                      <span
                                        className="font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded flex items-center gap-1"
                                        title="Có sự cố kỹ thuật mở"
                                      >
                                        <Wrench className="h-3 w-3" /> Sự cố
                                      </span>
                                    )}
                                  </div>

                                  <Link
                                    href={`/apartments/${apt.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-slate-400 hover:text-[#0F6B4F] rounded-md transition-colors"
                                    title="Mở toàn màn hình chi tiết 360°"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
