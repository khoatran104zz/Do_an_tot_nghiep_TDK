'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt, MessageSquareWarning, Bell, CreditCard, ArrowRight, ShieldCheck, Home as HomeIcon } from 'lucide-react';
import { useInvoices } from '@/hooks/use-invoices';
import { useFeedbacks } from '@/hooks/use-feedbacks';
import { useNotifications } from '@/hooks/use-notifications';
import { formatCurrency } from '@/lib/utils';

export default function ResidentHomePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const { data: invoicesRes } = useInvoices();
  const { data: feedbacksRes } = useFeedbacks();
  const { data: notificationsRes } = useNotifications();

  const invoices = invoicesRes?.data || [];
  const feedbacks = feedbacksRes?.data || [];
  const notifications = notificationsRes?.data || [];

  const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'UNPAID');
  const totalUnpaidAmount = unpaidInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-xs mb-3">
            <HomeIcon className="h-3.5 w-3.5" />
            Cổng Thông Tin Cư Dân
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.name || 'Cư dân'}!
          </h1>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            Chào mừng bạn đến với hệ thống quản lý tòa nhà thông minh High-Tech Apartment.
          </p>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700">Hóa đơn cần thanh toán</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(totalUnpaidAmount)}
              </h3>
              <p className="text-[11px] text-amber-600 mt-0.5">{unpaidInvoices.length} hóa đơn chưa thanh toán</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700">Phản ánh đang xử lý</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {feedbacks.filter((f: any) => f.status !== 'RESOLVED').length} Yêu cầu
              </h3>
              <p className="text-[11px] text-blue-600 mt-0.5">Đang được kỹ thuật hỗ trợ</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <MessageSquareWarning className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700">Thông báo từ BQL</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {notifications.length} Tin tức
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Cập nhật lịch bảo trì mới nhất</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
              <Bell className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/resident/invoices">
          <Card className="p-5 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Thanh toán Hóa đơn</h4>
                  <p className="text-xs text-slate-500">Xem & thanh toán phí hàng tháng</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link href="/resident/feedback">
          <Card className="p-5 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-lg text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Báo Sự cố & Hỗ trợ</h4>
                  <p className="text-xs text-slate-500">Gửi phản ánh điện, nước, kỹ thuật</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link href="/resident/notifications">
          <Card className="p-5 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Xem Thông báo</h4>
                  <p className="text-xs text-slate-500">Lịch cắt điện, nước, bảo trì</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Notifications Widget */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            Thông báo mới nhất từ Ban Quản Lý
          </CardTitle>
          <Link href="/resident/notifications" className="text-xs font-semibold text-blue-600 hover:underline">
            Xem tất cả
          </Link>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {notifications.slice(0, 3).map((item: any) => (
            <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h5 className="font-bold text-slate-900 text-xs">{item.title}</h5>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
