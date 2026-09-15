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
import { formatCurrency } from '@/lib/utils';

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
        totalDebt += apt.invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span
              onClick={onNavigateBuilding}
              className="hover:text-foreground cursor-pointer flex items-center gap-1 font-medium text-blue-600"
            >
              <Building2 className="h-3 w-3" />
              {effectiveBuildingName}
            </span>
            <span>/</span>
            <span className="font-semibold text-foreground">{block.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Layers className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{block.name}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {block.code}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quy mô: {block.totalFloors || floors.length} tầng thiết kế
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (onEdit ? onEdit() : onEditBlock?.(block))}
            className="text-xs gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            Sửa Tháp
          </Button>
          {(onDelete || onDeleteBlock) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onDelete ? onDelete() : onDeleteBlock?.(block.id))}
              className="text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onAddFloor(block.id)}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm Tầng
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Số Tầng Đã Thiết Lập</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{floors.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Tầng hoạt động</p>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Hash className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Căn hộ / Tỷ lệ ở</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalApts}</h3>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>{occupancyRate}% ({occupiedCount} căn)</span>
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Home className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Công nợ phí của Tháp</p>
              <h3 className="text-lg font-bold mt-1 text-foreground">
                {totalDebt > 0 ? formatCurrency(totalDebt) : '0 đ'}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cần thu</p>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Sự cố kỹ thuật mở</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{openTicketsCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{maintenanceCount} căn bảo trì</p>
            </div>
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floors List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Hash className="h-4 w-4 text-indigo-500" />
            Danh Sách Tầng Thuộc {block.name} ({floors.length})
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddFloor(block.id)}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Thêm Tầng
          </Button>
        </div>

        {floors.length === 0 ? (
          <div className="p-8 border border-dashed rounded-xl text-center bg-card">
            <Hash className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Khối tháp này chưa có tầng lầu nào</p>
            <p className="text-xs text-muted-foreground mt-1">Hãy thêm các tầng để bắt đầu quản lý căn hộ</p>
            <Button
              size="sm"
              onClick={() => onAddFloor(block.id)}
              className="mt-3 text-xs gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Tầng Lầu Ngay
            </Button>
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
                  className="group bg-card p-4 rounded-xl border hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-md font-bold text-xs">
                        T{floor.floorNumber}
                      </span>
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-indigo-600 transition-colors">
                        {floor.name}
                      </h4>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {apts.length} căn hộ
                    </Badge>
                  </div>

                  {/* Occupancy bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Lấp đầy: {occupied}/{apts.length} căn</span>
                      <span className="font-semibold text-foreground">{rate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">Tầng {floor.floorNumber}</span>
                    <span className="text-indigo-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
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
