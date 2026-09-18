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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface BuildingDetailCardProps {
  building: any;
  onSelectBlock: (block: any) => void;
  onAddBlock?: (buildingId: string) => void;
  onEditBuilding?: (building: any) => void;
  onDeleteBuilding?: (buildingId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BuildingDetailCard({
  building,
  onSelectBlock,
  onAddBlock,
  onEditBuilding,
  onDeleteBuilding,
  onEdit,
  onDelete,
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
            (f: any) => f.status === 'OPEN' || f.status === 'IN_PROGRESS'
          ).length;
        }
      });
    });
  });

  const occupancyRate = totalApartments > 0 ? Math.round((occupiedCount / totalApartments) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-card rounded-2xl border shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-foreground">{building.name}</h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {building.code}
              </Badge>
            </div>
            {building.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                {building.address}
              </p>
            )}
          </div>
        </div>
        {building.description && (
          <p className="text-xs text-muted-foreground mt-2 max-w-2xl">{building.description}</p>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (onEdit ? onEdit() : onEditBuilding?.(building))}
            className="text-xs gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            Sửa Tòa nhà
          </Button>
          {(onDelete || onDeleteBuilding) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onDelete ? onDelete() : onDeleteBuilding?.(building.id))}
              className="text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </Button>
          )}
          {onAddBlock && (
            <Button
              size="sm"
              onClick={() => onAddBlock(building.id)}
              className="text-xs gap-1.5 bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Khối Tháp
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Khối Tháp (Blocks)</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{blocks.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{totalFloors} tầng lầu</p>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng Căn Hộ</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalApartments}</h3>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>{occupancyRate}% lấp đầy</span>
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
              <p className="text-xs font-medium text-muted-foreground">Công nợ phí chưa thu</p>
              <h3 className="text-lg font-bold mt-1 text-foreground">
                {totalDebt > 0 ? formatCurrency(totalDebt) : '0 đ'}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Hóa đơn quá hạn & chưa nộp</p>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Sự cố kỹ thuật đang mở</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{openTickets}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cần kỹ thuật viên xử lý</p>
            </div>
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocks Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-500" />
            Danh Sách Khối Tháp Trực Thuộc ({blocks.length})
          </h3>
          {onAddBlock && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddBlock?.(building.id)}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm Khối Tháp
            </Button>
          )}
        </div>

        {blocks.length === 0 ? (
          <div className="p-8 border border-dashed rounded-xl text-center bg-card">
            <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Chưa có khối tháp nào thuộc tòa nhà này</p>
            <p className="text-xs text-muted-foreground mt-1">Bắt đầu bằng việc thêm khối tháp (Tháp A, Tháp B...)</p>
            {onAddBlock && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="group bg-card p-4 rounded-xl border hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-md">
                          <Layers className="h-4 w-4" />
                        </span>
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-blue-600 transition-colors">
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
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tỷ lệ lấp đầy:</span>
                      <span className="font-semibold text-foreground">{bOccupancy}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${bOccupancy}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{bOccupied} đang ở</span>
                      <span>{bAptsCount} tổng căn</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-end">
                    <span className="text-xs text-blue-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
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
