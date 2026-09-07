'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Building,
  Home,
  Users,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Bell,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Waves,
  Dumbbell,
  Shield,
  Car,
  QrCode,
  Plus,
  FileText,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useResidentDashboard } from '@/hooks/use-residents';
import { useProcessPayment } from '@/hooks/use-invoices';
import { useCreateFeedback } from '@/hooks/use-feedbacks';
import { TicketCategory, TicketPriority } from '@prisma/client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { toast } from 'sonner';

export default function ResidentHomePage() {
  const { data: session } = useSession();
  const { data: response, isLoading, isError, error, refetch } = useResidentDashboard();

  const data = response?.data;

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO'>('VNPAY');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Quick feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    category: 'ELECTRIC' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
    title: '',
    content: '',
  });

  const payMutation = useProcessPayment();
  const createFeedbackMutation = useCreateFeedback();

  const handleSimulatePayment = () => {
    if (!data?.billing?.latestInvoice) return;
    payMutation.mutate(
      {
        id: data.billing.latestInvoice.id,
        data: {
          paymentMethod,
          transactionId: `TXN-${Date.now()}`,
        },
      },
      {
        onSuccess: () => {
          setIsPayModalOpen(false);
          refetch();
          toast.success('Thanh toán thành công! Trạng thái hóa đơn đã được cập nhật.');
        },
      }
    );
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    createFeedbackMutation.mutate(feedbackForm, {
      onSuccess: () => {
        setIsFeedbackModalOpen(false);
        setFeedbackForm({
          category: 'ELECTRIC',
          priority: 'MEDIUM',
          title: '',
          content: '',
        });
        refetch();
        toast.success('Đã gửi phản ánh tới BQL tòa nhà!');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Không thể tải thông tin Resident Portal"
          message={(error as any)?.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data?.hasApartment) {
    return (
      <div className="py-12">
        <Card className="p-8 text-center max-w-lg mx-auto border-slate-200/80 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Building className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Chưa liên kết căn hộ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Hồ sơ của bạn ({data?.resident?.fullName || session?.user?.name}) chưa được gán vào căn hộ cụ thể nào trong hệ thống.
            Vui lòng liên hệ Ban Quản Lý tòa nhà để được kích hoạt hồ sơ cư trú.
          </p>
        </Card>
      </div>
    );
  }

  const { resident, apartment, billing, maintenance, notifications, facilities, insights } = data;
  const latestInvoice = billing.latestInvoice;
  const isPaid = latestInvoice?.status === 'PAID';

  return (
    <div className="space-y-6">
      {/* ===================================================================
          1. WELCOME & APARTMENT CARD (Life in Apartment)
          =================================================================== */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Xin chào, {resident.fullName} 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Chào mừng bạn về nhà. Chúc bạn một ngày thoải mái và bình an tại chung cư.
        </p>
      </div>

      {/* Main Apartment Profile Card */}
      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800 shadow-sm bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  {resident.relationshipToOwner === 'OWNER' ? 'Chủ hộ' : resident.relationshipToOwner === 'FAMILY' ? 'Thân nhân' : 'Khách thuê'}
                </span>
                <span className="text-xs font-semibold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  {resident.status === 'RESIDING' ? 'Đang cư trú' : 'Tạm vắng'}
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Căn hộ {apartment.code}
                </h2>
                <p className="text-sm text-blue-100 mt-1">
                  {apartment.building} • Tầng {apartment.floor} • Diện tích {apartment.area} m² ({apartment.bedrooms} Phòng ngủ, {apartment.bathrooms} WC)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMembersModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs text-xs font-semibold"
              >
                <Users className="h-4 w-4 mr-1.5" />
                {apartment.members?.length || 1} Thành viên
              </Button>

              {apartment.activeContract && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsContractModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs text-xs font-semibold"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Hợp đồng
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================================
          4. QUICK ACTIONS (Big, thumb-friendly icons for mobile)
          =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            if (latestInvoice && !isPaid) setIsPayModalOpen(true);
            else toast.info('Bạn hiện không có hóa đơn nào cần thanh toán');
          }}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group text-center"
        >
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
            <QrCode className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
            Thanh toán QR
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Quét mã tiện lợi</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFeedbackModalOpen(true)}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group text-center"
        >
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
            <MessageSquareWarning className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
            Báo hỏng / Sự cố
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Kỹ thuật hỗ trợ 24/7</span>
        </button>

        <Link
          href="/resident/notifications"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group text-center"
        >
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
            <Bell className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
            Thông báo tòa nhà
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Tin tức & bảo trì</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMembersModalOpen(true)}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group text-center"
        >
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
            Thành viên căn hộ
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">{apartment.members?.length || 1} người đăng ký</span>
        </button>
      </div>

      {/* ===================================================================
          2 & 3. BILLING CARD & BILL BREAKDOWN (Financial Clarity)
          =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Billing Card */}
        <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  Hóa đơn Phí Dịch Vụ Căn Hộ
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Kỳ thanh toán tháng {latestInvoice?.billingMonth || 'gần nhất'}
                </CardDescription>
              </div>

              {latestInvoice && <StatusBadge type="invoice" status={latestInvoice.status} />}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {latestInvoice ? (
              <div className="space-y-4">
                {/* Overdue Alert Banner if overdue */}
                {billing.isOverdue && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-xs">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold">Hóa đơn đã quá hạn thanh toán!</p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        Hạn chót là ngày {formatDate(latestInvoice.dueDate)}. Vui lòng thanh toán sớm để đảm bảo quyền lợi dịch vụ.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Tổng tiền cần thanh toán
                    </span>
                    <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                      {formatCurrency(latestInvoice.totalAmount)}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                    <span>Hạn nộp: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatDate(latestInvoice.dueDate)}
                    </span>
                    {latestInvoice.status !== 'PAID' && (
                      <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {billing.daysUntilDue > 0 ? `Còn ${billing.daysUntilDue} ngày nữa` : 'Đã đến hạn'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items breakdown pills */}
                {latestInvoice.items && latestInvoice.items.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {latestInvoice.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs"
                      >
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {item.title}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mt-1">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có hóa đơn nào phát sinh</p>
            )}
          </CardContent>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <Link href="/resident/invoices">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600 dark:text-slate-300 gap-1">
                Lịch sử hóa đơn <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>

            {latestInvoice && !isPaid ? (
              <Button
                size="sm"
                onClick={() => setIsPayModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 shadow-md shadow-blue-600/20"
              >
                <QrCode className="h-4 w-4 mr-1.5" /> Thanh toán ngay
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Đã hoàn tất thanh toán
              </div>
            )}
          </div>
        </Card>

        {/* 3. Bill Breakdown Donut Chart */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Chi Tiêu Dịch Vụ Căn Hộ
            </CardTitle>
            <CardDescription className="text-xs">
              Tiền của bạn đi đâu trong kỳ thanh toán này?
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center">
            {billing.breakdownChartData.length > 0 ? (
              <>
                <div className="h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={billing.breakdownChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {billing.breakdownChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), 'Số tiền']}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {billing.breakdownChartData.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có dữ liệu phân bổ</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================
          8. SMART INSIGHTS ("Thông tin dành cho bạn")
          =================================================================== */}
      {insights.length > 0 && (
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs bg-slate-50/70 dark:bg-slate-900/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Thông tin & Lời khuyên dành cho bạn
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {insights.map((insight: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 shadow-2xs"
                >
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================================================================
          5 & 6. MAINTENANCE TIMELINE & NOTIFICATIONS
          =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Maintenance Ticket Progress */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquareWarning className="h-4 w-4 text-amber-600" />
                  Tiến Độ Xử Lý Kỹ Thuật
                </CardTitle>
                <CardDescription className="text-xs">
                  Yêu cầu hỗ trợ hỏng hóc gần nhất của căn hộ
                </CardDescription>
              </div>

              <Link href="/resident/feedback">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:underline gap-1">
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 flex-1">
            {maintenance.latestTicket ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {maintenance.latestTicket.code}
                    </span>
                    <StatusBadge type="ticketStatus" status={maintenance.latestTicket.status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {maintenance.latestTicket.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {maintenance.latestTicket.content}
                  </p>
                </div>

                {/* Progress Timeline */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tiến trình thực hiện
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                    <div
                      className={`p-2 rounded-xl border ${
                        maintenance.timelineStep >= 1
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
                      1. Tiếp nhận
                    </div>

                    <div
                      className={`p-2 rounded-xl border ${
                        maintenance.timelineStep >= 2
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <Clock className="h-4 w-4 mx-auto mb-1" />
                      2. Đang sửa chữa
                    </div>

                    <div
                      className={`p-2 rounded-xl border ${
                        maintenance.timelineStep >= 3
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
                      3. Hoàn tất
                    </div>
                  </div>
                </div>

                {maintenance.latestTicket.responseContent && (
                  <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-xs space-y-1">
                    <span className="font-bold text-blue-800 dark:text-blue-300">Ghi chú từ kỹ thuật viên:</span>
                    <p className="text-slate-700 dark:text-slate-300">{maintenance.latestTicket.responseContent}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                  Mọi thiết bị trong căn hộ đều hoạt động tốt!
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Không có yêu cầu sự cố nào đang chờ xử lý</p>
              </div>
            )}
          </CardContent>

          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="text-xs font-semibold gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Báo sự cố mới
            </Button>
          </div>
        </Card>

        {/* 6. Notifications Preview */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  Bản Tin Tòa Nhà Mới Nhất
                </CardTitle>
                <CardDescription className="text-xs">
                  Lịch kiểm tra PCCC, bảo trì kỹ thuật và sự kiện cư dân
                </CardDescription>
              </div>

              <Link href="/resident/notifications">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:underline gap-1">
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="flex-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có thông báo nào</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.slice(0, 3).map((n: any) => (
                  <Link
                    key={n.id}
                    href="/resident/notifications"
                    className="py-3 block hover:bg-slate-50/70 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {n.content}
                        </p>
                      </div>

                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" title="Chưa đọc" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>

          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center">
            <Link
              href="/resident/notifications"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 block py-0.5"
            >
              Mở hòm thư thông báo đầy đủ
            </Link>
          </div>
        </Card>
      </div>

      {/* ===================================================================
          7. BUILDING FACILITIES (Community Living)
          =================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tiện Ích Nội Khu Tòa Nhà (Facilities)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thời gian mở cửa và điều kiện sử dụng dành riêng cho cư dân
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {facilities.map((fac: any) => {
            const isPool = fac.id === 'pool';
            const isGym = fac.id === 'gym';
            const isParking = fac.id === 'parking';

            const Icon = isPool ? Waves : isGym ? Dumbbell : isParking ? Car : Building;

            return (
              <Card
                key={fac.id}
                className="border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {fac.statusLabel}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {fac.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{fac.location}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-0.5">
                    <p className="text-slate-700 dark:text-slate-300 font-semibold">
                      Giờ mở cửa: {fac.hours}
                    </p>
                    <p className="text-slate-400 leading-tight">{fac.notes}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ===================================================================
          MODALS
          =================================================================== */}

      {/* Modal 1: Quick QR Payment */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogHeader>
          <DialogTitle>Thanh toán Phí Dịch Vụ Căn Hộ</DialogTitle>
          <DialogDescription>
            Quét mã để nộp tiền tức thời cho kỳ tháng {latestInvoice?.billingMonth} - Căn hộ {apartment.code}
          </DialogDescription>
        </DialogHeader>

        {latestInvoice && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center space-y-1 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">Tổng số tiền cần thanh toán</span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(latestInvoice.totalAmount)}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Mã HĐ: {latestInvoice.code}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('VNPAY')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'VNPAY'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                VietQR / VNPay
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('MOMO')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'MOMO'
                    ? 'border-pink-600 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <QrCode className="h-4 w-4" />
                Ví MoMo
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 mb-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `SMART_PAY_${latestInvoice.code}_${latestInvoice.totalAmount}`
                  )}`}
                  alt="QR Sandbox Code"
                  className="w-36 h-36 mx-auto"
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Mã QR khớp lệnh tự động Sandbox 2026
              </span>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                Đóng
              </Button>
              <Button
                onClick={handleSimulatePayment}
                isLoading={payMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Đã quét mã thanh toán
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Modal 2: Quick Feedback Form */}
      <FormDialog
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
        title="Gửi Báo Cáo Sự Cố Kỹ Thuật"
        description={`Căn hộ ${apartment.code} - Đội ngũ kỹ thuật sẽ tiếp nhận và liên hệ trong thời gian sớm nhất.`}
        icon={MessageSquareWarning}
        onSubmit={handleSubmitFeedback}
        isLoading={createFeedbackMutation.isPending}
        submitText="Gửi báo cáo"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Khu vực / Loại sự cố
              </label>
              <select
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                value={feedbackForm.category}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value as TicketCategory })}
              >
                <option value="ELECTRIC">Điện sinh hoạt</option>
                <option value="WATER">Nước & Đường ống</option>
                <option value="ELEVATOR">Thang máy</option>
                <option value="SECURITY">An ninh trật tự</option>
                <option value="CLEANLINESS">Vệ sinh môi trường</option>
                <option value="OTHER">Vấn đề khác</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mức độ khẩn cấp
              </label>
              <select
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                value={feedbackForm.priority}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, priority: e.target.value as TicketPriority })}
              >
                <option value="LOW">Thấp (Trong 2-3 ngày)</option>
                <option value="MEDIUM">Bình thường (Trong 24h)</option>
                <option value="HIGH">Cao (Cần hỗ trợ sớm)</option>
                <option value="URGENT">Khẩn cấp (Cần xử lý ngay)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vấn đề gặp phải
            </label>
            <input
              type="text"
              placeholder="VD: Mất nước khu vực phòng tắm chính"
              value={feedbackForm.title}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mô tả chi tiết
            </label>
            <textarea
              placeholder="Mô tả hiện tượng, vị trí hoặc thời điểm phát hiện sự cố..."
              value={feedbackForm.content}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
              className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* Modal 3: Apartment Members Dialog */}
      <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
        <DialogHeader>
          <DialogTitle>Thành viên Căn hộ {apartment.code}</DialogTitle>
          <DialogDescription>
            Danh sách các thành viên đăng ký cư trú chính thức trong căn hộ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-2">
          {apartment.members?.map((member: any) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {member.fullName?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{member.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    SĐT: {member.phone} • {member.gender || 'Nam'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge type="relationship" status={member.relationshipToOwner} />
                <StatusBadge type="resident" status={member.status} />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsMembersModalOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Modal 4: Active Contract Dialog */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogHeader>
          <DialogTitle>Hợp đồng Căn hộ {apartment.code}</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết hợp đồng thuê hoặc mua bán đang có hiệu lực
          </DialogDescription>
        </DialogHeader>

        {apartment.activeContract && (
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Số hợp đồng</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {apartment.activeContract.contractCode}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Loại hợp đồng</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {apartment.activeContract.type === 'SALE' ? 'Mua bán' : 'Cho thuê (RENT)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ngày bắt đầu</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(apartment.activeContract.startDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ngày hết hạn</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(apartment.activeContract.endDate)}
                </span>
              </div>
              {apartment.activeContract.monthlyRent && (
                <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Giá trị thuê hàng tháng</span>
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(apartment.activeContract.monthlyRent)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsContractModalOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
