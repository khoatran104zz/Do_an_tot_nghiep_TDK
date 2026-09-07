'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSmartInsights, useSmartAlerts } from '@/hooks/use-smart-operations';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Building,
  Receipt,
  FileText,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SmartDashboardAlerts() {
  const router = useRouter();
  const { data: alertsRes, isLoading } = useSmartAlerts();
  const alertsData = alertsRes?.data;
  const top5Today = alertsData?.top5Today || [];
  const counts = alertsData?.counts || { total: 0, critical: 0, warning: 0, info: 0 };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: AlertOctagon,
          dot: '🔴',
          bg: 'bg-rose-50/90 border-rose-200 text-rose-900',
          indicator: 'bg-rose-600',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          dot: '🟠',
          bg: 'bg-amber-50/90 border-amber-200 text-amber-900',
          indicator: 'bg-amber-500',
        };
      default:
        return {
          icon: AlertCircle,
          dot: '🟡',
          bg: 'bg-sky-50/90 border-sky-200 text-sky-900',
          indicator: 'bg-sky-500',
        };
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                5 việc cần chú ý hôm nay
              </CardTitle>
              <p className="text-xs text-slate-500">
                Tự động quét từ hợp đồng, hóa đơn và sự cố kỹ thuật theo thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {counts.critical > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                🔴 {counts.critical} Khẩn cấp
              </span>
            )}
            {counts.warning > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                🟠 {counts.warning} Cảnh báo
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2.5">
        {top5Today.length > 0 ? (
          top5Today.map((item: any) => {
            const badge = getSeverityBadge(item.severity);
            const Icon = badge.icon;
            return (
              <div
                key={item.id}
                onClick={() => router.push(item.actionUrl)}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all hover:scale-[1.005] hover:shadow-xs ${badge.bg}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-base mt-0.5 shrink-0">{badge.dot}</span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm truncate leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs opacity-85 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold shrink-0 pt-1 text-slate-700 hover:text-indigo-600">
                  <span>Xử lý</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
            <span className="font-semibold text-slate-700">Mọi chỉ số vận hành đều ổn định</span>
            <span>Không có cảnh báo khẩn cấp nào cần xử lý ngay lúc này.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SmartInsightCards() {
  const { data: response, isLoading } = useSmartInsights();
  const data = response?.data;

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const collection = data.collection;
  const occupancy = data.occupancy;
  const tickets = data.tickets;
  const insights = data.insights || [];

  return (
    <div className="space-y-4">
      {/* 3 Metric Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Collection Insight */}
        <Card className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hiệu Quả Thu Phí
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {collection?.collectionRate || 0}%
                </span>
                <span
                  className={`inline-flex items-center text-xs font-bold ${
                    collection?.isImproved ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {collection?.isImproved ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  {collection?.rateChange > 0 ? `+${collection.rateChange}%` : `${collection.rateChange}%`} vs tháng trước
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Đã thu:{' '}
                <strong className="text-slate-800">
                  {((collection?.currentPaidAmount || 0) / 1_000_000).toFixed(1)}M
                </strong>{' '}
                / {((collection?.currentBilledAmount || 0) / 1_000_000).toFixed(1)}M đ
              </p>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, collection?.collectionRate || 0)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Occupancy Insight */}
        <Card className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tỷ Lệ Lấp Đầy & Trống
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Building className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {occupancy?.occupancyRate || 0}%
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  ({occupancy?.occupiedUnits || 0}/{occupancy?.totalUnits || 0} căn)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>Trống: <strong className="text-amber-600">{occupancy?.vacancyRate || 0}%</strong></span>
                <span>•</span>
                <span>Bảo dưỡng: <strong className="text-slate-700">{occupancy?.maintenanceRate || 0}%</strong></span>
              </div>
            </div>

            {/* Segmented bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-100">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${occupancy?.occupancyRate || 0}%` }}
              />
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${occupancy?.vacancyRate || 0}%` }}
              />
              <div
                className="bg-slate-400 h-full"
                style={{ width: `${occupancy?.maintenanceRate || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Ticket Resolution & Rating Insight */}
        <Card className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hiệu Suất Kỹ Thuật & SLA
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Wrench className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {tickets?.averageResolutionHours || 18.4}h
                  </span>
                  <span className="text-xs text-slate-500 block">Thời gian xử lý TB</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-base">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{tickets?.averageRating || 4.8}/5</span>
                  </div>
                  <span className="text-2xs text-slate-400">Đánh giá cư dân</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Đạt chuẩn SLA: <strong className="text-emerald-600">{tickets?.slaOnTrackRate || 100}%</strong></span>
              <span>Đã xong: <strong className="text-slate-800">{tickets?.resolvedTickets || 0}/{tickets?.totalTickets || 0}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Management Insights Banner */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.slice(0, 4).map((ins: any) => (
            <div
              key={ins.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                ins.severity === 'CRITICAL'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : ins.severity === 'WARNING'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {ins.severity === 'CRITICAL' && <AlertOctagon className="w-4 h-4 text-rose-600" />}
                {ins.severity === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {ins.severity === 'INFO' && <Sparkles className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs">{ins.title}</span>
                  {ins.metric && (
                    <span className="text-2xs font-mono font-bold px-1.5 py-0.5 rounded-sm bg-white/80 border border-current">
                      {ins.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{ins.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
