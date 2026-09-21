'use client';

import React from 'react';
import {
  Car,
  Bike,
  Zap,
  Accessibility,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Wrench,
  Lock,
  User,
  Home,
  Shield,
  FileText,
  Calendar,
  Sparkles,
  X,
  ArrowRight,
  MapPin,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParkingSlotStatus, SlotVehicleType } from '@prisma/client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface ParkingSlotDrawerProps {
  slot: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRegisterRequest?: (slot: any) => void;
  onStatusChange?: (slotId: string, status: ParkingSlotStatus) => void;
  onReleaseSlot?: (slotId: string) => void;
  isManager?: boolean;
}

export function ParkingSlotDrawer({
  slot,
  isOpen,
  onClose,
  onRegisterRequest,
  onStatusChange,
  onReleaseSlot,
  isManager = false,
}: ParkingSlotDrawerProps) {
  if (!isOpen || !slot) return null;

  const activeAssignment = slot.assignments?.[0];

  // RBAC privacy check: resident only sees details if it's their own assignment
  // If activeAssignment.vehicle.licensePlate exists in resident view, it was kept by getAreaById because it belongs to this resident
  const isOwnAssignment = Boolean(!isManager && activeAssignment?.vehicle?.licensePlate);

  const getStatusBadge = (status: ParkingSlotStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang còn trống (Sẵn sàng đăng ký)
          </span>
        );
      case 'OCCUPIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Đang có xe đỗ
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Đã đặt trước
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-500/20">
            <Wrench className="w-3.5 h-3.5" />
            Đang bảo trì kỹ thuật
          </span>
        );
      case 'BLOCKED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-500/20">
            <Lock className="w-3.5 h-3.5" />
            Đang tạm khóa
          </span>
        );
    }
  };

  const getVehicleTypeName = (type: SlotVehicleType) => {
    switch (type) {
      case 'MOTORBIKE':
        return 'Xe máy';
      case 'EV':
        return 'Ô tô điện (EV Charging)';
      case 'DISABLED':
        return 'Ưu tiên người khuyết tật';
      case 'BICYCLE':
        return 'Xe đạp';
      case 'CAR':
      default:
        return 'Ô tô tiêu chuẩn';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-50"
        onClick={onClose}
      />

      {/* Responsive Container: Bottom Sheet on Mobile, Slide Drawer on Desktop */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:max-w-md w-full flex flex-col z-50">
        <div className="w-full h-[85vh] sm:h-full bg-card border-t sm:border-t-0 sm:border-l border-border shadow-2xl rounded-t-3xl sm:rounded-none flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
          
          {/* Mobile Sheet Handle */}
          <div className="sm:hidden flex items-center justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-black text-foreground">
                  {slot.code}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B4F] bg-[#0F6B4F]/10 dark:bg-[#0F6B4F]/20 dark:text-emerald-400 px-2 py-0.5 rounded border border-[#0F6B4F]/20">
                  {slot.zone?.name || 'Phân khu'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {slot.area?.name || 'Khu vực bãi đỗ'} • Tầng {slot.floor < 0 ? `Hầm ${Math.abs(slot.floor)}` : slot.floor === 0 ? 'Mặt đất' : `Tầng ${slot.floor}`}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Status Highlight */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Trạng thái hiện tại
              </label>
              <div>{getStatusBadge(slot.status)}</div>
            </div>

            {/* Slot Specification Card */}
            <div className="bg-muted/40 rounded-xl p-4 border border-border/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F6B4F]" />
                Thông số vị trí ô đỗ
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Loại phương tiện:</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {getVehicleTypeName(slot.type)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Hỗ trợ đặt trước:</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {slot.isReservable ? 'Có hỗ trợ' : 'Không hỗ trợ'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Tọa độ sơ đồ:</span>
                  <span className="font-mono font-medium text-foreground mt-0.5 block">
                    X: {slot.positionX ?? 0} | Y: {slot.positionY ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Kích thước tiêu chuẩn:</span>
                  <span className="font-medium text-foreground mt-0.5 block">
                    {slot.type === 'CAR' || slot.type === 'EV' ? '2.5m x 5.0m' : '1.2m x 2.2m'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment Information: Safe RBAC Partition */}
            {isManager && activeAssignment ? (
              /* MANAGER VIEW: Full Audit & Resident Details */
              <div className="bg-muted/50 rounded-xl p-4 border border-border/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0F6B4F]" />
                  Thông tin cấp phát phương tiện (Quản trị)
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-muted-foreground">Biển số xe:</span>
                    <span className="font-mono font-bold text-base text-[#0F6B4F]">
                      {activeAssignment.vehicle?.licensePlate || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dòng xe:</span>
                    <span className="font-medium text-foreground">
                      {activeAssignment.vehicle?.brand} {activeAssignment.vehicle?.model} ({activeAssignment.vehicle?.color})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Chủ xe / Cư dân:</span>
                    <span className="font-medium text-foreground">
                      {activeAssignment.resident?.fullName || 'Cư dân'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Căn hộ:</span>
                    <span className="font-medium text-foreground">
                      {activeAssignment.apartment?.code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                    <span>Thời hạn hiệu lực:</span>
                    <span className="font-mono">
                      {formatDate(activeAssignment.startDate)} → {activeAssignment.endDate ? formatDate(activeAssignment.endDate) : 'Vô thời hạn'}
                    </span>
                  </div>
                </div>
              </div>
            ) : isOwnAssignment ? (
              /* RESIDENT VIEW: Resident's OWN Slot */
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3 text-emerald-950 dark:text-emerald-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đây là chỗ đỗ xe của bạn
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20">
                    <span className="text-muted-foreground">Biển số xe:</span>
                    <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-300">
                      {activeAssignment.vehicle.licensePlate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Loại xe:</span>
                    <span className="font-medium">
                      {activeAssignment.vehicle.brand} {activeAssignment.vehicle.model || ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-emerald-500/20">
                    <span>Hiệu lực:</span>
                    <span>
                      {formatDate(activeAssignment.startDate)} → {activeAssignment.endDate ? formatDate(activeAssignment.endDate) : 'Cố định'}
                    </span>
                  </div>
                </div>
              </div>
            ) : slot.status === 'OCCUPIED' ? (
              /* RESIDENT VIEW: Occupied by someone else (Strict Privacy Masking) */
              <div className="bg-muted/30 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  Vị trí hiện đang có xe đỗ
                </div>
                <p className="text-[11px] leading-relaxed">
                  Chỗ đỗ này hiện đã được cấp quyền sử dụng cho phương tiện của cư dân tòa nhà. Bạn vui lòng chọn các vị trí màu xanh đang còn trống khác.
                </p>
              </div>
            ) : slot.status === 'AVAILABLE' ? (
              /* AVAILABLE: Ready to register */
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-950 dark:text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-emerald-800 dark:text-emerald-300">Chỗ đỗ đang sẵn sàng</h5>
                  <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                    Cư dân có phương tiện đã được duyệt có thể gửi đơn đăng ký để Ban Quản Lý cấp quyền sử dụng vị trí này.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Manager Operations Panel */}
            {isManager && (
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Thao tác vận hành BQL
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {slot.status === 'AVAILABLE' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusChange?.(slot.id, 'MAINTENANCE')}
                      className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                    >
                      <Wrench className="w-3.5 h-3.5 mr-1" />
                      Chuyển bảo trì
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusChange?.(slot.id, 'AVAILABLE')}
                      className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Mở khả dụng
                    </Button>
                  )}

                  {slot.status !== 'BLOCKED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusChange?.(slot.id, 'BLOCKED')}
                      className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      Tạm khóa chỗ
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusChange?.(slot.id, 'AVAILABLE')}
                      className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Mở khóa
                    </Button>
                  )}
                </div>

                {activeAssignment && onReleaseSlot && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs mt-2"
                    onClick={() => onReleaseSlot(slot.id)}
                  >
                    Thu hồi quyền sử dụng chỗ đỗ
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer CTA */}
          <div className="p-4 border-t border-border bg-muted/20 shrink-0">
            {slot.status === 'AVAILABLE' && onRegisterRequest ? (
              <Button
                className="w-full bg-[#0F6B4F] hover:bg-[#0c5942] text-white font-semibold flex items-center justify-center gap-2 h-10 shadow-sm cursor-pointer"
                onClick={() => {
                  onClose();
                  onRegisterRequest(slot);
                }}
              >
                <span>Đăng ký chỗ đỗ {slot.code}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="outline" className="w-full h-10 cursor-pointer" onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParkingSlotDrawer;
