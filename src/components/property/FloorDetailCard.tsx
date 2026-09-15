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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 flex-wrap">
            <span
              onClick={onNavigateBuilding}
              className="hover:text-foreground cursor-pointer flex items-center gap-1 font-medium text-blue-600"
            >
              <Building2 className="h-3 w-3" />
              {effectiveBuildingName}
            </span>
            <span>/</span>
            <span
              onClick={onNavigateBlock}
              className="hover:text-foreground cursor-pointer flex items-center gap-1 font-medium text-blue-600"
            >
              <Layers className="h-3 w-3" />
              {effectiveBlockName}
            </span>
            <span>/</span>
            <span className="font-semibold text-foreground">{floor.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <Hash className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{floor.name}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  Tầng {floor.floorNumber}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mặt bằng tầng lầu &bull; {apartments.length} căn hộ thiết lập
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (onEdit ? onEdit() : onEditFloor?.(floor))}
            className="text-xs gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            Sửa Tầng
          </Button>
          {(onDelete || onDeleteFloor) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onDelete ? onDelete() : onDeleteFloor?.(floor.id))}
              className="text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onAddApartment(floor.id)}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm Căn Hộ Trên Tầng Này
          </Button>
        </div>
      </div>

      {/* Mini Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/40 rounded-xl border">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-foreground">Tổng số: {apartments.length} căn</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-muted-foreground">Đang ở ({occupiedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            <span className="text-muted-foreground">Đang trống ({vacantCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-muted-foreground">Bảo dưỡng ({maintenanceCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-red-500">
            <Receipt className="h-3.5 w-3.5" /> Nợ phí
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            <Wrench className="h-3.5 w-3.5" /> Sự cố
          </span>
        </div>
      </div>

      {/* Interactive Apartment Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          Sơ Đồ Mặt Bằng Căn Hộ
        </h3>

        {apartments.length === 0 ? (
          <div className="p-8 border border-dashed rounded-xl text-center bg-card">
            <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Tầng này chưa có căn hộ nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Bắt đầu tạo căn hộ đầu tiên trên tầng {floor.floorNumber}
            </p>
            <Button
              size="sm"
              onClick={() => onAddApartment(floor.id)}
              className="mt-3 text-xs gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Căn Hộ Mới
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {apartments.map((apt: any) => {
              const isOccupied = apt.status === 'OCCUPIED';
              const isMaintenance = apt.status === 'UNDER_MAINTENANCE';
              const owner = (apt.residents || []).find((r: any) => r.relationshipToOwner === 'OWNER') || apt.residents?.[0];
              const totalDebt = (apt.invoices || []).reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
              const openTickets = (apt.feedbacks || []).length;

              return (
                <div
                  key={apt.id}
                  onClick={() => onSelectApartment(apt)}
                  className={cn(
                    'relative p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group space-y-2 select-none',
                    isOccupied
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-400'
                      : isMaintenance
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 hover:border-amber-400'
                      : 'bg-card border-border hover:border-blue-400'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-foreground group-hover:text-blue-600 transition-colors">
                        {apt.code}
                      </span>
                      <p className="text-[11px] text-muted-foreground">{apt.area} m²</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {totalDebt > 0 && (
                        <span
                          className="p-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600"
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
                    <div className="text-[11px] truncate text-muted-foreground">
                      {owner ? (
                        <span className="font-medium text-foreground">{owner.fullName}</span>
                      ) : (
                        <span className="italic">Chưa có chủ hộ</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {apt.residents?.length || 0} người
                      </span>
                      <Badge
                        variant={isOccupied ? 'default' : 'secondary'}
                        className={cn(
                          'text-[9px] px-1.5 py-0 h-4 font-normal',
                          isOccupied
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : isMaintenance
                            ? 'bg-amber-600 text-white'
                            : ''
                        )}
                      >
                        {isOccupied ? 'Đang ở' : isMaintenance ? 'Bảo dưỡng' : 'Trống'}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-end">
                    <Link
                      href={`/apartments/${apt.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
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
