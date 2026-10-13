'use client';

import React from 'react';
import {
  Layers,
  Hash,
  Home,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  TrendingUp,
  Receipt,
  Wrench,
  Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';

interface BlockDetailCardProps {
  block: any;
  buildingName?: string;
  parentPath?: any;
  onSelectFloor: (floor: any) => void;
  onAddFloor: (blockId: string) => void;
  onEditBlock?: (block: any) => void;
  onDeleteBlock?: (blockId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigateBuilding?: () => void;
  canManage?: boolean;
}

export function BlockDetailCard({
  block,
  buildingName,
  parentPath,
  onSelectFloor,
  onAddFloor,
  onEditBlock,
  onDeleteBlock,
  onEdit,
  onDelete,
  onNavigateBuilding,
  canManage = true,
}: BlockDetailCardProps) {
  const effectiveBuildingName = buildingName || parentPath?.buildingName || 'Tổ hợp chung cư';
  const floors = block.floors || [];
  let totalApts = 0;
  let occupiedCount = 0;
  let vacantCount = 0;
  let maintenanceCount = 0;
  let totalDebt = 0;
  let openTicketsCount = 0;

  floors.forEach((floor: any) => {
    (floor.apartments || []).forEach((apt: any) => {
      totalApts++;
      if (apt.status === 'OCCUPIED') occupiedCount++;
      else if (apt.status === 'UNDER_MAINTENANCE') maintenanceCount++;
      else vacantCount++;

      if (apt.invoices) {
        totalDebt += apt.invoices.reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);
      }
      if (apt.feedbacks) {
        openTicketsCount += apt.feedbacks.length;
      }
    });
  });

  const occupancyRate = totalApts > 0 ? Math.round((occupiedCount / totalApts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span
              onClick={onNavigateBuilding}
              className="hover:text-[#0F6B4F] cursor-pointer flex items-center gap-1 font-medium transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {effectiveBuildingName}
            </span>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{block.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-emerald-300 rounded-xl">
              <Layers className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{block.name}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {block.code}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy mô: {block.totalFloors || floors.length} tầng thiết kế
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onEdit ? onEdit() : onEditBlock?.(block))}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <Edit className="h-3.5 w-3.5" />
              Sửa Tháp
            </Button>
            {(onDelete || onDeleteBlock) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => (onDelete ? onDelete() : onDeleteBlock?.(block.id))}
                className="text-xs gap-1.5 h-8 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => onAddFloor(block.id)}
              className="text-xs gap-1.5 h-8 font-semibold bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Tầng
            </Button>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số Tầng</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Hash className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{floors.length}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Tầng hoạt động</p>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Căn Hộ</span>
            <div className="p-2 bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-emerald-400 rounded-lg">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{totalApts}</h3>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
            <TrendingUp className="h-3 w-3" />
            <span>{occupancyRate}% ({occupiedCount} căn)</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Công Nợ Phí</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate font-mono">
            {totalDebt > 0 ? formatCurrency(totalDebt) : '0 đ'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Phí chưa thanh toán</p>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sự Cố Kỹ Thuật</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{openTicketsCount}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{maintenanceCount} căn bảo trì</p>
        </Card>
      </div>

      {/* Floors List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Hash className="h-4 w-4 text-[#0F6B4F]" />
            Danh Sách Tầng Thuộc {block.name} ({floors.length})
          </h3>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddFloor(block.id)}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Tầng
            </Button>
          )}
        </div>

        {floors.length === 0 ? (
          <div className="p-8 border border-dashed rounded-2xl text-center bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
            <Hash className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Khối tháp này chưa có tầng lầu nào</p>
            <p className="text-xs text-slate-500 mt-1">Hãy thêm các tầng để bắt đầu quản lý căn hộ</p>
            {canManage && (
              <Button
                size="sm"
                onClick={() => onAddFloor(block.id)}
                className="mt-3 text-xs gap-1.5 bg-[#0F6B4F] text-white hover:bg-[#0c5942] active:bg-[#094634] shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm Tầng Lầu Ngay
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {floors.map((floor: any) => {
              const apts = floor.apartments || [];
              const occupied = apts.filter((a: any) => a.status === 'OCCUPIED').length;
              const rate = apts.length > 0 ? Math.round((occupied / apts.length) * 100) : 0;

              return (
                <div
                  key={floor.id}
                  onClick={() => onSelectFloor(floor)}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-[#0F6B4F] hover:shadow-md transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-[#E8F5ED] text-[#0F6B4F] rounded-lg font-bold text-xs font-mono">
                        T{floor.floorNumber.toString().padStart(2, '0')}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0F6B4F] transition-colors">
                        {floor.name}
                      </h4>
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {apts.length} căn
                    </Badge>
                  </div>

                  {/* Occupancy bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Lấp đầy: {occupied}/{apts.length} căn</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{rate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0F6B4F] to-[#22C55E] rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px]">Tầng {floor.floorNumber}</span>
                    <span className="text-[#0F6B4F] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Xem mặt bằng căn &rarr;
                    </span>
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
