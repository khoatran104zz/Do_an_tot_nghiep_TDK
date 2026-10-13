'use client';

import React from 'react';
import {
  Building2,
  Layers,
  Hash,
  Home,
  TrendingUp,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

export interface PropertyKPIData {
  totalBuildings: number;
  totalBlocks: number;
  totalFloors: number;
  totalApartments: number;
  occupiedCount: number;
  vacantCount: number;
  maintenanceCount: number;
  occupancyRate: number;
  totalDebt: number;
  openTickets: number;
}

interface PropertyKPIOverviewProps {
  data: PropertyKPIData;
  isLoading?: boolean;
}

export function PropertyKPIOverview({ data, isLoading }: PropertyKPIOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Tổng Tòa Nhà',
      value: data.totalBuildings,
      suffix: 'tòa',
      description: `${data.totalBlocks} khối tháp vận hành`,
      icon: Building2,
      iconColor: 'text-[#0F6B4F] dark:text-emerald-400',
      iconBg: 'bg-[#E8F5ED] dark:bg-[#0F6B4F]/20',
      badge: 'Cơ sở',
    },
    {
      title: 'Khối / Tháp',
      value: data.totalBlocks,
      suffix: 'khối',
      description: `${data.totalFloors} tầng chức năng`,
      icon: Layers,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      badge: 'Phân khu',
    },
    {
      title: 'Tổng Căn Hộ',
      value: data.totalApartments,
      suffix: 'căn',
      description: 'Tổng danh mục quản lý',
      icon: Home,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      badge: 'Căn hộ',
    },
    {
      title: 'Tỷ Lệ Lấp Đầy',
      value: `${data.occupancyRate}%`,
      suffix: '',
      description: `${data.occupiedCount} có người • ${data.vacantCount} trống`,
      icon: TrendingUp,
      iconColor: 'text-[#22C55E] dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      isProgress: true,
      progressValue: data.occupancyRate,
      badge: 'Hiệu suất',
    },
    {
      title: 'Căn Hộ Đang Ở',
      value: data.occupiedCount,
      suffix: 'căn',
      description: `${data.vacantCount} căn đang trống`,
      icon: CheckCircle2,
      iconColor: 'text-[#0F6B4F] dark:text-emerald-300',
      iconBg: 'bg-[#E8F5ED] dark:bg-[#0F6B4F]/20',
      badge: 'Cư trú',
    },
    {
      title: 'Bảo Trì & Sự Cố',
      value: data.maintenanceCount,
      suffix: 'căn',
      description: data.openTickets > 0 ? `${data.openTickets} phản ánh kỹ thuật` : 'Vận hành ổn định',
      icon: data.maintenanceCount > 0 ? AlertTriangle : Wrench,
      iconColor: data.maintenanceCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400',
      iconBg: data.maintenanceCount > 0 ? 'bg-amber-50 dark:bg-amber-950/60' : 'bg-slate-100 dark:bg-slate-800',
      badge: data.maintenanceCount > 0 ? 'Cần lưu ý' : 'Bình thường',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {kpis.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <Card
            key={idx}
            className="p-3.5 sm:p-4 rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs hover:border-[#0F6B4F]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {item.title}
                </span>
                <div className={`p-1.5 rounded-lg ${item.iconBg} ${item.iconColor} shrink-0`}>
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                  {item.value}
                </span>
                {item.suffix && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {item.suffix}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              {item.isProgress ? (
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0F6B4F] to-[#22C55E] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.progressValue))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {item.description}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {item.description}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
