'use client';

import React, { useState } from 'react';
import {
  Car,
  Bike,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { FormDialog } from '@/components/shared/FormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useVehicles } from '@/hooks/use-vehicles';
import { useCreateParkingRequest } from '@/hooks/use-parking';
import { toast } from 'sonner';

export interface ParkingRequestModalProps {
  slot: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ParkingRequestModal({
  slot,
  isOpen,
  onClose,
  onSuccess,
}: ParkingRequestModalProps) {
  // Query resident's active vehicles
  const { data: vehicleRes, isLoading: isLoadingVehicles } = useVehicles({
    status: 'ACTIVE',
  });
  const vehicles = vehicleRes?.data || [];

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const createRequestMutation = useCreateParkingRequest();

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      toast.error('Vui lòng chọn phương tiện cần đăng ký chỗ đỗ');
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        vehicleId: selectedVehicleId,
        slotId: slot?.id,
        preferredAreaId: slot?.areaId,
        preferredZoneId: slot?.zoneId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
      onSuccess?.();
    } catch (err) {
      // Error handled by hook toast
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Đăng ký cấp phát chỗ đỗ xe"
      description={`Gửi đơn đăng ký chỗ đỗ ${slot?.code || ''} tới Ban quản lý tòa nhà`}
      submitText="Gửi đơn đăng ký"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      isLoading={createRequestMutation.isPending}
    >
      <div className="space-y-4 py-2 text-xs">
        {/* Selected Slot Summary Card */}
        {slot && (
          <div className="bg-[#0F6B4F]/10 border border-[#0F6B4F]/30 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6B4F] block">
                Vị trí đỗ xe đã chọn
              </span>
              <span className="font-mono text-lg font-black text-foreground">
                {slot.code}
              </span>
              <span className="text-muted-foreground ml-2">
                ({slot.area?.name} • {slot.zone?.name})
              </span>
            </div>
            <span className="px-2 py-1 rounded bg-[#0F6B4F] text-white font-bold text-[10px]">
              {slot.type === 'CAR' ? 'Ô TÔ' : 'XE MÁY'}
            </span>
          </div>
        )}

        {/* Vehicle Selection */}
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground flex items-center justify-between">
            <span>Chọn phương tiện của bạn *</span>
            <span className="text-[11px] text-muted-foreground">
              (Chỉ hiển thị xe đã duyệt)
            </span>
          </label>

          {isLoadingVehicles ? (
            <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
          ) : vehicles.length === 0 ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-900 dark:text-amber-300">
              <p className="font-medium">Bạn chưa có phương tiện nào ở trạng thái ĐÃ DUYỆT.</p>
              <p className="mt-0.5 text-muted-foreground text-[11px]">
                Vui lòng vào trang "Phương tiện" để gửi thông tin đăng ký xe trước khi xin cấp chỗ đỗ.
              </p>
            </div>
          ) : (
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Nhấp để chọn phương tiện --</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} ({v.brand} {v.model || ''} - {v.type === 'CAR' ? 'Ô tô' : 'Xe máy'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Ngày bắt đầu hiệu lực *</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Ngày kết thúc <span className="text-muted-foreground font-normal">(Tùy chọn)</span>
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground">Ghi chú hoặc yêu cầu thêm</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ví dụ: Cần chỗ đỗ gần cột sạc điện, dự kiến nhận slot đầu tháng tới..."
            className="w-full p-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Policy Hint */}
        <div className="p-3 bg-muted/50 rounded-lg text-[11px] text-muted-foreground space-y-1 border border-border/50">
          <div className="flex items-center gap-1 font-semibold text-foreground">
            <Info className="w-3.5 h-3.5 text-primary" />
            Quy định phân bổ bãi đỗ xe K-Home:
          </div>
          <p>
            • Mỗi phương tiện hoạt động chỉ được gán tối đa 01 chỗ đỗ cố định.
          </p>
          <p>
            • Ban quản lý sẽ duyệt và gửi thông báo trong vòng 24 giờ làm việc.
          </p>
        </div>
      </div>
    </FormDialog>
  );
}
