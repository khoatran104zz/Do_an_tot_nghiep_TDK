'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Receipt,
  Wrench,
  UserCheck,
  Package,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Plus,
  QrCode,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useManagerScopedDashboard } from '@/hooks/use-dashboard';
import { useBuildingContext } from '@/context/BuildingContext';
import { BuildingSwitcher } from '@/components/layout/BuildingSwitcher';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export function ManagerDashboardView() {
  const { selectedBuildingId } = useBuildingContext();
  const { data: response, isLoading, isError, refetch } = useManagerScopedDashboard(selectedBuildingId);

  const data = response?.data;
  const building = data?.building;
  const kpis = data?.kpis;
  const criticalTickets = data?.criticalTickets || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !kpis) {
    return (
      <Card className="border-rose-200 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Không thể tải dữ liệu Vận hành Tòa nhà
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {data?.message || 'Vui lòng kiểm tra quyền phân công tòa nhà hoặc thử lại.'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Thử lại
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Context Banner: Active Building */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#094634] via-[#0F6B4F] to-[#0c5942] text-white shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                {building?.name || 'Tòa nhà quản lý'}
              </h1>
              <Badge className="bg-emerald-500/30 text-emerald-100 font-mono text-[10px] border border-emerald-400/30">
                {building?.code || 'SMART-BUILDING'}
              </Badge>
              <Badge className="bg-amber-400/20 text-amber-200 font-semibold text-[10px] border border-amber-400/30">
                Phạm vi Vận hành Tòa nhà
              </Badge>
            </div>
            <p className="text-xs text-emerald-100/80 mt-1">
              {building?.address || 'Địa chỉ tòa nhà đang quản lý vận hành'} • Bàn làm việc Ban Quản Lý trực thuộc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-1">
            <BuildingSwitcher />
          </div>
        </div>
      </div>

      {/* 4 Core Building KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Occupancy */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Tỷ lệ Lấp đầy</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {kpis.occupancyRate}%
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                ({kpis.occupiedApartments}/{kpis.totalApartments} căn)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Còn trống: <strong className="text-slate-700 dark:text-slate-300">{kpis.vacantApartments}</strong> căn • Bảo trì: <strong>{kpis.maintenanceApartments}</strong>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Residents & Contracts */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Cư dân & Hợp đồng</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                <AnimatedNumber value={kpis.totalResidents} />
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Cư dân đang ở</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Hợp đồng đang hiệu lực: <strong className="text-blue-600">{kpis.activeContracts}</strong> hợp đồng
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Outstanding Debt */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Công nợ Tồn đọng</span>
              <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2 truncate">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 truncate">
                {formatCurrency(kpis.outstandingDebt)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Chưa thanh toán: <strong className="text-rose-500">{kpis.unpaidInvoicesCount}</strong> hóa đơn
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Tickets & SLA */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Sự cố & Bảo trì</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Wrench className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                <AnimatedNumber value={kpis.openTicketsCount} />
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Đang xử lý</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Ưu tiên khẩn cấp: <strong className="text-rose-600">{criticalTickets.length}</strong> sự cố
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Operational Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Khách đăng ký hôm nay</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{kpis.todayVisitors} lượt</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Bưu kiện chờ nhận tại sảnh</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{kpis.pendingParcels} kiện</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Lịch đặt tiện ích hôm nay</p>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">{kpis.activeBookings} lượt đặt</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical SLA Tickets for this building */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-bold">
                Sự cố Kỹ thuật Cần Xử lý Gấp ({criticalTickets.length})
              </CardTitle>
            </div>
            <Link href="/feedbacks">
              <span className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer">
                Xem tất cả phiếu sự cố
              </span>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {criticalTickets.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Không có sự cố nghiêm trọng cần xử lý ngay tại tòa nhà này.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {criticalTickets.map((t: any) => (
                <div key={t.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-rose-100 text-rose-700 text-[10px] font-bold">
                        {t.priority}
                      </Badge>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{t.title}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Căn hộ: <strong className="text-slate-700 dark:text-slate-300">{t.apartment?.code}</strong> • Người báo: {t.resident?.fullName} ({t.resident?.phone})
                    </p>
                  </div>
                  <Link href={`/feedbacks/${t.id}`}>
                    <Button size="sm" variant="outline" className="text-xs rounded-lg">
                      Xử lý
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Operational Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/apartments">
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#0F6B4F] bg-white dark:bg-slate-900 flex items-center gap-3 transition-colors cursor-pointer group">
            <Building2 className="h-4 w-4 text-[#0F6B4F] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Quản lý Căn hộ</span>
          </div>
        </Link>
        <Link href="/invoices">
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#0F6B4F] bg-white dark:bg-slate-900 flex items-center gap-3 transition-colors cursor-pointer group">
            <Receipt className="h-4 w-4 text-[#0F6B4F] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Hóa đơn & Thu phí</span>
          </div>
        </Link>
        <Link href="/parcels">
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#0F6B4F] bg-white dark:bg-slate-900 flex items-center gap-3 transition-colors cursor-pointer group">
            <Package className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Bưu kiện sảnh</span>
          </div>
        </Link>
        <Link href="/visitors">
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#0F6B4F] bg-white dark:bg-slate-900 flex items-center gap-3 transition-colors cursor-pointer group">
            <UserCheck className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Khách ra vào</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
