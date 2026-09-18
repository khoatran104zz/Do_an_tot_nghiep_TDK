'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  ShieldCheck,
  Receipt,
  TrendingUp,
  AlertTriangle,
  History,
  ArrowRight,
  ExternalLink,
  Layers,
  KeyRound,
  DollarSign,
  Activity,
  Crown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useAdminDashboard } from '@/hooks/use-dashboard';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function AdminDashboardView() {
  const { data: response, isLoading, isError, refetch } = useAdminDashboard();
  const data = response?.data;
  const kpis = data?.kpis;
  const crossBuildingStats = data?.crossBuildingStats || [];
  const recentAuditLogs = data?.recentAuditLogs || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-64" />
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
          Không thể tải dữ liệu Bảng điều khiển Quản trị viên
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Thử lại
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              Trung Tâm Điều Hành Hệ Thống (Super Admin)
            </h1>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold border-purple-200">
              Quyền Hạn Cao Nhất • Toàn Hệ Thống
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quyền quản trị tối cao: Quản lý danh mục tòa nhà, chỉ định & phân quyền Managers, cấu hình biểu phí chuẩn, kiểm soát toàn diện mọi căn hộ, cư dân, hợp đồng và tài chính.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings/access-control">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300">
              <KeyRound className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              Phân quyền & Managers
            </Button>
          </Link>
          <Link href="/fees">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold hover:bg-[#E8F5ED] hover:text-[#0F6B4F]">
              <Receipt className="h-3.5 w-3.5 mr-1.5 text-[#0F6B4F]" />
              Biểu phí Hệ thống
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" className="bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white rounded-xl text-xs font-bold shadow-xs">
              Báo cáo Toàn Hệ thống
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Buildings */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục Bất động sản</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  <AnimatedNumber value={kpis.totalBuildings} />
                </span>
                <span className="text-xs text-slate-500 font-semibold">Tòa nhà</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tổng số: <strong className="text-slate-700 dark:text-slate-300">{kpis.totalApartments}</strong> căn hộ
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Managers & Staff */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhân sự & Quản lý</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                  <AnimatedNumber value={kpis.totalManagers} />
                </span>
                <span className="text-xs text-slate-500 font-semibold">Managers</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Đội ngũ vận hành: <strong className="text-slate-700 dark:text-slate-300">{kpis.totalStaff}</strong> nhân sự
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Occupancy & Residents */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tỷ lệ Lấp đầy Toàn sàn</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {kpis.globalOccupancyRate}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">Đang ở</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tổng cư dân: <strong className="text-slate-700 dark:text-slate-300">{kpis.totalResidents}</strong> người
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Financial Overview */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh thu Thu được</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 truncate">
                  {formatCurrency(kpis.totalRevenue)}
                </span>
              </div>
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                Công nợ tồn: {formatCurrency(kpis.outstandingDebt)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Building Performance Comparison Table */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hiệu suất Vận hành Từng Tòa nhà (Cross-Property Comparison)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Thống kê số lượng căn hộ, tỷ lệ lấp đầy, người quản lý và công nợ thực tế của từng dự án.
              </CardDescription>
            </div>
            <Link href="/apartments">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                Xem chi tiết căn hộ <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tòa nhà</th>
                  <th className="px-4 py-3">Mã & Địa chỉ</th>
                  <th className="px-4 py-3">Quản lý phụ trách (Managers)</th>
                  <th className="px-4 py-3 text-center">Tổng căn hộ</th>
                  <th className="px-4 py-3 text-center">Đang ở</th>
                  <th className="px-4 py-3 text-center">Tỷ lệ lấp đầy</th>
                  <th className="px-4 py-3 text-right">Công nợ tồn đọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {crossBuildingStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu tòa nhà
                    </td>
                  </tr>
                ) : (
                  crossBuildingStats.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span>{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{b.code}</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{b.address || 'Chưa cập nhật địa chỉ'}</p>
                      </td>
                      <td className="px-4 py-3">
                        {b.managers.length === 0 ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[10px]">
                            Chưa gán Manager
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {b.managers.map((mgr: any) => (
                              <Badge
                                key={mgr.id}
                                className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold border-purple-200 text-[10px]"
                              >
                                {mgr.fullName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {b.totalApartments}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-600">
                        {b.occupiedApartments}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {b.occupancyRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(b.outstandingDebt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Activity & Audit Log Summary */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Nhật ký Hoạt động Hệ thống Gần nhất</CardTitle>
            </div>
            <Link href="/settings/access-control">
              <span className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer">
                Xem toàn bộ nhật ký kiểm toán
              </span>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentAuditLogs.map((log: any) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                    {log.action.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      <span className="font-mono text-blue-600 font-bold">{log.action}</span> trên đối tượng <span className="font-mono">{log.entity}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Thực hiện bởi: {log.actorEmail || 'Hệ thống'}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
