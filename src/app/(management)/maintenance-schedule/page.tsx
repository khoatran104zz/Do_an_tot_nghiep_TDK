'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  Search,
  Plus,
  Filter,
  User,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useMaintenanceSchedules,
  useAssetStats,
  useAssets,
} from '@/hooks/use-assets';
import { MaintenanceCycle, MaintenanceStatus } from '@prisma/client';
import {
  MAINTENANCE_CYCLE_LABELS,
  MAINTENANCE_STATUS_BADGE,
} from '@/modules/asset/asset.constants';
import { CreateScheduleModal } from '@/components/asset/CreateScheduleModal';
import { CompleteMaintenanceModal } from '@/components/asset/CompleteMaintenanceModal';

export default function MaintenanceSchedulePage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | ''>('');
  const [selectedCycle, setSelectedCycle] = useState<MaintenanceCycle | ''>('');

  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [completeScheduleData, setCompleteScheduleData] = useState<any | null>(null);

  // Fetch KPI metrics, schedules, and assets
  const { data: statsData, isLoading: isStatsLoading } = useAssetStats();
  const { data: schedulesData, isLoading: isSchedulesLoading } = useMaintenanceSchedules({
    status: selectedStatus || undefined,
    cycle: selectedCycle || undefined,
    limit: 50,
  });
  const { data: assetsData } = useAssets({ limit: 100 });

  const stats = statsData?.data || {
    totalAssets: 0,
    operationalCount: 0,
    maintenanceCount: 0,
    brokenCount: 0,
    upcomingMaintenanceCount: 0,
    overdueMaintenanceCount: 0,
  };

  const rawSchedules = schedulesData?.data || [];

  // Filter schedules by client-side search (asset name or title)
  const schedules = rawSchedules.filter((sch: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      sch.title?.toLowerCase().includes(q) ||
      sch.code?.toLowerCase().includes(q) ||
      sch.asset?.name?.toLowerCase().includes(q) ||
      sch.asset?.code?.toLowerCase().includes(q) ||
      sch.technician?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Lịch Bảo trì Phòng ngừa (Preventive Maintenance)
            </h1>
            <Badge variant="outline" className="font-semibold text-indigo-700 bg-indigo-50 border-indigo-200">
              PM Schedules
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kế hoạch bảo dưỡng định kỳ hệ thống kỹ thuật trọng yếu: Thang máy, máy phát điện, trạm bơm, PCCC.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/assets">
            <Button variant="outline" className="gap-2 border-slate-300">
              <Wrench className="h-4 w-4 text-blue-600" />
              <span>Xem Danh mục Tài sản</span>
            </Button>
          </Link>
          <Button
            onClick={() => setIsCreateScheduleOpen(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Lập kế hoạch bảo trì mới</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng thiết bị</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {isStatsLoading ? '...' : stats.totalAssets}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Toàn khu chung cư</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Hoạt động tốt</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">
            {isStatsLoading ? '...' : stats.operationalCount}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">Vận hành chuẩn</p>
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
          <p className="text-[11px] text-amber-600 mt-0.5">Đang xử lý</p>
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
          <p className="text-[11px] text-red-600 mt-0.5">Cần khắc phục</p>
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
          <p className="text-[11px] text-sky-600 mt-0.5">Trong 3 ngày</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-800">Quá hạn bảo trì</span>
            <div className="p-1.5 rounded-lg bg-rose-200 text-rose-700 animate-pulse">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-900">
            {isStatsLoading ? '...' : stats.overdueMaintenanceCount}
          </div>
          <p className="text-[11px] text-rose-700 mt-0.5 font-bold">Cảnh báo đỏ</p>
        </div>
      </div>

      {/* Critical Alerts Banner if overdue items exist */}
      {stats.overdueMaintenanceCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">
                Phát hiện {stats.overdueMaintenanceCount} lịch bảo trì kỹ thuật đã QUÁ HẠN!
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Hệ thống cảnh báo thông minh (Smart Alert) đã kích hoạt cảnh báo đỏ. Kỹ thuật viên cần kiểm tra và nghiệm thu ngay.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setSelectedStatus('OVERDUE')}
            className="bg-red-600 hover:bg-red-700 text-white text-xs shrink-0"
          >
            Lọc lịch quá hạn
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo tên kế hoạch, mã lịch, tên thiết bị, kỹ thuật viên..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as MaintenanceStatus | '')}
              className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="PENDING">Đang chờ</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="OVERDUE">Quá hạn bảo trì</option>
            </select>

            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value as MaintenanceCycle | '')}
              className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Tất cả chu kỳ --</option>
              {Object.entries(MAINTENANCE_CYCLE_LABELS).map(([cyc, label]) => (
                <option key={cyc} value={cyc}>
                  {label}
                </option>
              ))}
            </select>

            {(search || selectedStatus || selectedCycle) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedStatus('');
                  setSelectedCycle('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            Danh sách Kế hoạch Bảo trì ({schedules.length})
          </h3>
          <span className="text-xs text-slate-500">
            Chu kỳ kiểm tra phòng ngừa định kỳ
          </span>
        </div>

        {isSchedulesLoading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Đang tải kế hoạch bảo trì...
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Không có kế hoạch bảo trì nào</p>
            <p className="text-xs text-slate-400 mt-1">
              Nhấn "Lập kế hoạch bảo trì mới" để tạo chu kỳ kiểm tra thiết bị.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Mã lịch</th>
                  <th className="py-3 px-4">Hạng mục & Thiết bị</th>
                  <th className="py-3 px-4">Chu kỳ</th>
                  <th className="py-3 px-4">Kế hoạch tiếp theo</th>
                  <th className="py-3 px-4">Kỹ thuật viên / Đơn vị thầu</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {schedules.map((sch: any) => {
                  const isOverdue =
                    new Date(sch.nextMaintenance) < new Date() && sch.status !== 'COMPLETED';

                  const badge = MAINTENANCE_STATUS_BADGE[sch.status as MaintenanceStatus] || {
                    variant: 'info',
                    label: sch.status,
                  };

                  return (
                    <tr
                      key={sch.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {sch.code}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{sch.title}</div>
                        {sch.asset && (
                          <Link
                            href={`/assets/${sch.asset.id}`}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Wrench className="h-3 w-3 text-slate-400" />
                            [{sch.asset.code}] {sch.asset.name}
                          </Link>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {MAINTENANCE_CYCLE_LABELS[sch.cycle as MaintenanceCycle] || sch.cycle}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div
                          className={`font-semibold ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-900'
                          }`}
                        >
                          {new Date(sch.nextMaintenance).toLocaleDateString('vi-VN')}
                        </div>
                        {isOverdue ? (
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                            Quá hạn bảo trì
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Gần nhất: {sch.lastMaintenance ? new Date(sch.lastMaintenance).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium">
                          {sch.technician?.name ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              {sch.technician.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </div>
                        {sch.vendor && (
                          <div className="text-[11px] text-slate-500">Thầu: {sch.vendor}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={isOverdue ? 'destructive' : badge.variant} dot>
                          {isOverdue ? 'Quá hạn' : badge.label}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setCompleteScheduleData(sch)}
                          className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Hoàn thành
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal create schedule */}
      <CreateScheduleModal
        open={isCreateScheduleOpen}
        onOpenChange={setIsCreateScheduleOpen}
        assets={assetsData?.data?.map((a: any) => ({ id: a.id, name: a.name, code: a.code }))}
      />

      {/* Modal complete schedule */}
      <CompleteMaintenanceModal
        open={!!completeScheduleData}
        onOpenChange={(open) => !open && setCompleteScheduleData(null)}
        schedule={completeScheduleData}
      />
    </div>
  );
}
