'use client';

import React, { useState } from 'react';
import {
  Shield,
  Scan,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Camera,
  Car,
  KeyRound,
  RotateCcw,
  Sparkles,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGateCheckIn, useGateCheckOut, useGateLogs } from '@/hooks/use-parking';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ParkingGateSimulator() {
  const [plateInput, setPlateInput] = useState<string>('30A-999.88');
  const [qrInput, setQrInput] = useState<string>('');
  const [gateName, setGateName] = useState<string>('Cổng VÀO 01 (Hầm B1)');
  const [isBarrierOpen, setIsBarrierOpen] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  const checkInMutation = useGateCheckIn();
  const checkOutMutation = useGateCheckOut();
  const { data: logsRes, isLoading: isLoadingLogs, refetch: refetchLogs } = useGateLogs({
    limit: 10,
  });

  const logs = logsRes?.data || [];

  const triggerBarrierAnimation = (authorized: boolean) => {
    if (authorized) {
      setIsBarrierOpen(true);
      setTimeout(() => {
        setIsBarrierOpen(false);
      }, 4000);
    }
  };

  const handleCheckIn = async () => {
    if (!plateInput.trim()) {
      toast.error('Vui lòng nhập biển số xe để quét');
      return;
    }

    try {
      const res = await checkInMutation.mutateAsync({
        licensePlate: plateInput.trim(),
        qrToken: qrInput.trim() || undefined,
        gateName,
      });

      setLastScanResult(res.data);
      triggerBarrierAnimation(res.data?.authorized ?? false);
    } catch (err) {
      // Handled in hook toast
    }
  };

  const handleCheckOut = async () => {
    if (!plateInput.trim()) {
      toast.error('Vui lòng nhập biển số xe để quét');
      return;
    }

    try {
      const res = await checkOutMutation.mutateAsync({
        licensePlate: plateInput.trim(),
        gateName: gateName.replace('VÀO', 'RA'),
      });

      setLastScanResult({
        authorized: true,
        message: 'Xe rời bãi thành công',
      });
      triggerBarrierAnimation(true);
    } catch (err) {
      // Handled in hook toast
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: Gate Controls & ANPR Camera Simulation */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Mô phỏng Trạm Kiểm Soát Ra/Vào (Smart Gate)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Kiểm tra biển số xe, thẻ RFID và quét mã QR thẻ đỗ xe cư dân
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-xs font-mono">
              ANPR AI • Ready
            </Badge>
          </div>

          {/* Camera Viewport & Barrier Graphic */}
          <div className="relative h-60 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-4">
            {/* Camera Scan Lines Simulation */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse pointer-events-none" />
            <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              <Camera className="w-3.5 h-3.5" />
              <span>LIVE • CAM-GATE-01 (1080p HD)</span>
            </div>

            {/* Target Reticle in Center */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="relative border-2 border-dashed border-emerald-400/70 rounded-xl px-6 py-4 bg-slate-900/90 shadow-2xl backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">
                  BIỂN SỐ NHẬN DIỆN TỰ ĐỘNG
                </div>
                <div className="font-mono text-3xl font-black tracking-widest text-white">
                  {plateInput || 'CHỜ QUÉT BIỂN SỐ'}
                </div>
              </div>

              {/* Animated Barrier Status Graphic */}
              <div className="mt-4 flex items-center gap-4 bg-slate-900/90 px-4 py-2 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">Trạng thái Barie:</span>
                {isBarrierOpen ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    BARIE ĐANG MỞ (CHO PHÉP QUA)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    BARIE ĐÓNG (DỪNG CHỜ XÁC MINH)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Plate Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground block">
              Biển số mẫu thử nghiệm nhanh:
            </span>
            <div className="flex flex-wrap gap-2">
              {['30A-999.88', '29B1-776.54', '30F-123.45', '51H-888.88', 'UNKNOWN-999'].map(
                (sample) => (
                  <Button
                    key={sample}
                    variant="outline"
                    size="sm"
                    className="text-xs font-mono h-7 px-2.5"
                    onClick={() => setPlateInput(sample)}
                  >
                    {sample}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Biển số xe (Nhập tay hoặc quét) *</label>
              <Input
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                placeholder="VD: 30A-999.88"
                className="font-mono text-sm font-bold uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Cổng kiểm soát</label>
              <select
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Cổng VÀO 01 (Hầm B1)">Cổng VÀO 01 (Hầm B1)</option>
                <option value="Cổng VÀO 02 (Hầm B2)">Cổng VÀO 02 (Hầm B2)</option>
                <option value="Cổng VÀO Ngoài Trời">Cổng VÀO Ngoài Trời</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>XÁC THỰC XE VÀO</span>
            </Button>

            <Button
              variant="outline"
              className="border-rose-500/50 hover:bg-rose-50 text-rose-700 dark:text-rose-400 font-semibold flex items-center justify-center gap-2"
              onClick={handleCheckOut}
              disabled={checkOutMutation.isPending}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>XÁC THỰC XE RA</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right 5 Cols: Live Gate History Logs */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Nhật Ký Quẹt Thẻ Thời Gian Thực
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Tự động đồng bộ mỗi 10 giây
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => refetchLogs()}
              title="Làm mới nhật ký"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 mt-4 max-h-[480px]">
            {isLoadingLogs ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                Chưa có lượt xe nào qua cổng hôm nay.
              </p>
            ) : (
              logs.map((log: any) => (
                <div
                  key={log.id}
                  className={cn(
                    'p-3 rounded-xl border text-xs flex items-center justify-between transition-all',
                    log.status === 'SUCCESS'
                      ? 'bg-muted/30 border-border'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-300'
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {log.licensePlate}
                      </span>
                      <Badge
                        variant={log.direction === 'ENTRY' ? 'default' : 'secondary'}
                        className="text-[9px] px-1.5 py-0 uppercase"
                      >
                        {log.direction === 'ENTRY' ? 'Vào' : 'Ra'}
                      </Badge>
                    </div>

                    <div className="text-[10px] text-muted-foreground">
                      {log.gateName} • {formatDateTime(log.timestamp)}
                    </div>

                    {log.slot && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                        Chỗ đỗ: {log.slot.code}
                      </span>
                    )}
                  </div>

                  <div>
                    {log.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
