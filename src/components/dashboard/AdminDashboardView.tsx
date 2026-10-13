'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Receipt,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  RotateCcw,
  Crown,
  Search,
  CheckCircle2,
  Clock,
  Home,
  Wallet,
  AlertCircle,
  ClipboardList,
  ChevronRight,
  BarChart3,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useAdminDashboard } from '@/hooks/use-dashboard';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

type SortOption = 'OCCUPANCY_DESC' | 'DEBT_DESC' | 'APARTMENTS_DESC' | 'NAME_ASC';

interface BuildingManager {
  id: string;
  fullName: string;
  email: string;
}

interface BuildingStat {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  totalApartments: number;
  occupiedApartments: number;
  occupancyRate: number;
  outstandingDebt: number;
  managers: BuildingManager[];
}

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  actorEmail?: string | null;
  createdAt: string | Date;
}

interface ChartDataItem {
  name: string;
  fullName: string;
  code: string;
  occupancyRate: number;
  totalApartments: number;
  occupiedApartments: number;
  debt: number;
}

export function AdminDashboardView() {
  const { data: response, isLoading, isError, refetch, isFetching } = useAdminDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('OCCUPANCY_DESC');

  const data = response?.data;
  const kpis = data?.kpis;
  const rawBuildings = data?.crossBuildingStats;
  const rawLogs = data?.recentAuditLogs;

  const crossBuildingStats: BuildingStat[] = useMemo(() => {
    return rawBuildings || [];
  }, [rawBuildings]);

  const recentAuditLogs: AuditLogItem[] = useMemo(() => {
    return rawLogs || [];
  }, [rawLogs]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Đã làm mới dữ liệu điều hành toàn hệ thống!');
    } catch {
      toast.error('Không thể làm mới dữ liệu, vui lòng thử lại.');
    }
  };

  // Filter and sort buildings
  const filteredAndSortedBuildings = useMemo(() => {
    let result = [...crossBuildingStats];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (b: BuildingStat) =>
          b.name?.toLowerCase().includes(term) ||
          b.code?.toLowerCase().includes(term) ||
          b.address?.toLowerCase().includes(term)
      );
    }

    result.sort((a: BuildingStat, b: BuildingStat) => {
      switch (sortBy) {
        case 'OCCUPANCY_DESC':
          return (b.occupancyRate || 0) - (a.occupancyRate || 0);
        case 'DEBT_DESC':
          return (b.outstandingDebt || 0) - (a.outstandingDebt || 0);
        case 'APARTMENTS_DESC':
          return (b.totalApartments || 0) - (a.totalApartments || 0);
        case 'NAME_ASC':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [crossBuildingStats, searchTerm, sortBy]);

  // Operational alerts calculated from real domain data
  const unassignedBuildings = useMemo(() => {
    return crossBuildingStats.filter((b: BuildingStat) => !b.managers || b.managers.length === 0);
  }, [crossBuildingStats]);

  // Financial collection rate calculation
  const totalFinancialVolume = (kpis?.totalRevenue || 0) + (kpis?.outstandingDebt || 0);
  const collectionRate =
    totalFinancialVolume > 0
      ? Math.round(((kpis?.totalRevenue || 0) / totalFinancialVolume) * 100)
      : 100;

  // Chart data for Cross-Building Comparison
  const chartData: ChartDataItem[] = useMemo(() => {
    return crossBuildingStats.map((b: BuildingStat) => ({
      name: b.name?.length > 15 ? `${b.name.substring(0, 15)}...` : b.name,
      fullName: b.name,
      code: b.code,
      occupancyRate: b.occupancyRate || 0,
      totalApartments: b.totalApartments || 0,
      occupiedApartments: b.occupiedApartments || 0,
      debt: b.outstandingDebt || 0,
    }));
  }, [crossBuildingStats]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-48" />
          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (isError || !kpis) {
    return (
      <Card className="border-rose-200 dark:border-rose-900/50 p-8 text-center bg-rose-50/30 dark:bg-rose-950/20">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Không thể tải dữ liệu Trung tâm Điều hành Cấp cao
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Đã xảy ra lỗi kết nối với máy chủ quản trị. Vui lòng kiểm tra lại quyền truy cập hoặc làm mới trang.
        </p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
          <RotateCcw className="h-4 w-4" />
          Thử lại
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header & Hierarchy Actions */}
      <div className="space-y-3 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link href="/dashboard" className="hover:text-emerald-700 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span>Quản trị hệ thống</span>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold">
            Trung tâm điều hành cấp cao
          </span>
        </nav>

        {/* Title, Badge & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
                <Crown className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Trung tâm điều hành quản trị cấp cao
              </h1>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold border-purple-200 text-xs">
                Toàn hệ thống • Super Admin
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              Quản lý tập trung hệ thống bất động sản, nhân sự, phân quyền, tài chính và hiệu suất vận hành toàn hệ thống.
            </p>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="rounded-xl text-xs font-semibold gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isFetching ? 'Đang tải...' : 'Làm mới'}</span>
            </Button>

            <Link href="/settings/access-control">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
                Phân quyền & Managers
              </Button>
            </Link>

            <Link href="/fees">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold hover:bg-[#E8F5ED] hover:text-[#0F6B4F] border-emerald-200 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300"
              >
                <Receipt className="h-3.5 w-3.5 mr-1.5 text-[#0F6B4F]" />
                Biểu phí hệ thống
              </Button>
            </Link>

            <Link href="/reports">
              <Button
                size="sm"
                className="bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white rounded-xl text-xs font-bold shadow-xs gap-1.5"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Báo cáo toàn hệ thống</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Global Overview — 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Real Estate Portfolio */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Danh mục Bất động sản
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    <AnimatedNumber value={kpis.totalBuildings} />
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Tòa nhà</span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Quy mô quản lý:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {kpis.totalApartments} căn hộ
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Managers & Personnel */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nhân sự & Quản lý
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                    <AnimatedNumber value={kpis.totalManagers} />
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Managers</span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Đội ngũ vận hành:</span>
              <span className="font-bold text-purple-700 dark:text-purple-300">
                {kpis.totalStaff} nhân sự
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Occupancy Rate */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tỷ lệ lấp đầy toàn sàn
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-[#0F6B4F] dark:text-[#22C55E] tracking-tight">
                    {kpis.globalOccupancyRate}%
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({kpis.occupiedApartments}/{kpis.totalApartments} căn)
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-[#E8F5ED] dark:bg-emerald-950/60 text-[#0F6B4F] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Home className="h-5 w-5" />
              </div>
            </div>

            {/* Occupancy Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0F6B4F] to-[#22C55E] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, kpis.globalOccupancyRate))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Trống: {Math.max(0, kpis.totalApartments - kpis.occupiedApartments)} căn</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {kpis.totalResidents} cư dân
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Financial & Debt Overview */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tài chính & Thu phí
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                    {formatCurrency(kpis.totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Công nợ tồn đọng:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(kpis.outstandingDebt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. System Operational Alerts (Real Domain Signals) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Alert 1: Unassigned Buildings */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            unassignedBuildings.length > 0
              ? 'bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
              : 'bg-emerald-50/50 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {unassignedBuildings.length > 0 ? (
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold">Phân bổ Quản lý Tòa nhà</h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {unassignedBuildings.length > 0
                    ? `Có ${unassignedBuildings.length} tòa nhà chưa gán Manager phụ trách`
                    : '100% tòa nhà đã được phân công Manager'}
                </p>
              </div>
            </div>
            {unassignedBuildings.length > 0 && (
              <Link href="/settings/access-control">
                <Button size="xs" variant="outline" className="text-2xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100">
                  Gán ngay
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Alert 2: Unpaid Invoices */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            kpis.unpaidInvoicesCount > 0
              ? 'bg-rose-50/70 border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
              : 'bg-emerald-50/50 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  kpis.unpaidInvoicesCount > 0
                    ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700'
                }`}
              >
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Hóa đơn quá hạn & Chưa thu</h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {kpis.unpaidInvoicesCount > 0
                    ? `${kpis.unpaidInvoicesCount} hóa đơn đang treo công nợ (${formatCurrency(kpis.outstandingDebt)})`
                    : 'Tất cả hóa đơn đã được thanh toán đầy đủ'}
                </p>
              </div>
            </div>
            {kpis.unpaidInvoicesCount > 0 && (
              <Link href="/invoices">
                <Button size="xs" variant="outline" className="text-2xs font-bold border-rose-300 text-rose-900 hover:bg-rose-100">
                  Xem nợ
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Alert 3: Technical Maintenance Tickets */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            kpis.openTicketsCount > 0
              ? 'bg-blue-50/70 border-blue-200/80 dark:bg-blue-950/30 dark:border-blue-900/60 text-blue-950 dark:text-blue-200'
              : 'bg-emerald-50/50 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  kpis.openTicketsCount > 0
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700'
                }`}
              >
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Sự cố kỹ thuật & Bảo trì</h4>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {kpis.openTicketsCount > 0
                    ? `${kpis.openTicketsCount} phiếu phản ánh/sự cố đang trong quá trình xử lý`
                    : 'Không có sự cố kỹ thuật nào đang mở'}
                </p>
              </div>
            </div>
            {kpis.openTicketsCount > 0 && (
              <Link href="/feedbacks">
                <Button size="xs" variant="outline" className="text-2xs font-bold border-blue-300 text-blue-900 hover:bg-blue-100">
                  Điều phối
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 4. Cross-Building Performance (Core Area) */}
      <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Hiệu suất các tòa nhà
                </CardTitle>
                <Badge variant="outline" className="text-xs font-semibold">
                  {crossBuildingStats.length} dự án
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Theo dõi và so sánh tỷ lệ lấp đầy, người quản lý phụ trách và công nợ thực tế giữa các tòa nhà trong toàn hệ thống.
              </CardDescription>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên, mã tòa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200"
                />
              </div>

              <select
                aria-label="Sắp xếp danh sách tòa nhà"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                <option value="OCCUPANCY_DESC">Tỷ lệ lấp đầy (Cao → Thấp)</option>
                <option value="DEBT_DESC">Công nợ tồn (Nhiều → Ít)</option>
                <option value="APARTMENTS_DESC">Tổng căn hộ (Nhiều → Ít)</option>
                <option value="NAME_ASC">Tên tòa nhà (A → Z)</option>
              </select>

              <Link href="/apartments">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                  Chi tiết căn hộ <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        {/* Visual Chart Comparison */}
        {chartData.length > 0 && (
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Trực quan hóa Tỷ lệ lấp đầy giữa các tòa nhà
              </span>
              <span className="text-2xs text-slate-400">
                Đơn vị: Tỷ lệ lấp đầy (%)
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dataItem = payload[0].payload as ChartDataItem;
                        return (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-lg text-xs space-y-1">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{dataItem.fullName}</p>
                            <p className="text-slate-500 font-mono text-[11px]">Mã: {dataItem.code}</p>
                            <p className="text-emerald-600 font-bold">
                              Tỷ lệ lấp đầy: {dataItem.occupancyRate}% ({dataItem.occupiedApartments}/{dataItem.totalApartments} căn)
                            </p>
                            <p className="text-rose-600 font-semibold">
                              Công nợ tồn: {formatCurrency(dataItem.debt)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="occupancyRate" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {chartData.map((entry: ChartDataItem, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.occupancyRate >= 70 ? '#0F6B4F' : entry.occupancyRate >= 40 ? '#3B82F6' : '#F59E0B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Data Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tòa nhà</th>
                  <th className="px-4 py-3">Mã & Địa chỉ</th>
                  <th className="px-4 py-3">Quản lý phụ trách (Managers)</th>
                  <th className="px-4 py-3 text-center">Tổng căn</th>
                  <th className="px-4 py-3 text-center">Đang ở</th>
                  <th className="px-4 py-3 text-left w-48">Tỷ lệ lấp đầy</th>
                  <th className="px-4 py-3 text-right">Công nợ tồn đọng</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSortedBuildings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-6 w-6 text-slate-300" />
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {searchTerm ? `Không tìm thấy tòa nhà phù hợp với "${searchTerm}"` : 'Chưa có dữ liệu tòa nhà'}
                        </span>
                        {searchTerm && (
                          <Button size="xs" variant="ghost" onClick={() => setSearchTerm('')}>
                            Xóa bộ lọc tìm kiếm
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedBuildings.map((b: BuildingStat) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0F6B4F] flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{b.code}</span>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={b.address || ''}>
                          {b.address || 'Chưa cập nhật địa chỉ'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        {!b.managers || b.managers.length === 0 ? (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/50 text-[10px] font-semibold">
                            Chưa gán Manager
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {b.managers.map((mgr: BuildingManager) => (
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
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                        {b.totalApartments}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-emerald-700 dark:text-emerald-400">
                        {b.occupiedApartments}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{b.occupancyRate}%</span>
                            <span className="text-slate-400 text-2xs">{b.occupiedApartments}/{b.totalApartments}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, b.occupancyRate))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold">
                        <span className={b.outstandingDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                          {formatCurrency(b.outstandingDebt)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Link href={`/apartments?building=${encodeURIComponent(b.id)}`}>
                          <Button size="xs" variant="ghost" className="h-7 text-xs text-slate-600 hover:text-[#0F6B4F]">
                            Chi tiết
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Financial Overview & System Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Financial Collection Bar & Status (1 Column) */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tỷ lệ thu phí toàn hệ thống
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Tương quan giữa doanh thu thực thu và công nợ còn tồn
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {collectionRate}%
                </span>
                <p className="text-xs text-slate-500 mt-0.5">Tỷ lệ thu hồi tổng</p>
              </div>
              <Badge
                className={
                  collectionRate >= 80
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }
              >
                {collectionRate >= 80 ? 'Vận hành tốt' : 'Cần đôn đốc nợ'}
              </Badge>
            </div>

            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }}
              />
            </div>

            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Doanh thu đã thu:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(kpis.totalRevenue)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Công nợ tồn đọng:
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(kpis.outstandingDebt)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/invoices">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1">
                  <span>Quản lý danh sách hóa đơn</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Activity & Audit Log (2 Columns) */}
        <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Nhật ký hoạt động hệ thống gần nhất
                </CardTitle>
              </div>
              <Link href="/settings/access-control">
                <span className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold cursor-pointer">
                  Quản lý quyền & tài khoản
                </span>
              </Link>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Nhật ký kiểm toán ghi nhận các thay đổi cấu hình, phân quyền và dữ liệu vận hành.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {recentAuditLogs.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-1">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Chưa có nhật ký hoạt động gần đây
                </h5>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  Các thao tác thay đổi phân quyền, cập nhật cấu hình hoặc giao dịch hệ thống sẽ được ghi nhận tự động tại đây khi phát sinh.
                </p>
                <Button size="xs" variant="ghost" onClick={handleRefresh} className="mt-2 text-xs gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Làm mới kiểm tra
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAuditLogs.map((log: AuditLogItem) => {
                  const isCreate = log.action?.includes('CREATE');
                  const isUpdate = log.action?.includes('UPDATE') || log.action?.includes('ASSIGN');
                  const isDelete = log.action?.includes('DELETE') || log.action?.includes('REMOVE');

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 px-5 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isCreate
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDelete
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isUpdate
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {log.action?.substring(0, 2) || 'LOG'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            <span className="font-mono text-purple-700 dark:text-purple-300 font-bold mr-1">
                              {log.action}
                            </span>
                            <span className="text-slate-500 font-normal">trên</span>{' '}
                            <span className="font-medium text-slate-800 dark:text-slate-200">{log.entity}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            Thực hiện bởi: <strong className="text-slate-600 dark:text-slate-300 font-medium">{log.actorEmail || 'Hệ thống'}</strong>
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0 pl-3">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
