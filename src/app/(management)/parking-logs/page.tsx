'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ParkingGateSimulator } from '@/components/parking/ParkingGateSimulator';
import { ShieldCheck, History, ArrowDownRight, ArrowUpRight, Scan, AlertCircle } from 'lucide-react';
import { useGateLogs, useParkingOccupancy } from '@/hooks/use-parking';

export default function ParkingLogsPage() {
  const { data: occupancyRes } = useParkingOccupancy();
  const occupancy = occupancyRes?.data;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kiểm Soát Vào Ra & Vận Hành Bãi Xe"
        description="Mô phỏng trạm kiểm soát tự động với camera nhận diện biển số (ANPR), thẻ từ RFID và QR Pass an ninh"
      />

      {/* Quick Status Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Lượt vào hôm nay</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {occupancy?.todayEntries ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Lượt ra hôm nay</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {occupancy?.todayExits ?? 0}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Độ chính xác ANPR</span>
            <span className="text-xl font-bold font-mono text-foreground">99.4%</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Thẻ xe đang hiệu lực</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {occupancy?.activePassesCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Security Simulator & Live Feed */}
      <ParkingGateSimulator />
    </div>
  );
}
