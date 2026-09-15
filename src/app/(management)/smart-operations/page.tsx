'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  Radio,
  AlertTriangle,
  ArrowRight,
  Wifi,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building,
  Wrench,
  DollarSign,
} from 'lucide-react';
import { useIoTSensors, useSmartAlerts } from '@/hooks/use-smart-operations';
import { formatDateTime } from '@/lib/utils';

export default function SmartOperationsHubPage() {
  const { data: sensorRes, isLoading: sensorsLoading } = useIoTSensors();
  const { data: alertRes, isLoading: alertsLoading } = useSmartAlerts();

  const sensors = sensorRes?.data || [];
  const alerts = alertRes?.data?.items || [];
  const alertCounts = alertRes?.data?.counts || { total: 0, critical: 0, high: 0, warning: 0, info: 0 };

  const onlineSensors = sensors.filter((s: any) => s.status !== 'OFFLINE').length;
  const criticalSensors = sensors.filter((s: any) => s.status === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung tâm Vận hành Thông minh (Smart Operations)"
        description="Hệ thống điều phối BMS, mạng lưới cảm biến IoT, quản trị cảnh báo rủi ro và tự động hóa ứng cứu sự cố."
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200/80 dark:border-blue-900/40 bg-blue-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block">Cảm biến kết nối</span>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                {sensorsLoading ? '...' : `${onlineSensors} / ${sensors.length}`}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {criticalSensors > 0 ? `⚠️ ${criticalSensors} cảm biến nguy cấp` : '✅ 100% cảm biến an toàn'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Wifi className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/80 dark:border-rose-900/40 bg-rose-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">Cảnh báo đang mở</span>
              <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
                {alertsLoading ? '...' : alertCounts.critical + alertCounts.high}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {alertCounts.critical} khẩn cấp • {alertCounts.high} nghiêm trọng
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">Hạ tầng BMS Tòa nhà</span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">Ổn định</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Áp lực bơm 3.2 bar • Tải 72%</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/80 dark:border-purple-900/40 bg-purple-50/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 block">Tự động hóa sự cố</span>
              <span className="text-2xl font-black text-purple-700 dark:text-purple-300">Hoạt động</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Tự động kích hoạt Ticket & SLA</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600">
              <Zap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/smart-operations/iot" className="block group">
          <Card className="h-full border-slate-200/80 dark:border-slate-800 transition-all duration-200 hover:border-blue-500 hover:shadow-lg">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Radio className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Giám sát Cảm biến IoT & Mô phỏng sự cố
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Theo dõi 7 nhóm cảm biến vật lý (Nhiệt độ, Khói PCCC, Rò rỉ nước, Mức nước bể ngầm, Thang máy) và chế độ diễn tập sự cố khẩn cấp.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/smart-operations/alerts" className="block group">
          <Card className="h-full border-slate-200/80 dark:border-slate-800 transition-all duration-200 hover:border-rose-500 hover:shadow-lg">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Trung tâm Cảnh báo Tập trung (Smart Alerts)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Điều phối các cảnh báo rủi ro đa nguồn: cảm biến IoT, vi phạm cam kết dịch vụ SLA, hóa đơn nợ đọng kéo dài và hợp đồng đáo hạn.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Top 5 Priority Action Items */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            5 Cảnh báo ưu tiên giải quyết hôm nay
          </CardTitle>
          <Link href="/smart-operations/alerts">
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:underline">
              Xem tất cả ({alerts.length})
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              Hệ thống vận hành an toàn. Không có cảnh báo nguy cấp nào cần xử lý.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {alerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                        {alert.title}
                      </strong>
                      <Badge
                        className={
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-500 text-white text-[10px]'
                            : 'bg-amber-500 text-white text-[10px]'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-slate-500 line-clamp-1">{alert.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{formatDateTime(alert.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
