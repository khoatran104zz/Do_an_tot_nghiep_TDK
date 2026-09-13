'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyBookings, useCancelBooking } from '@/hooks/use-facilities';
import {
  Calendar,
  Clock,
  Users,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  BOOKING_STATUS_BADGE,
  FACILITY_TYPE_LABELS,
} from '@/modules/facility/facility.constants';
import { BookingStatus, FacilityType } from '@prisma/client';

interface MyBookingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyBookingsDrawer({ open, onOpenChange }: MyBookingsDrawerProps) {
  const { data: bookingsData, isLoading } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const bookings = bookingsData?.data || [];

  const handleConfirmCancel = async (id: string) => {
    await cancelMutation.mutateAsync({
      id,
      data: { reason: cancelReason.trim() || 'Cư dân chủ động hủy' },
    });
    setCancellingBookingId(null);
    setCancelReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold text-slate-900">
              Lịch đặt chỗ của tôi ({bookings.length})
            </DialogTitle>
          </div>
          <DialogDescription>
            Danh sách các lượt đặt tiện ích của căn hộ. Bạn có thể hủy lịch đặt nếu bận việc đột xuất.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1 text-blue-500" />
              Đang tải lịch đặt của bạn...
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Bạn chưa có lịch đặt tiện ích nào</p>
              <p className="text-slate-400 mt-0.5">
                Hãy chọn một tiện ích và đặt chỗ cho gia đình ngay nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking: any) => {
                const statusBadge =
                  BOOKING_STATUS_BADGE[booking.status as BookingStatus] || {
                    variant: 'secondary',
                    label: booking.status,
                  };

                const isCancellable =
                  booking.status === 'CONFIRMED' || booking.status === 'PENDING';

                return (
                  <div
                    key={booking.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {booking.bookingCode}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {booking.facility?.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {FACILITY_TYPE_LABELS[booking.facility?.type as FacilityType] ||
                            booking.facility?.type}
                          {booking.facility?.location && ` • ${booking.facility.location}`}
                        </p>
                      </div>

                      <Badge variant={statusBadge.variant} dot>
                        {statusBadge.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{booking.numberOfUsers} người</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="text-slate-500">
                        Phí:{' '}
                        <strong className="text-emerald-700">
                          {booking.totalFee === 0
                            ? 'Miễn phí'
                            : `${Number(booking.totalFee).toLocaleString('vi-VN')} đ`}
                        </strong>
                      </div>

                      {isCancellable && (
                        <div>
                          {cancellingBookingId === booking.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Lý do hủy..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="h-7 px-2 text-xs rounded border border-slate-200"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleConfirmCancel(booking.id)}
                                disabled={cancelMutation.isPending}
                                className="h-7 text-xs"
                              >
                                Xác nhận hủy
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCancellingBookingId(null)}
                                className="h-7 text-xs text-slate-500"
                              >
                                Đóng
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCancellingBookingId(booking.id)}
                              className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Hủy đặt chỗ
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
