'use client';

import React, { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Receipt,
  MessageSquareWarning,
  Bell,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Home as HomeIcon,
  Zap,
  Droplets,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { useInvoices } from '@/hooks/use-invoices';
import { useFeedbacks } from '@/hooks/use-feedbacks';
import { useNotifications } from '@/hooks/use-notifications';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function ResidentHomePage() {
  const { data: session } = useSession();
  const user = session?.user;

  // Real data fetching via existing hooks
  const { data: invoicesRes, isLoading: isLoadingInvoices } = useInvoices();
  const { data: feedbacksRes, isLoading: isLoadingFeedbacks } = useFeedbacks();
  const { data: notificationsRes, isLoading: isLoadingNotifications } = useNotifications();

  const invoices = invoicesRes?.data || [];
  const feedbacks = feedbacksRes?.data || [];
  const notifications = notificationsRes?.data || [];

  // Determine current apartment info from invoice data or session
  const latestInvoice = invoices[0];
  const apartmentCode = latestInvoice?.apartment?.code || 'A-1001';
  const buildingName = latestInvoice?.apartment?.building || 'Tòa A';
  const floorNumber = latestInvoice?.apartment?.floor || 10;

  // Calculate unpaid invoice statistics
  const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'UNPAID');
  const totalUnpaidAmount = unpaidInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const nextDueDate = unpaidInvoices[0]?.dueDate;

  // Calculate feedback statistics
  const processingFeedbacks = feedbacks.filter((f: any) => f.status !== 'RESOLVED' && f.status !== 'REJECTED');
  const resolvedFeedbacks = feedbacks.filter((f: any) => f.status === 'RESOLVED');

  // Breakdown utility items from the latest invoice
  const utilityBreakdown = useMemo(() => {
    if (!latestInvoice?.items) return null;

    let electricItem: any = null;
    let waterItem: any = null;
    let managementItem: any = null;
    let parkingItem: any = null;

    latestInvoice.items.forEach((item: any) => {
      const code = item.feeCategory?.code || '';
      const title = item.title?.toLowerCase() || '';

      if (code.includes('ELECTRIC') || title.includes('điện')) {
        electricItem = item;
      } else if (code.includes('WATER') || title.includes('nước')) {
        waterItem = item;
      } else if (code.includes('MGMT') || title.includes('quản lý')) {
        managementItem = item;
      } else if (code.includes('PARKING') || title.includes('xe')) {
        parkingItem = item;
      }
    });

    return {
      electric: electricItem,
      water: waterItem,
      management: managementItem,
      parking: parkingItem,
    };
  }, [latestInvoice]);

  // Payment history chart data from invoices
  const paymentHistoryChart = useMemo(() => {
    if (!invoices.length) return [];
    return invoices
      .slice(0, 6)
      .reverse()
      .map((inv: any) => ({
        month: `T${inv.billingMonth?.split('-')[1] || ''}`,
        fullMonth: `Tháng ${inv.billingMonth}`,
        amount: inv.totalAmount,
        status: inv.status,
      }));
  }, [invoices]);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. HERO WELCOME SECTION */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg">
        {/* Background glow effects */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1">
                <HomeIcon className="h-3.5 w-3.5" />
                Căn hộ {apartmentCode} • {buildingName} (Tầng {floorNumber})
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Đang cư trú
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {user?.name || 'Cư dân'}! 👋
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Theo dõi tình trạng phí sinh hoạt, lịch bảo trì và gửi yêu cầu kỹ thuật trực tiếp tới Ban Quản Lý.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {totalUnpaidAmount > 0 ? (
              <Link href="/resident/invoices">
                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md hover:scale-[1.02] transition-transform">
                  <CreditCard className="mr-2 h-4 w-4" /> Thanh toán hóa đơn ({formatCurrency(totalUnpaidAmount)})
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">Đã hoàn tất phí dịch vụ</p>
                  <p className="text-[11px] text-blue-100">Không có dư nợ kỳ này</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hóa đơn & Nợ phí */}
        <Card className={`border transition-all hover:shadow-md ${totalUnpaidAmount > 0 ? 'border-amber-200/90 bg-amber-50/40' : 'border-slate-200/80 bg-white'}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Hóa đơn cần đóng</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  <AnimatedNumber
                    value={totalUnpaidAmount}
                    formatFn={(v) => formatCurrency(v)}
                  />
                </h3>
                <p className="text-[11px] text-slate-500">
                  {totalUnpaidAmount > 0 ? (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 inline" /> Hạn: {nextDueDate ? formatDate(nextDueDate) : 'Trong tháng'}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 inline" /> Đã đóng đủ tháng này
                    </span>
                  )}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${totalUnpaidAmount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tiền điện sinh hoạt */}
        <Card className="border-slate-200/80 bg-white transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Điện sinh hoạt</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  {utilityBreakdown?.electric ? (
                    <AnimatedNumber
                      value={utilityBreakdown.electric.amount}
                      formatFn={(v) => formatCurrency(v)}
                    />
                  ) : (
                    'Chưa chốt'
                  )}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {utilityBreakdown?.electric ? (
                    <span>Tiêu thụ: <strong className="text-slate-700">{utilityBreakdown.electric.quantity} kWh</strong></span>
                  ) : (
                    'Theo công tơ điện tòa nhà'
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Zap className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Nước sinh hoạt */}
        <Card className="border-slate-200/80 bg-white transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Nước sinh hoạt</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  {utilityBreakdown?.water ? (
                    <AnimatedNumber
                      value={utilityBreakdown.water.amount}
                      formatFn={(v) => formatCurrency(v)}
                    />
                  ) : (
                    'Chưa chốt'
                  )}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {utilityBreakdown?.water ? (
                    <span>Tiêu thụ: <strong className="text-slate-700">{utilityBreakdown.water.quantity} m³</strong></span>
                  ) : (
                    'Theo đồng hồ nước căn hộ'
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <Droplets className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Yêu cầu hỗ trợ kỹ thuật */}
        <Card className="border-slate-200/80 bg-white transition-all hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">Hỗ trợ kỹ thuật</p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  <AnimatedNumber value={processingFeedbacks.length} /> yêu cầu
                </h3>
                <p className="text-[11px] text-slate-500">
                  {processingFeedbacks.length > 0 ? (
                    <span className="text-blue-600 font-medium">Đang được BQL xử lý</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">Không có sự cố tồn đọng</span>
                  )}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Wrench className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. QUICK ACTIONS SHORTCUTS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Thao tác nhanh</h2>
          <span className="text-xs text-slate-400">{todayFormatted}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Link href="/resident/invoices" className="group">
            <Card className="p-4 border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100/70 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      Tra cứu & Đóng phí
                    </h4>
                    <p className="text-xs text-slate-500">Xem hóa đơn, mã QR & tải PDF</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/resident/feedback" className="group">
            <Card className="p-4 border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100/70 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <MessageSquareWarning className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                      Báo hỏng & Sự cố
                    </h4>
                    <p className="text-xs text-slate-500">Điện, nước, an ninh tòa nhà</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/resident/notifications" className="group">
            <Card className="p-4 border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100/70 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                      Bảng tin Ban Quản Lý
                    </h4>
                    <p className="text-xs text-slate-500">Lịch bảo trì, cắt điện nước</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* 4. EXPENSE TREND CHART & LATEST BILL BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: Lịch sử tiền phí 6 tháng gần đây */}
        <Card className="lg:col-span-2 border-slate-200/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Lịch sử Chi phí Căn hộ (6 tháng gần nhất)
              </CardTitle>
              <CardDescription>
                Theo dõi biến động tiền phí quản lý, điện, nước hàng tháng
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
              Căn hộ {apartmentCode}
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            {paymentHistoryChart.length === 0 ? (
              <EmptyState
                title="Chưa có dữ liệu lịch sử"
                description="Các kỳ thanh toán trước đây sẽ hiển thị biểu đồ so sánh chi phí tại đây."
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentHistoryChart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `${val / 1000000}M`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Tổng tiền']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar
                      dataKey="amount"
                      name="Tổng chi phí"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Month Breakdown Widget */}
        <Card className="border-slate-200/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              Chi tiết Phí kỳ {latestInvoice?.billingMonth || 'gần nhất'}
            </CardTitle>
            <CardDescription>
              Khoản tiền dịch vụ căn hộ chi tiết
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestInvoice?.items ? (
              <div className="space-y-2.5">
                {latestInvoice.items.map((item: any) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{item.title}</span>
                      <span className="text-blue-700">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Số lượng: {item.quantity}</span>
                      <span>Đơn giá: {formatCurrency(item.unitPrice)}</span>
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                  <span>Tổng thanh toán:</span>
                  <span className="text-blue-600 text-base">{formatCurrency(latestInvoice.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Chưa phát sinh hóa đơn"
                description="Hóa đơn kỳ mới nhất sẽ được cập nhật tại đây."
              />
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/resident/invoices" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                Xem chi tiết hóa đơn & Biên lai PDF
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* 5. RECENT ACTIVITIES & ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Service Requests / Feedback */}
        <Card className="border-slate-200/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Tiến độ Báo hỏng & Sự cố
              </CardTitle>
              <CardDescription>Yêu cầu hỗ trợ kỹ thuật gần đây của bạn</CardDescription>
            </div>
            <Link href="/resident/feedback" className="text-xs font-semibold text-blue-600 hover:underline">
              Gửi yêu cầu mới
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedbacks.length === 0 ? (
              <EmptyState
                title="Chưa có yêu cầu hỗ trợ"
                description="Khi bạn gửi phản ánh về điện, nước hoặc sự cố kỹ thuật, tiến độ xử lý sẽ xuất hiện tại đây."
              />
            ) : (
              feedbacks.slice(0, 3).map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.code}
                    </span>
                    {item.status === 'NEW' && <Badge variant="destructive" size="sm" dot>Mới tiếp nhận</Badge>}
                    {item.status === 'PROCESSING' && <Badge variant="warning" size="sm" dot>Đang xử lý</Badge>}
                    {item.status === 'RESOLVED' && <Badge variant="success" size="sm" dot>Đã sửa xong</Badge>}
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.content}</p>
                  {item.responseContent && (
                    <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900 mt-1">
                      <strong>BQL:</strong> {item.responseContent}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Announcements from BQL */}
        <Card className="border-slate-200/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Thông báo mới từ Ban Quản Lý
              </CardTitle>
              <CardDescription>Tin tức tòa nhà, lịch bảo trì PCCC & điện nước</CardDescription>
            </div>
            <Link href="/resident/notifications" className="text-xs font-semibold text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <EmptyState
                title="Chưa có thông báo nào"
                description="Các thông báo mới từ Ban Quản Lý sẽ hiển thị tại đây."
              />
            ) : (
              notifications.slice(0, 3).map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
