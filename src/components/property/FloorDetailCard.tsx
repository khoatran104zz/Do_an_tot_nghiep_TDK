'use client';

import React from 'react';
import Link from 'next/link';
import {
  Hash,
  Home,
  Users,
  Receipt,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Building2,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn, formatCurrency } from '@/lib/utils';

interface FloorDetailCardProps {
  floor: any;
  buildingName?: string;
  blockName?: string;
  parentPath?: any;
  onAddApartment: (floorId: string) => void;
  onEditFloor?: (floor: any) => void;
  onDeleteFloor?: (floorId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelectApartment: (apt: any) => void;
  onNavigateBuilding?: () => void;
  onNavigateBlock?: () => void;
  canManage?: boolean;
}

export function FloorDetailCard({
  floor,
  buildingName,
  blockName,
  parentPath,
  onAddApartment,
  onEditFloor,
  onDeleteFloor,
  onEdit,
  onDelete,
  onSelectApartment,
  onNavigateBuilding,
  onNavigateBlock,
  canManage = true,
}: FloorDetailCardProps) {
  const effectiveBuildingName = buildingName || parentPath?.buildingName || 'Tòa nhà';
  const effectiveBlockName = blockName || parentPath?.blockName || 'Khối tháp';
  const apartments = floor.apartments || [];
  const occupiedCount = apartments.filter((a: any) => a.status === 'OCCUPIED').length;
  const vacantCount = apartments.filter((a: any) => a.status === 'VACANT').length;
  const maintenanceCount = apartments.filter((a: any) => a.status === 'UNDER_MAINTENANCE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 flex-wrap">
            <span
              onClick={onNavigateBuilding}
              className="hover:text-[#0F6B4F] cursor-pointer flex items-center gap-1 font-medium transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {effectiveBuildingName}
            </span>
            <span>/</span>
            <span
              onClick={onNavigateBlock}
              className="hover:text-[#0F6B4F] cursor-pointer flex items-center gap-1 font-medium transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              {effectiveBlockName}
            </span>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{floor.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-emerald-300 rounded-xl">
              <Hash className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{floor.name}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  Tầng {floor.floorNumber}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mặt bằng tầng lầu &bull; {apartments.length} căn hộ thiết lập
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onEdit ? onEdit() : onEditFloor?.(floor))}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <Edit className="h-3.5 w-3.5" />
              Sửa Tầng
            </Button>
            {(onDelete || onDeleteFloor) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => (onDelete ? onDelete() : onDeleteFloor?.(floor.id))}
                className="text-xs gap-1.5 h-8 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onAddApartment(floor.id)}
              className="text-xs gap-1.5 h-8 font-semibold bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Căn Hộ
            </Button>
          </div>
        )}
      </div>

      {/* Mini Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-slate-900 dark:text-slate-100">Tổng số: {apartments.length} căn</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Đang ở ({occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Trống ({vacantCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">Bảo dưỡng ({maintenanceCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1 text-rose-600">
            <Receipt className="h-3.5 w-3.5" /> Nợ phí
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <Wrench className="h-3.5 w-3.5" /> Sự cố
          </span>
        </div>
      </div>

      {/* Interactive Apartment Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Home className="h-4 w-4 text-[#0F6B4F]" />
          Sơ Đồ Mặt Bằng Căn Hộ ({apartments.length})
        </h3>

        {apartments.length === 0 ? (
          <div className="p-8 border border-dashed rounded-2xl text-center bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
            <Home className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tầng này chưa có căn hộ nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Bắt đầu tạo căn hộ đầu tiên trên tầng {floor.floorNumber}
            </p>
            {canManage && (
              <Button
                size="sm"
                onClick={() => onAddApartment(floor.id)}
                className="mt-3 text-xs gap-1.5 bg-[#0F6B4F] text-white hover:bg-[#0c5942] active:bg-[#094634] shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm Căn Hộ Mới
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {apartments.map((apt: any) => {
              const isOccupied = apt.status === 'OCCUPIED';
              const isMaintenance = apt.status === 'UNDER_MAINTENANCE';
              const owner = (apt.residents || []).find((r: any) => r.relationshipToOwner === 'OWNER') || apt.residents?.[0];
              const totalDebt = (apt.invoices || []).reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);
              const openTickets = (apt.feedbacks || []).length;

              return (
                <div
                  key={apt.id}
                  onClick={() => onSelectApartment(apt)}
                  className={cn(
                    'relative p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group space-y-2 select-none',
                    isOccupied
                      ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-[#0F6B4F]'
                      : isMaintenance
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500'
                      : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-400'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0F6B4F] transition-colors">
                        {apt.code}
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono">{apt.area} m²</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {totalDebt > 0 && (
                        <span
                          className="p-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600"
                          title={`Đang nợ phí: ${formatCurrency(totalDebt)}`}
                        >
                          <Receipt className="h-3 w-3" />
                        </span>
                      )}
                      {openTickets > 0 && (
                        <span
                          className="p-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600"
                          title={`Có ${openTickets} sự cố mở`}
                        >
                          <Wrench className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] truncate text-slate-500">
                      {owner ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{owner.fullName}</span>
                      ) : (
                        <span className="italic">Chưa có chủ hộ</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Users className="h-3 w-3" />
                        {apt.residents?.length || 0} người
                      </span>

                      <StatusBadge type="apartment" status={apt.status} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Link
                      href={`/apartments/${apt.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-semibold text-[#0F6B4F] hover:text-[#0c5942] inline-flex items-center gap-1"
                    >
                      Chi tiết <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
