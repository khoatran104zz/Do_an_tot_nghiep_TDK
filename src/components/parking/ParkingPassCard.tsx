'use client';

import React from 'react';
import {
  Car,
  Bike,
  ShieldCheck,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Printer,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { KHomeIcon } from '@/components/shared/KHomeLogo';

export interface ParkingPassCardProps {
  assignment: any;
  onViewOnMap?: (slotId: string, areaId: string) => void;
}

export function ParkingPassCard({
  assignment,
  onViewOnMap,
}: ParkingPassCardProps) {
  if (!assignment) return null;

  const { slot, vehicle, resident, apartment, startDate, endDate, qrToken, status } = assignment;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#0F6B4F]/30 bg-gradient-to-br from-card via-card to-[#0F6B4F]/5 p-6 shadow-md hover:shadow-lg transition-shadow">
      {/* Decorative top banner */}
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0F6B4F] text-white shadow-sm">
            <KHomeIcon className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0F6B4F]">
              K-HOME RESIDENT PARKING PASS
            </div>
            <h3 className="text-base font-bold text-foreground">
              Thẻ Đỗ Xe Điện Tử
            </h3>
          </div>
        </div>

        <Badge
          className={
            status === 'ACTIVE'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
              : 'bg-amber-500 text-white'
          }
        >
          {status === 'ACTIVE' ? 'Đang hiệu lực' : 'Sắp hết hạn'}
        </Badge>
      </div>

      {/* Main Pass Body: QR Code & Slot Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-center">
        {/* Left 2 Cols: Slot & Vehicle Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-black text-[#0F6B4F] tracking-tight">
              {slot?.code || 'N/A'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0F6B4F]/15 text-[#0F6B4F]">
              {slot?.area?.name} • {slot?.zone?.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Biển số xe</span>
              <span className="font-mono text-base font-bold text-foreground mt-0.5 block">
                {vehicle?.licensePlate || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Loại & Dòng xe</span>
              <span className="font-medium text-foreground mt-0.5 block">
                {vehicle?.brand} {vehicle?.model} ({vehicle?.color})
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Căn hộ</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                Căn hộ {apartment?.code}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Thời hạn</span>
              <span className="font-medium text-foreground mt-0.5 block">
                {formatDate(startDate)} → {endDate ? formatDate(endDate) : 'Dài hạn'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: High-Tech Stylized QR Token Box */}
        <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-inner text-center">
          {/* Simulated clean vector QR Code graphic */}
          <div className="w-28 h-28 bg-slate-900 dark:bg-white p-2 rounded-lg flex items-center justify-center">
            <div className="w-full h-full border-2 border-dashed border-white/50 dark:border-black/50 flex flex-col items-center justify-center p-1">
              <QrCode className="w-16 h-16 text-white dark:text-slate-900" />
            </div>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground mt-2 tracking-wider truncate max-w-[140px]">
            {qrToken}
          </span>
          <span className="text-[10px] text-[#0F6B4F] font-semibold mt-0.5">
            Quẹt tại Barie cổng vào
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0F6B4F]" />
          <span>Mã thẻ mã hóa an toàn • Xác thực cổng bảo vệ K-Home</span>
        </div>

        <div className="flex items-center gap-2">
          {onViewOnMap && slot && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-[#0F6B4F]/40 hover:bg-[#0F6B4F]/10 text-[#0F6B4F] flex items-center gap-1.5"
              onClick={() => onViewOnMap(slot.id, slot.areaId)}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Xem vị trí trên sơ đồ</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
