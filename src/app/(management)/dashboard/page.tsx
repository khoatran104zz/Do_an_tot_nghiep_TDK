'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Building2,
  Users,
  Receipt,
  MessageSquareWarning,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  FileText,
  Plus,
  Send,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { useFeedbacks } from '@/hooks/use-feedbacks';
import { useContracts } from '@/hooks/use-contracts';
import { useInvoices } from '@/hooks/use-invoices';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  // Real data fetching
  const { data: statsRes, isLoading: isLoadingStats } = useDashboardStats();
  const { data: urgentFeedbacksRes } = useFeedbacks({ status: 'NEW' as any, limit: 5 });
  const { data: expiringContractsRes } = useContracts({ expiringSoon: true, limit: 5 });
  const { data: overdueInvoicesRes } = useInvoices({ status: 'OVERDUE' as any, limit: 5 });

  const stats = statsRes?.data;
  const overview = stats?.overview || {
    totalApartments: 0,
    occupiedApartments: 0,
    occupancyRate: 0,
    totalResidents: 0,
    activeContracts: 0,
    collectionRate: 0,
    pendingTickets: 0,
  };

  const revenueTrend = stats?.charts?.revenueTrend || [];
  const apartmentStatusChart = stats?.charts?.apartmentStatusChart || [];
  const ticketCategoryChart = stats?.charts?.ticketCategoryChart || [];

  const urgentFeedbacks = urgentFeedbacksRes?.data || [];
  const expiringContracts = expiringContractsRes?.data || [];
  const overdueInvoices = overdueInvoicesRes?.data || [];

  const [activeActionTab, setActiveActionTab] = useState('tickets');

  const actionTabItems = useMemo(
    () => [
      {
        id: 'tickets',
        label: 'Sự cố mới',
        icon: <MessageSquareWarning className="h-3.5 w-3.5" />,
        count: urgentFeedbacks.length,
      },
      {
        id: 'contracts',
        label: 'Hợp đồng hết hạn',
        icon: <FileText className="h-3.5 w-3.5" />,
        count: expiringContracts.length,
      },
      {
        id: 'overdue',
        label: 'Hóa đơn quá hạn',
        icon: <Receipt className="h-3.5 w-3.5" />,
        count: overdueInvoices.length,
      },
    ],
    [urgentFeedbacks.length, expiringContracts.length, overdueInvoices.length]
  );

  // Greeting helper based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const todayFormatted = useMemo(() => {
    const d = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Smart Operational Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Hệ thống trực tuyến
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, {user?.name || 'Ban Quản Lý'} 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Trung tâm điều hành & giám sát vận hành tòa nhà. Theo dõi tức thời tỷ lệ lấp đầy, dòng tiền phí dịch vụ và điều phối xử lý phản ánh cư dân.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/invoices">
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs">
                <Receipt className="h-4 w-4 mr-1.5" />
                Lập hóa đơn
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs">
                <Send className="h-4 w-4 mr-1.5" />
                Đăng thông báo
              </Button>
            </Link>
            <Link href="/feedbacks">
              <Button size="sm" className="bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/30">
                <MessageSquareWarning className="h-4 w-4 mr-1.5" />
                Xử lý sự cố
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Primary Key Performance Indicator Cards with Animated Counter & Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Occupancy Rate */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tỷ lệ lấp đầy
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1">
                  <AnimatedNumber value={overview.occupancyRate} decimals={1} />
                  <span className="text-lg font-bold text-slate-500">%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                <Building2 className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>{overview.occupiedApartments} đang ở</span>
                <span>{overview.totalApartments} tổng căn</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(overview.occupancyRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tình trạng quỹ phòng</span>
              <Badge variant={overview.occupancyRate >= 80 ? 'success' : 'secondary'} size="sm">
                {overview.occupancyRate >= 80 ? 'Tốt (>80%)' : 'Còn trống'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Residents & Contracts */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Cư dân đang sinh sống
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1">
                  <AnimatedNumber value={overview.totalResidents} />
                  <span className="text-sm font-semibold text-slate-500">người</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p className="flex items-center justify-between">
                <span>Hợp đồng có hiệu lực:</span>
                <span className="font-bold text-slate-900">{overview.activeContracts} HĐ</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Căn hộ trung bình:</span>
                <span className="font-bold text-slate-900">
                  {overview.occupiedApartments > 0
                    ? (overview.totalResidents / overview.occupiedApartments).toFixed(1)
                    : 0}{' '}
                  người/căn
                </span>
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Quy mô cư dân</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                Ổn định
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Collection Rate */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tỷ lệ thu phí kỳ này
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1">
                  <AnimatedNumber value={overview.collectionRate} decimals={1} />
                  <span className="text-lg font-bold text-slate-500">%</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Receipt className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Tiến độ thanh toán</span>
                <span>{overview.collectionRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(overview.collectionRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Chỉ tiêu tháng</span>
              <Badge variant={overview.collectionRate >= 90 ? 'success' : 'warning'} size="sm">
                {overview.collectionRate >= 90 ? 'Đạt mục tiêu' : 'Đang thu gom'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Pending Tickets */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sự cố & Yêu cầu hỗ trợ
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-1">
                  <AnimatedNumber value={overview.pendingTickets} />
                  <span className="text-sm font-semibold text-slate-500">chờ xử lý</span>
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  overview.pendingTickets > 0
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}
              >
                {overview.pendingTickets > 0 ? (
                  <MessageSquareWarning className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1 text-xs text-slate-600">
              <p className="flex items-center justify-between">
                <span>Tình trạng phân công:</span>
                <span className="font-bold text-slate-900">
                  {overview.pendingTickets > 0 ? 'Cần kỹ thuật tiếp nhận' : 'Đã hoàn tất'}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span>Độ ưu tiên:</span>
                <span className={overview.pendingTickets > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                  {overview.pendingTickets > 0 ? 'Yêu cầu hành động' : 'Bình thường'}
                </span>
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Hành động</span>
              <Link
                href="/feedbacks"
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
              >
                Xem danh sách <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Action Center (Priority Tasks & Alerts) */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Trung tâm Xử lý Khẩn & Tồn đọng
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Các sự cố kỹ thuật, hợp đồng sắp hết hạn và hóa đơn quá hạn cần ban quản lý lưu ý
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Cập nhật tự động
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <Tabs
            items={actionTabItems}
            activeId={activeActionTab}
            onChange={setActiveActionTab}
            className="mb-5 max-w-xl"
          />

          {/* Tab 1: New Urgent Tickets */}
          {activeActionTab === 'tickets' && (
            <div>
              {urgentFeedbacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {urgentFeedbacks.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={
                                ticket.priority === 'URGENT'
                                  ? 'destructive'
                                  : ticket.priority === 'HIGH'
                                  ? 'warning'
                                  : 'info'
                              }
                              size="sm"
                            >
                              {ticket.priority === 'URGENT'
                                ? 'Khẩn cấp'
                                : ticket.priority === 'HIGH'
                                ? 'Ưu tiên cao'
                                : 'Bình thường'}
                            </Badge>
                            <span className="text-xs font-semibold text-slate-700">
                              {ticket.apartment?.apartmentNumber
                                ? `Phòng ${ticket.apartment.apartmentNumber}`
                                : 'Toàn khu'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>

                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">
                          {ticket.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {ticket.content}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Người gửi: <strong className="text-slate-800">{ticket.resident?.fullName || 'Cư dân'}</strong>
                        </span>
                        <Link href={`/feedbacks?id=${ticket.id}`}>
                          <Button variant="ghost" size="xs" className="text-primary-600 hover:text-primary-700">
                            Tiếp nhận & xử lý <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="Không có sự cố mới cần duyệt"
                  description="Toàn bộ yêu cầu và phản ánh của cư dân đã được tiếp nhận và xử lý kịp thời."
                />
              )}
            </div>
          )}

          {/* Tab 2: Expiring Contracts (<30 days) */}
          {activeActionTab === 'contracts' && (
            <div>
              {expiringContracts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {expiringContracts.map((contract: any) => (
                    <div
                      key={contract.id}
                      className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/20 hover:bg-amber-50/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded">
                            {contract.contractCode}
                          </span>
                          <Badge variant="warning" size="sm">
                            Sắp hết hạn
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Căn {contract.apartment?.apartmentNumber} •{' '}
                            {contract.resident?.fullName || 'Khách thuê'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ngày kết thúc: <strong className="text-rose-600">{formatDate(contract.endDate)}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-amber-200/50 flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          Giá thuê: {formatCurrency(contract.monthlyRent)}
                        </span>
                        <Link href="/contracts">
                          <Button variant="ghost" size="xs" className="text-amber-800 hover:text-amber-900">
                            Gia hạn hợp đồng <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="Hợp đồng đang ổn định"
                  description="Không có hợp đồng thuê hoặc bàn giao nào sắp đến hạn trong vòng 30 ngày tới."
                />
              )}
            </div>
          )}

          {/* Tab 3: Overdue Invoices */}
          {activeActionTab === 'overdue' && (
            <div>
              {overdueInvoices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {overdueInvoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl border border-rose-200/70 bg-rose-50/20 hover:bg-rose-50/40 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {inv.invoiceCode || `INV-${inv.id.slice(0, 6)}`}
                          </span>
                          <Badge variant="destructive" size="sm">
                            Quá hạn thanh toán
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Căn {inv.apartment?.apartmentNumber} • Kỳ {inv.billingMonth}
                          </p>
                          <p className="text-xs text-rose-600 font-semibold mt-0.5">
                            Hạn cuối: {formatDate(inv.dueDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-rose-200/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Số tiền: {formatCurrency(inv.totalAmount)}
                        </span>
                        <Link href="/invoices">
                          <Button variant="ghost" size="xs" className="text-rose-700 hover:text-rose-800">
                            Đôn đốc thanh toán <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="Không có nợ quá hạn"
                  description="Các hộ gia đình và căn hộ đều tuân thủ kỳ hạn thanh toán phí dịch vụ."
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend Bar Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Doanh thu & Phí dịch vụ (6 tháng gần nhất)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Đối chiếu kế hoạch phát hành hóa đơn và số tiền thực tế đã quyết toán
              </CardDescription>
            </div>
            <Link href="/invoices">
              <Button variant="outline" size="xs" className="hidden sm:inline-flex">
                Chi tiết thu phí <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {revenueTrend.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(0)}tr`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        borderColor: '#e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Bar
                      dataKey="revenue"
                      name="Doanh thu dự kiến"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="collected"
                      name="Số tiền thực thu"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Chưa có dữ liệu doanh thu"
                description="Biểu đồ sẽ tự động kết xuất khi các hóa đơn hàng tháng được tạo và thanh toán."
              />
            )}
          </CardContent>
        </Card>

        {/* Apartment Status Distribution Donut Chart */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Trạng thái Căn hộ
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Phân bổ hiện trạng sử dụng các căn hộ
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {apartmentStatusChart.length > 0 ? (
              <div className="h-68 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={apartmentStatusChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {apartmentStatusChart.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || '#3b82f6'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} Căn hộ`, '']} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="Chưa có dữ liệu căn hộ"
                description="Hệ thống chưa ghi nhận thông tin căn hộ trong cơ sở dữ liệu."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incident Categories & Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Categories Breakdown */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-amber-600" />
              Phân loại Phản ánh & Sự cố Kỹ thuật
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Số lượng sự cố theo từng nhóm dịch vụ tiện ích
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {ticketCategoryChart.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={ticketCategoryChart} margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Số lượt yêu cầu"
                      fill="#3b82f6"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Không có sự cố nào được ghi nhận"
                description="Hệ thống kỹ thuật và dịch vụ tòa nhà đang vận hành hoàn hảo."
              />
            )}
          </CardContent>
        </Card>

        {/* Operational Highlights & SLA */}
        <Card className="border-slate-200 shadow-2xs bg-linear-to-br from-slate-50 to-indigo-50/20">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              Chất lượng Dịch vụ & SLA Vận hành
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Đánh giá hiệu suất phục vụ và phản hồi của đội ngũ quản lý
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">Thời gian xử lý sự cố trung bình</p>
                <p className="text-xs text-slate-500">Cam kết hoàn thành trong vòng &lt; 4 giờ</p>
              </div>
              <Badge variant="success" size="default">
                3.5 giờ (Tốt)
              </Badge>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">Chỉ số hài lòng của cư dân (CSAT)</p>
                <p className="text-xs text-slate-500">Dựa trên các lượt đánh giá sau khi hoàn thành yêu cầu</p>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 font-bold text-xs">
                <span>★</span>
                <span>4.8 / 5.0</span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">Tỷ lệ giải quyết sự cố lần đầu</p>
                <p className="text-xs text-slate-500">Xử lý dứt điểm không cần hỗ trợ lại</p>
              </div>
              <Badge variant="info" size="default">
                94.2%
              </Badge>
            </div>

            {/* Direct Quick Shortcuts */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link href="/apartments">
                <Button variant="outline" size="sm" className="w-full text-xs justify-start">
                  <Building2 className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  Sơ đồ căn hộ
                </Button>
              </Link>
              <Link href="/residents">
                <Button variant="outline" size="sm" className="w-full text-xs justify-start">
                  <Users className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  Sổ bộ cư dân
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
