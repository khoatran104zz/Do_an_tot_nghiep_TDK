'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAssets, useAssetStats } from '@/hooks/use-assets';
import { AssetCategory, AssetStatus } from '@prisma/client';
import {
  ASSET_CATEGORY_LABELS,
  ASSET_STATUS_BADGE,
} from '@/modules/asset/asset.constants';
import { CreateAssetModal } from '@/components/asset/CreateAssetModal';
import { CreateScheduleModal } from '@/components/asset/CreateScheduleModal';
import { useBuildingContext } from '@/context/BuildingContext';

export default function AssetsManagementPage() {
  const { selectedBuildingId } = useBuildingContext();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | ''>('');

  const [isCreateAssetOpen, setIsCreateAssetOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [schedulePreselectedAssetId, setSchedulePreselectedAssetId] = useState<string | undefined>();

  // Fetch stats & assets list
  const { data: statsData, isLoading: isStatsLoading } = useAssetStats(
    selectedBuildingId || undefined
  );
  const { data: assetsData, isLoading: isAssetsLoading } = useAssets({
    search: search || undefined,
    buildingId: selectedBuildingId || undefined,
    category: selectedCategory || undefined,
    status: selectedStatus || undefined,
    limit: 50,
  });

  const stats = statsData?.data || {
    totalAssets: 0,
    operationalCount: 0,
    maintenanceCount: 0,
    brokenCount: 0,
    upcomingMaintenanceCount: 0,
    overdueMaintenanceCount: 0,
  };

  const assetsList = assetsData?.data || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Tài sản & Thiết bị Tòa nhà
            </h1>
            <Badge variant="outline" className="font-semibold text-blue-700 bg-blue-50 border-blue-200">
              Building Assets & PM
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tình trạng vận hành, hồ sơ kỹ thuật và kế hoạch bảo trì phòng ngừa định kỳ.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/maintenance-schedule">
            <Button variant="outline" className="gap-2 border-slate-300">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>Xem Lịch bảo trì PM</span>
            </Button>
          </Link>
          <Button
            onClick={() => setIsCreateAssetOpen(true)}
            className="gap-2 bg-[#0F6B4F] hover:bg-[#0c5942] text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm thiết bị mới</span>
          </Button>
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng thiết bị</span>
            <div className="p-1.5 rounded-lg bg-[#E8F5ED] text-[#0F6B4F]">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {isStatsLoading ? '...' : stats.totalAssets}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tài sản kỹ thuật</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Hoạt động tốt</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">
            {isStatsLoading ? '...' : stats.operationalCount}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Sẵn sàng vận hành</p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Đang bảo trì</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-800">
            {isStatsLoading ? '...' : stats.maintenanceCount}
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5">Đang xử lý kỹ thuật</p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-700">Hỏng hóc</span>
            <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-800">
            {isStatsLoading ? '...' : stats.brokenCount}
          </div>
          <p className="text-[11px] text-red-600 mt-0.5">Cần thay thế/sửa</p>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-700">Sắp đến hạn</span>
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-800">
            {isStatsLoading ? '...' : stats.upcomingMaintenanceCount}
          </div>
          <p className="text-[11px] text-sky-600 mt-0.5">Trong 3 ngày tới</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-800">Quá hạn bảo trì</span>
            <div className="p-1.5 rounded-lg bg-rose-200 text-rose-700 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-900">
            {isStatsLoading ? '...' : stats.overdueMaintenanceCount}
          </div>
          <p className="text-[11px] text-rose-700 mt-0.5 font-medium">Báo động đỏ</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo mã tài sản, tên thiết bị, vị trí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="h-3.5 w-3.5" />
              <span>Lọc:</span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AssetCategory | '')}
              className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B4F] font-medium"
            >
              <option value="">-- Tất cả danh mục --</option>
              {Object.entries(ASSET_CATEGORY_LABELS).map(([cat, label]) => (
                <option key={cat} value={cat}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AssetStatus | '')}
              className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B4F] font-medium"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="OPERATIONAL">Hoạt động tốt</option>
              <option value="MAINTENANCE">Đang bảo trì</option>
              <option value="BROKEN">Hỏng hóc</option>
              <option value="RETIRED">Ngừng sử dụng</option>
            </select>

            {(search || selectedCategory || selectedStatus) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            Danh mục Thiết bị & Tình trạng Kỹ thuật ({assetsList.length})
          </h3>
          <span className="text-xs text-slate-500">
            Hiển thị tối đa 50 thiết bị trên trang
          </span>
        </div>

        {isAssetsLoading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Đang tải dữ liệu thiết bị...
          </div>
        ) : assetsList.length === 0 ? (
          <div className="py-16 text-center">
            <Boxes className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Không tìm thấy thiết bị nào phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">
              Thử thay đổi bộ lọc hoặc thêm tài sản mới vào hệ thống.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Mã tài sản</th>
                  <th className="py-3 px-4">Tên thiết bị & Danh mục</th>
                  <th className="py-3 px-4">Vị trí lắp đặt</th>
                  <th className="py-3 px-4">Nhà cung cấp</th>
                  <th className="py-3 px-4">Kế hoạch PM kế tiếp</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {assetsList.map((asset: any) => {
                  const badge = ASSET_STATUS_BADGE[asset.status as AssetStatus] || {
                    variant: 'secondary',
                    label: asset.status,
                  };

                  const nextSchedule = asset.maintenanceSchedules?.[0];

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {asset.code}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{asset.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {ASSET_CATEGORY_LABELS[asset.category as AssetCategory] || asset.category}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium">{asset.location}</div>
                        {asset.building && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Layers className="h-3 w-3 text-slate-400" />
                            {asset.building.name}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {asset.supplier || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {nextSchedule ? (
                          <div>
                            <div className="font-medium text-slate-900">
                              {new Date(nextSchedule.nextMaintenance).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {nextSchedule.title}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có lịch PM</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={badge.variant} dot>
                          {badge.label}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSchedulePreselectedAssetId(asset.id);
                              setIsCreateScheduleOpen(true);
                            }}
                            className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            title="Lập kế hoạch bảo dưỡng định kỳ"
                          >
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Lập lịch PM
                          </Button>

                          <Link href={`/assets/${asset.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1 border-slate-200 hover:bg-slate-100"
                            >
                              Chi tiết
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal create asset */}
      <CreateAssetModal
        open={isCreateAssetOpen}
        onOpenChange={setIsCreateAssetOpen}
      />

      {/* Modal create schedule */}
      <CreateScheduleModal
        open={isCreateScheduleOpen}
        onOpenChange={setIsCreateScheduleOpen}
        preselectedAssetId={schedulePreselectedAssetId}
        assets={assetsList.map((a: any) => ({ id: a.id, name: a.name, code: a.code }))}
      />
    </div>
  );
}
