'use client';

import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  QrCode,
  Calendar,
  Clock,
  Home,
  User,
  Phone,
  Car,
  FileText,
  Copy,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { VISITOR_STATUS_MAP } from '@/modules/visitor/visitor.constants';
import { VisitorPassWithRelations } from '@/modules/visitor/visitor.types';
import { toast } from 'sonner';

interface VisitorPassCardProps {
  pass: VisitorPassWithRelations;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
  showActions?: boolean;
}

export const VisitorPassCard: React.FC<VisitorPassCardProps> = ({
  pass,
  onCancel,
  isCancelling = false,
  showActions = true,
}) => {
  const statusInfo = (VISITOR_STATUS_MAP as any)[pass.status] || {
    label: pass.status,
    color: '#94a3b8',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  };

  const copyPassCode = () => {
    navigator.clipboard.writeText(pass.passCode);
    toast.success(`Đã sao chép mã thẻ: ${pass.passCode}`);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    pass.qrCode
  )}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-background shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Top Banner Accent */}
      <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hệ Thống Kiểm Soát An Ninh Ra Vào
              </div>
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                VISITOR PASS
                <span className="text-sm font-normal text-muted-foreground">| Thẻ Khách</span>
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
            <button
              onClick={copyPassCode}
              title="Nhấn để sao chép mã thẻ"
              className="flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span>{pass.passCode}</span>
              <Copy className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Body / Card Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* QR Code Container */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 border border-border/70">
          <div className="relative group bg-white p-3 rounded-xl shadow-md ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt={`QR Pass ${pass.passCode}`}
              className="w-44 h-44 object-contain rounded-lg"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl backdrop-blur-xs transition-opacity">
              <button
                onClick={copyPassCode}
                className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg shadow hover:bg-slate-100 transition-colors"
              >
                Sao chép mã
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-center text-muted-foreground">
            Xuất trình mã QR này cho Nhân viên Bảo vệ tại sảnh hoặc cổng an ninh.
          </p>
        </div>

        {/* Details Grid */}
        <div className="md:col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <User className="h-3.5 w-3.5 text-emerald-500" />
                <span>Khách đến thăm</span>
              </div>
              <div className="font-semibold text-foreground text-sm truncate">
                {pass.visitorName}
              </div>
              {pass.visitorPhone && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {pass.visitorPhone}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Home className="h-3.5 w-3.5 text-blue-500" />
                <span>Căn hộ đón tiếp</span>
              </div>
              <div className="font-semibold text-foreground text-sm">
                Căn {pass.apartment?.unitNumber || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {pass.resident?.fullName ? `Bảo lãnh: ${pass.resident.fullName}` : 'Cư dân bảo lãnh'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                <span>Ngày đến</span>
              </div>
              <div className="font-semibold text-foreground text-sm">
                {format(new Date(pass.visitDate), 'dd/MM/yyyy', { locale: vi })}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {pass.expectedTime || 'Trong ngày'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Car className="h-3.5 w-3.5 text-indigo-500" />
                <span>Phương tiện / Biển số</span>
              </div>
              <div className="font-semibold text-foreground text-sm">
                {pass.licensePlate || 'Đi bộ / Taxi'}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {pass.licensePlate ? 'Ô tô / Xe máy' : 'Không đăng ký xe'}
              </div>
            </div>
          </div>

          {pass.note && (
            <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 flex items-start gap-2 text-xs">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground italic line-clamp-2">
                &ldquo;{pass.note}&rdquo;
              </span>
            </div>
          )}

          {/* Timestamps if checked in or checked out */}
          {(pass.checkInAt || pass.checkOutAt) && (
            <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-4 text-xs">
              {pass.checkInAt && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    Vào: {format(new Date(pass.checkInAt), 'HH:mm dd/MM', { locale: vi })}
                  </span>
                </div>
              )}
              {pass.checkOutAt && (
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    Rời: {format(new Date(pass.checkOutAt), 'HH:mm dd/MM', { locale: vi })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {showActions && pass.status === 'PENDING' && onCancel && (
        <div className="px-6 py-3.5 bg-muted/30 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Có thể hủy thẻ trước khi khách đến tòa nhà
          </span>
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => onCancel(pass.id)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>{isCancelling ? 'Đang hủy...' : 'Hủy thẻ khách'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
