'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building2,
  Users,
  Receipt,
  MessageSquareWarning,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  Plus,
  Send,
  Zap,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Activity,
  Flame,
  RotateCcw,
  Bell,
  Car,
  Bike,
  KeyRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/ErrorState';
import { useManagementDashboard } from '@/hooks/use-dashboard';
import { SmartDashboardAlerts, SmartInsightCards } from '@/components/dashboard/smart-operations-cards';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function SmartApartmentOperationsDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  // Selected duration for Revenue Analytics: 6 or 12 months
  const [revenueMonths, setRevenueMonths] = useState<6 | 12>(6);

  // Fetch real aggregated dashboard data from API
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useManagementDashboard(revenueMonths);

  const dashboardData = response?.data;
  const kpis = dashboardData?.kpis;
  const revenueAnalytics = dashboardData?.revenueAnalytics || [];
  const occupancy = dashboardData?.occupancy || {
    total: 0,
    occupied: 0,
    occupiedPercent: 0,
    vacant: 0,
    vacantPercent: 0,
    maintenance: 0,
    maintenancePercent: 0,
  };
  const maintenance = dashboardData?.maintenance || {
    statusDistribution: { NEW: 0, PROCESSING: 0, RESOLVED: 0, REJECTED: 0 },
    priorityDistribution: { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    criticalTickets: [],
  };
  const activityFeed = dashboardData?.activityFeed || [];
  const alerts = dashboardData?.alerts;
  const parking = dashboardData?.parking || {
    totalVehicles: 0,
    cars: 0,
    motorbikes: 0,
    activeParkingCards: 0,
    pendingApprovals: 0,
    estimatedRevenue: 0,
  };

  // Time-based Vietnamese greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[d.getDay()]}, ngày ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  // Occupancy Donut chart data
  const occupancyChartData = useMemo(() => {
    return [
      { name: 'Đang ở', value: occupancy.occupied, fill: '#2563EB', statusKey: 'OCCUPIED' },
      { name: 'Đang trống', value: occupancy.vacant, fill: '#94A3B8', statusKey: 'VACANT' },
      { name: 'Đang sửa chữa', value: occupancy.maintenance, fill: '#F59E0B', statusKey: 'UNDER_MAINTENANCE' },
    ];
  }, [occupancy]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Không thể tải dữ liệu Operations Dashboard"
          message={(error as any)?.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===================================================================
          SECTION 1 — Welcome & Context
          =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {greeting}, {user?.name || 'Trưởng Ban Quản Lý'} 👋
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live System
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{todayFormatted}</span>
            <span>•</span>
            <span>Hệ thống giám sát vận hành thông minh theo thời gian thực</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            {isFetching ? 'Đang đồng bộ...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* Quick Action Management Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs backdrop-blur-xs">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Thao tác nhanh:
        </span>
        <Link href="/apartments">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
            Căn hộ
          </Button>
        </Link>
        <Link href="/residents">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            Cư dân
          </Button>
        </Link>
        <Link href="/invoices">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Receipt className="h-3.5 w-3.5 text-amber-600" />
            Phát sinh Hóa đơn
          </Button>
        </Link>
        <Link href="/feedbacks">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
            <MessageSquareWarning className="h-3.5 w-3.5 text-red-600" />
            Xử lý Sự cố
          </Button>
        </Link>
        <Link href="/notifications">
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Bell className="h-3.5 w-3.5 text-purple-600" />
            Gửi Thông báo
          </Button>
        </Link>
      </div>

      {/* ===================================================================
          SMART OPERATIONS — 5 VIỆC CẦN CHÚ Ý HÔM NAY (Top 5 Prioritized)
          =================================================================== */}
      <SmartDashboardAlerts />


      {/* ===================================================================
          SECTION 2 — Key Performance Indicators (6 Cards)
          =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Apartments */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tổng căn hộ
              </span>
              <Tooltip content={kpis?.totalApartments.description || 'Tổng số căn hộ toàn tòa nhà'}>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              <AnimatedNumber value={kpis?.totalApartments.value || 0} />
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className={kpis?.totalApartments.isPositive ? 'text-emerald-600 font-semibold flex items-center' : 'text-slate-500'}>
                {kpis?.totalApartments.changePercent ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-0.5 inline" />
                    +{kpis.totalApartments.changePercent}%
                  </>
                ) : (
                  'Ổn định'
                )}
              </span>
              <span className="text-slate-400">vs tháng trước</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Occupancy Rate */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tỷ lệ lấp đầy
              </span>
              <Tooltip content={kpis?.occupancyRate.description || 'Tỷ lệ căn hộ đang có cư dân ở'}>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-baseline gap-0.5">
              <AnimatedNumber value={kpis?.occupancyRate.value || 0} decimals={1} />
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {kpis?.occupancyRate.occupiedCount}/{kpis?.occupancyRate.totalApartments} căn
              </span>
              <span className="text-slate-400">đang ở</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Total Residents */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tổng cư dân
              </span>
              <Tooltip content={kpis?.totalResidents.description || 'Số lượng cư dân đang cư trú'}>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-baseline gap-1">
              <AnimatedNumber value={kpis?.totalResidents.value || 0} />
              <span className="text-xs font-normal text-slate-500">người</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className={kpis?.totalResidents.changePercent >= 0 ? 'text-emerald-600 font-semibold flex items-center' : 'text-rose-600 font-semibold flex items-center'}>
                {kpis?.totalResidents.changePercent >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {kpis?.totalResidents.changePercent > 0 ? '+' : ''}
                {kpis?.totalResidents.changePercent}%
              </span>
              <span className="text-slate-400">vs kỳ trước</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Monthly Revenue */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Doanh thu tháng
              </span>
              <Tooltip content={kpis?.monthlyRevenue.description || 'Doanh thu phát hành trong tháng'}>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {formatCurrency(kpis?.monthlyRevenue.value || 0)}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className={kpis?.monthlyRevenue.isPositive ? 'text-emerald-600 font-semibold flex items-center' : 'text-rose-600 font-semibold flex items-center'}>
                {kpis?.monthlyRevenue.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {kpis?.monthlyRevenue.changePercent > 0 ? '+' : ''}
                {kpis?.monthlyRevenue.changePercent}%
              </span>
              <span className="text-slate-400">vs tháng trước</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Outstanding Debt */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Công nợ tồn đọng
              </span>
              <Tooltip content={kpis?.outstandingDebt.description || 'Các hóa đơn chưa thu hoặc quá hạn'}>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
              {formatCurrency(kpis?.outstandingDebt.value || 0)}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className={kpis?.outstandingDebt.isPositive ? 'text-emerald-600 font-semibold flex items-center' : 'text-rose-600 font-semibold flex items-center'}>
                {kpis?.outstandingDebt.changePercent > 0 ? '+' : ''}
                {kpis?.outstandingDebt.changePercent}%
              </span>
              <span className="text-slate-400">vs kỳ trước</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Active Tickets */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ticket đang xử lý
              </span>
              <Tooltip content={kpis?.activeTickets.description || 'Phản ánh mới hoặc đang xử lý'}>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-baseline gap-1">
              <AnimatedNumber value={kpis?.activeTickets.value || 0} />
              <span className="text-xs font-normal text-slate-500">yêu cầu</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {kpis?.activeTickets.resolvedValue || 0} đã xong
              </span>
              <span className="text-slate-400">tổng kỳ</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================
          SMART INSIGHTS — Collection, Occupancy & Ticket Performance
          =================================================================== */}
      <SmartInsightCards />

      {/* ===================================================================
          SECTION 6 — QUICK ACTIONS (RBAC-aware)
          =================================================================== */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs bg-slate-50/50 dark:bg-slate-900/40">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Thao tác nhanh vận hành</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Lối tắt tạo nhanh các đối tượng nghiệp vụ</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/apartments">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 hover:border-blue-500">
                <Plus className="h-3.5 w-3.5" /> Thêm Căn hộ
              </Button>
            </Link>

            <Link href="/residents">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 hover:border-blue-500">
                <Users className="h-3.5 w-3.5" /> Thêm Cư dân
              </Button>
            </Link>

            <Link href="/invoices">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 hover:border-blue-500">
                <Receipt className="h-3.5 w-3.5" /> Phát hành Hóa đơn
              </Button>
            </Link>

            <Link href="/notifications">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 hover:border-blue-500">
                <Send className="h-3.5 w-3.5" /> Đăng Thông báo
              </Button>
            </Link>

            <Link href="/feedbacks">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5">
                <MessageSquareWarning className="h-3.5 w-3.5" /> Xử lý Sự cố
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SECTION 3 & SECTION 4: REVENUE ANALYTICS & OCCUPANCY DONUT
          =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 3 — REVENUE ANALYTICS (Revenue vs Collection) */}
        <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Doanh thu & Tiến độ Thu phí (Revenue vs Collection)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  So sánh dòng tiền tổng phát hành hóa đơn và số tiền thực thu về tài khoản
                </CardDescription>
              </div>

              {/* 6 vs 12 months toggle */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRevenueMonths(6)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    revenueMonths === 6
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  6 Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueMonths(12)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    revenueMonths === 12
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  12 Tháng
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueAnalytics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
                  />
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val)),
                      name === 'billed' ? 'Tổng phát hành' : name === 'collected' ? 'Thực thu' : 'Công nợ',
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    formatter={(value) =>
                      value === 'billed' ? 'Tổng phát hành' : value === 'collected' ? 'Thực thu' : 'Công nợ'
                    }
                  />
                  <Bar dataKey="billed" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="collected" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4 — OCCUPANCY DONUT CHART */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Tỷ lệ Lấp đầy Căn hộ
            </CardTitle>
            <CardDescription className="text-xs">
              Nhấp vào từng nhóm để điều hướng tới danh sách căn hộ
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 flex-1 flex flex-col justify-center">
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    cursor="pointer"
                    onClick={(entry: any) => {
                      if (entry?.statusKey) {
                        router.push(`/apartments?status=${entry.statusKey}`);
                      }
                    }}
                  >
                    {occupancyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [`${val} căn`, 'Số lượng']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center percentage label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {occupancy.occupiedPercent}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Đang ở</span>
              </div>
            </div>

            {/* Interactive Status List */}
            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => router.push('/apartments?status=OCCUPIED')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">
                    Đang ở (Occupied)
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {occupancy.occupied} căn ({occupancy.occupiedPercent}%)
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/apartments?status=VACANT')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">
                    Đang trống (Vacant)
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {occupancy.vacant} căn ({occupancy.vacantPercent}%)
                </div>
              </button>

              <button
                type="button"
                onClick={() => router.push('/apartments?status=UNDER_MAINTENANCE')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-600">
                    Bảo dưỡng (Maintenance)
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {occupancy.maintenance} căn ({occupancy.maintenancePercent}%)
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================
          SECTION 5: MAINTENANCE OPERATIONS & CRITICAL TICKETS
          =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Lifecycle & Priority Status Breakdown */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Phân loại Vận hành Sự cố
            </CardTitle>
            <CardDescription className="text-xs">
              Trạng thái tiếp nhận và mức độ khẩn cấp của các phản ánh
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status Breakdown Pills */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Tiến trình xử lý
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">Mới gửi</span>
                  <span className="text-xl font-bold text-rose-900 dark:text-rose-100">
                    {maintenance.statusDistribution.NEW}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">Đang xử lý</span>
                  <span className="text-xl font-bold text-amber-900 dark:text-amber-100">
                    {maintenance.statusDistribution.PROCESSING}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">Hoàn thành</span>
                  <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    {maintenance.statusDistribution.RESOLVED}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Từ chối</span>
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {maintenance.statusDistribution.REJECTED}
                  </span>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Phân bố mức độ ưu tiên
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-rose-600">
                    <Flame className="h-3.5 w-3.5" /> Khẩn cấp (Urgent)
                  </span>
                  <span className="font-bold">{maintenance.priorityDistribution.URGENT}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" /> Cao (High)
                  </span>
                  <span className="font-bold">{maintenance.priorityDistribution.HIGH}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Trung bình (Medium)</span>
                  <span className="font-bold">{maintenance.priorityDistribution.MEDIUM}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Thấp (Low)</span>
                  <span className="font-bold">{maintenance.priorityDistribution.LOW}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Tickets Action List */}
        <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-rose-600" />
                  Sự cố Khẩn cấp & Cần Ưu tiên (Critical Tickets)
                </CardTitle>
                <CardDescription className="text-xs">
                  Các phản ánh sự cố kỹ thuật có độ ưu tiên cao cần xử lý ngay
                </CardDescription>
              </div>

              <Link href="/feedbacks">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:underline gap-1">
                  Xem tất cả <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="flex-1">
            {maintenance.criticalTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  Tuyệt vời! Không có sự cố khẩn cấp nào tồn đọng
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Tất cả yêu cầu cấp thiết đã được giải quyết</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {maintenance.criticalTickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 p-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                          {t.code}
                        </span>
                        <StatusBadge type="ticketPriority" status={t.priority} />
                        <StatusBadge type="ticketStatus" status={t.status} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t.apartment?.code} ({t.apartment?.building})
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Người gửi: {t.resident?.fullName} • SĐT: {t.resident?.phone}
                      </p>
                    </div>

                    <Link href="/feedbacks">
                      <Button size="sm" variant="outline" className="text-xs h-8 font-semibold shrink-0 gap-1">
                        Xử lý <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================
          SECTION: VEHICLE & PARKING MANAGEMENT WIDGET
          =================================================================== */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Quản lý Phương tiện & Bãi giữ xe (Parking Operations)
                  {parking.pendingApprovals > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full animate-pulse">
                      <Clock className="h-3 w-3" /> {parking.pendingApprovals} xe chờ duyệt
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Tổng hợp phương tiện cư dân, thẻ RFID hầm xe và doanh thu phí gửi xe ước tính
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/parking-cards">
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 hover:border-blue-500">
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" /> Thẻ RFID ({parking.activeParkingCards})
                </Button>
              </Link>
              <Link href="/vehicles">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5">
                  Xem tất cả xe <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Vehicles */}
            <div
              onClick={() => router.push('/vehicles')}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng phương tiện</span>
                <Car className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                <AnimatedNumber value={parking.totalVehicles} />
              </div>
              <span className="text-[11px] text-slate-400">Đăng ký tại các căn hộ</span>
            </div>

            {/* 2. Cars */}
            <div
              onClick={() => router.push('/vehicles?type=CAR')}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ô tô (Cars)</span>
                <span className="h-2 w-2 rounded-full bg-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                <AnimatedNumber value={parking.cars} />
              </div>
              <span className="text-[11px] text-slate-400">Xe đang hoạt động</span>
            </div>

            {/* 3. Motorbikes */}
            <div
              onClick={() => router.push('/vehicles?type=MOTORBIKE')}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Xe máy (Bikes)</span>
                <Bike className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber value={parking.motorbikes} />
              </div>
              <span className="text-[11px] text-slate-400">Xe đang hoạt động</span>
            </div>

            {/* 4. Active Cards */}
            <div
              onClick={() => router.push('/parking-cards?status=ACTIVE')}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Thẻ RFID kích hoạt</span>
                <KeyRound className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                <AnimatedNumber value={parking.activeParkingCards} />
              </div>
              <span className="text-[11px] text-slate-400">Quyền ra vào hầm</span>
            </div>

            {/* 5. Pending Approvals */}
            <div
              onClick={() => router.push('/vehicles?status=PENDING_APPROVAL')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                parking.pendingApprovals > 0
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Chờ duyệt</span>
                <Clock className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                <AnimatedNumber value={parking.pendingApprovals} />
              </div>
              <span className="text-[11px] text-amber-600/90 dark:text-amber-400 font-medium">
                {parking.pendingApprovals > 0 ? 'Cần xử lý ngay →' : 'Đã duyệt hết'}
              </span>
            </div>

            {/* 6. Estimated Revenue */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ước tính phí gửi</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate" title={formatCurrency(parking.estimatedRevenue)}>
                {formatCurrency(parking.estimatedRevenue)}
              </div>
              <span className="text-[11px] text-slate-400">Dự kiến thu hàng tháng</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          SECTION 7: ACTIVITY FEED (Real-time events from DB)
          =================================================================== */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Nhật ký Hoạt động Vận hành (Live Operations Feed)
          </CardTitle>
          <CardDescription className="text-xs">
            Dòng sự kiện ghi nhận giao dịch thanh toán, cập nhật sự cố và thông báo tòa nhà
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activityFeed.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Chưa có sự kiện nào gần đây</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activityFeed.map((act: any) => {
                const isPayment = act.type === 'PAYMENT';
                const isTicket = act.type === 'TICKET';
                return (
                  <div key={act.id} className="py-3 flex items-start gap-3.5">
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isPayment
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isTicket
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isPayment ? (
                        <Receipt className="h-4 w-4" />
                      ) : isTicket ? (
                        <MessageSquareWarning className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {act.title}
                        </p>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {formatDateTime(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {act.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
