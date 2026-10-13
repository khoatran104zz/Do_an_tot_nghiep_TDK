'use client';

import React from 'react';
import {
  Building2,
  Layers,
  Home,
  Users,
  Receipt,
  Wrench,
  Plus,
  Edit,
  Trash2,
  MapPin,
  CheckCircle2,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';

interface BuildingDetailCardProps {
  building: any;
  onSelectBlock: (block: any) => void;
  onAddBlock?: (buildingId: string) => void;
  onEditBuilding?: (building: any) => void;
  onDeleteBuilding?: (buildingId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
}

export function BuildingDetailCard({
  building,
  onSelectBlock,
  onAddBlock,
  onEditBuilding,
  onDeleteBuilding,
  onEdit,
  onDelete,
  canManage = true,
}: BuildingDetailCardProps) {
  // Aggregate stats across all blocks and floors
  const blocks = building.blocks || [];
  let totalFloors = 0;
  let totalApartments = 0;
  let occupiedCount = 0;
  let vacantCount = 0;
  let maintenanceCount = 0;
  let totalDebt = 0;
  let openTickets = 0;

  blocks.forEach((blk: any) => {
    (blk.floors || []).forEach((flr: any) => {
      totalFloors++;
      (flr.apartments || []).forEach((apt: any) => {
        totalApartments++;
        if (apt.status === 'OCCUPIED') occupiedCount++;
        else if (apt.status === 'UNDER_MAINTENANCE') maintenanceCount++;
        else vacantCount++;

        if (apt.invoices) {
          apt.invoices.forEach((inv: any) => {
            if (inv.status === 'UNPAID' || inv.status === 'OVERDUE') {
              totalDebt += Number(inv.totalAmount) || 0;
            }
          });
        }

        if (apt.feedbacks) {
          openTickets += apt.feedbacks.filter(
            (f: any) => f.status === 'OPEN' || f.status === 'IN_PROGRESS' || f.status === 'NEW' || f.status === 'PROCESSING'
          ).length;
        }
      });
    });
  });

  const occupancyRate = totalApartments > 0 ? Math.round((occupiedCount / totalApartments) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-emerald-300 rounded-xl">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{building.name}</h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {building.code}
              </Badge>
            </div>
            {building.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                {building.address}
              </p>
            )}
            {building.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{building.description}</p>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onEdit ? onEdit() : onEditBuilding?.(building))}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <Edit className="h-3.5 w-3.5" />
              Sửa Tòa
            </Button>
            {(onDelete || onDeleteBuilding) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => (onDelete ? onDelete() : onDeleteBuilding?.(building.id))}
                className="text-xs gap-1.5 h-8 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </Button>
            )}
            {onAddBlock && (
              <Button
                size="sm"
                onClick={() => onAddBlock(building.id)}
                className="text-xs gap-1.5 h-8 font-semibold bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm Khối Tháp
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khối Tháp</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{blocks.length}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{totalFloors} tầng chức năng</p>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Căn Hộ</span>
            <div className="p-2 bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 text-[#0F6B4F] dark:text-emerald-400 rounded-lg">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{totalApartments}</h3>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
            <TrendingUp className="h-3 w-3" />
            <span>{occupancyRate}% lấp đầy ({occupiedCount} căn)</span>
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
          <p className="text-[11px] text-slate-400 mt-0.5">Hóa đơn chưa thanh toán</p>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sự Cố Kỹ Thuật</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{openTickets}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{maintenanceCount} căn đang bảo trì</p>
        </Card>
      </div>

      {/* Blocks Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#0F6B4F]" />
            Danh Sách Khối Tháp Trực Thuộc ({blocks.length})
          </h3>
          {canManage && onAddBlock && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddBlock?.(building.id)}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Khối Tháp
            </Button>
          )}
        </div>

        {blocks.length === 0 ? (
          <div className="p-8 border border-dashed rounded-2xl text-center bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
            <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Chưa có khối tháp nào thuộc tòa nhà này</p>
            <p className="text-xs text-slate-500 mt-1">Bắt đầu bằng việc thêm khối tháp (Tháp A, Tháp B...)</p>
            {canManage && onAddBlock && (
              <Button
                size="sm"
                onClick={() => onAddBlock?.(building.id)}
                className="mt-3 text-xs gap-1.5 bg-[#0F6B4F] text-white hover:bg-[#0c5942] active:bg-[#094634] shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm Khối Tháp Ngay
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {blocks.map((block: any) => {
              const blockFloors = block.floors || [];
              let bAptsCount = 0;
              let bOccupied = 0;

              blockFloors.forEach((f: any) => {
                (f.apartments || []).forEach((a: any) => {
                  bAptsCount++;
                  if (a.status === 'OCCUPIED') bOccupied++;
                });
              });

              const bOccupancy = bAptsCount > 0 ? Math.round((bOccupied / bAptsCount) * 100) : 0;

              return (
                <div
                  key={block.id}
                  onClick={() => onSelectBlock(block)}
                  className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-[#0F6B4F] hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="p-1.5 bg-[#E8F5ED] text-[#0F6B4F] rounded-md">
                          <Layers className="h-4 w-4" />
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#0F6B4F] transition-colors">
                          {block.name}
                        </h4>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] mt-1">
                        {block.code}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {blockFloors.length} tầng
                    </Badge>
                  </div>

                  {/* Occupancy progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Tỷ lệ lấp đầy:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{bOccupancy}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0F6B4F] to-[#22C55E] rounded-full transition-all"
                        style={{ width: `${bOccupancy}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{bOccupied} đang ở</span>
                      <span>{bAptsCount} tổng căn</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <span className="text-xs text-[#0F6B4F] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Xem chi tiết tầng &rarr;
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
