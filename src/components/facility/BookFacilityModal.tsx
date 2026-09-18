'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFacilitySlots, useCreateBooking } from '@/hooks/use-facilities';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  MapPin,
  FileText,
} from 'lucide-react';
import { FACILITY_TYPE_LABELS } from '@/modules/facility/facility.constants';
import { FacilityType } from '@prisma/client';

interface BookFacilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: {
    id: string;
    name: string;
    type: FacilityType;
    location: string;
    openTime: string;
    closeTime: string;
    slotDuration: number;
    maxUsers: number;
    fee: number;
    rules?: string | null;
    description?: string | null;
    images?: string[];
  } | null;
}

export function BookFacilityModal({
  open,
  onOpenChange,
  facility,
}: BookFacilityModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  const [numberOfUsers, setNumberOfUsers] = useState(1);
  const [notes, setNotes] = useState('');

  // Fetch slots from backend for this date
  const { data: slotsData, isLoading: isSlotsLoading } = useFacilitySlots(
    facility?.id,
    selectedDate
  );
  const slots = slotsData?.data || [];

  const createBookingMutation = useCreateBooking();

  if (!facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    await createBookingMutation.mutateAsync({
      facilityId: facility.id,
      bookingDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      numberOfUsers,
      notes: notes.trim() || undefined,
    });

    // Reset & close
    setSelectedSlot(null);
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {FACILITY_TYPE_LABELS[facility.type] || facility.type}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                {facility.fee === 0
                  ? 'Miễn phí cho cư dân'
                  : `${Number(facility.fee).toLocaleString('vi-VN')} đ/lượt`}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mt-1">
              {facility.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{facility.location}</span>
              <span className="text-slate-300">•</span>
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {facility.openTime} - {facility.closeTime} (Khung giờ {facility.slotDuration} phút)
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Rules info box */}
          {facility.rules && (
            <div className="my-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800">
                <FileText className="h-3.5 w-3.5" />
                Nội quy & Quy định tiện ích:
              </div>
              <p className="whitespace-pre-line text-slate-700 leading-relaxed">
                {facility.rules}
              </p>
            </div>
          )}

          {/* Date Picker */}
          <div className="py-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>Chọn ngày đặt chỗ:</span>
            </label>
            <Input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full sm:w-64 bg-slate-50 font-medium"
              required
            />
          </div>

          {/* Time Slot Grid */}
          <div className="py-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Khung giờ khả dụng:</span>
              </label>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Còn chỗ
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Hết chỗ
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Đã qua
                </span>
              </div>
            </div>

            {isSlotsLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1 text-blue-500" />
                Đang kiểm tra tình trạng chỗ trống...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Không có khung giờ nào khả dụng trong ngày này.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {slots.map((slot: any) => {
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.endTime === slot.endTime;

                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() =>
                        setSelectedSlot({
                          startTime: slot.startTime,
                          endTime: slot.endTime,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all duration-150 relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30 text-blue-900 shadow-sm'
                          : !slot.isAvailable
                          ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 text-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs tracking-tight">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-[10px] mt-1 flex items-center justify-between">
                        {slot.isPast ? (
                          <span className="text-slate-400 italic">Đã qua giờ</span>
                        ) : !slot.isAvailable ? (
                          <span className="text-rose-600 font-medium">Hết chỗ</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            {facility.maxUsers === 1
                              ? 'Còn trống'
                              : `Còn ${slot.maxUsers - slot.bookedUsers} chỗ`}
                          </span>
                        )}
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Number of users & notes (only shown if a slot is selected) */}
          {selectedSlot && (
            <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Số lượng người tham gia <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={facility.maxUsers}
                    value={numberOfUsers}
                    onChange={(e) => setNumberOfUsers(Number(e.target.value))}
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Tối đa {facility.maxUsers} người cho tiện ích này
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tổng chi phí sử dụng
                  </label>
                  <div className="h-10 px-3 rounded-md border border-slate-200 bg-slate-50 flex items-center text-sm font-bold text-emerald-700">
                    {facility.fee === 0
                      ? 'Miễn phí (Theo chế độ cư dân)'
                      : `${Number(facility.fee).toLocaleString('vi-VN')} VNĐ`}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú cho Ban Quản Lý (nếu có)
                </label>
                <textarea
                  rows={2}
                  placeholder="Yêu cầu chuẩn bị thêm bàn ghế, thiết bị hoặc mục đích sử dụng..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBookingMutation.isPending}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={!selectedSlot || createBookingMutation.isPending}
              className="bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white font-medium shadow-xs"
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý đặt chỗ...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Xác nhận đặt chỗ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
