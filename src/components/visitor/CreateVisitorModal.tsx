'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Calendar,
  Clock,
  Car,
  FileText,
  ShieldPlus,
  Loader2,
  Building2,
} from 'lucide-react';
import { useCreateVisitorPass } from '@/hooks/use-visitors';
import { useApartments } from '@/hooks/use-apartments';
import { CreateVisitorPassDto } from '@/modules/visitor/visitor.types';
import { format } from 'date-fns';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface CreateVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pass: any) => void;
  defaultApartmentId?: string;
}

export const CreateVisitorModal: React.FC<CreateVisitorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultApartmentId,
}) => {
  const { data: session } = useSession();
  const isResident = session?.user?.role === 'RESIDENT';

  const today = format(new Date(), 'yyyy-MM-dd');
  const [formData, setFormData] = useState<CreateVisitorPassDto>({
    visitorName: '',
    visitorPhone: '',
    visitDate: today,
    expectedTime: '19:00 - 22:00',
    licensePlate: '',
    note: '',
    apartmentId: defaultApartmentId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createPassMutation = useCreateVisitorPass();

  // Fetch apartments list if management needs to pick an apartment
  const { data: apartmentsResponse } = useApartments({
    limit: 300,
  });
  const apartments = apartmentsResponse?.data || [];

  useEffect(() => {
    if (defaultApartmentId) {
      setFormData((prev) => ({ ...prev, apartmentId: defaultApartmentId }));
    } else if (!isResident && apartments.length > 0 && !formData.apartmentId) {
      setFormData((prev) => ({ ...prev, apartmentId: apartments[0].id }));
    }
  }, [defaultApartmentId, isResident, apartments]);

  const quickTimes = [
    '08:00 - 12:00 (Sáng)',
    '13:00 - 17:00 (Chiều)',
    '18:00 - 22:00 (Tối)',
    'Cả ngày',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Vui lòng nhập họ tên khách';
    }
    if (!formData.visitDate) {
      newErrors.visitDate = 'Vui lòng chọn ngày đến';
    }
    if (!formData.expectedTime.trim()) {
      newErrors.expectedTime = 'Vui lòng nhập hoặc chọn khung giờ dự kiến';
    }
    if (!isResident && !formData.apartmentId) {
      newErrors.apartmentId = 'Vui lòng chọn căn hộ đón tiếp khách';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      const payload = {
        ...formData,
        apartmentId: isResident ? undefined : formData.apartmentId || undefined,
      };
      const res = await createPassMutation.mutateAsync(payload);
      if (onSuccess) {
        onSuccess(res?.data || res);
      }
      onClose();
    } catch {
      // Handled by hook toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} className="max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-6 py-4.5 pr-14 bg-slate-50/80 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/20">
            <ShieldPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tạo Thẻ Khách Ra Vào
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Đăng ký trước thông tin khách đến thăm căn hộ và cấp mã QR an ninh
            </p>
          </div>
        </div>
      </div>

      {/* Modal Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-slate-900">
        {/* Apartment Selection for Staff / Management */}
        {!isResident && (
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              <span>Căn hộ đón tiếp khách</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.apartmentId || ''}
              onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
                errors.apartmentId ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <option value="">-- Chọn Căn Hộ Đón Khách --</option>
              {apartments.map((apt: any) => (
                <option key={apt.id} value={apt.id}>
                  {apt.code} - {apt.building || 'Tòa nhà'} (Tầng {apt.floor}) {apt.owner?.fullName ? `- Chủ: ${apt.owner.fullName}` : ''}
                </option>
              ))}
            </select>
            {errors.apartmentId && (
              <p className="text-xs text-rose-500 mt-1">{errors.apartmentId}</p>
            )}
          </div>
        )}

        {/* Visitor Name */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <User className="h-3.5 w-3.5 text-emerald-500" />
            <span>Họ và tên khách đến thăm</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="VD: Nguyễn Văn Nam, Trần Thị Hương..."
            value={formData.visitorName}
            onChange={(e) =>
              setFormData({ ...formData, visitorName: e.target.value })
            }
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
              errors.visitorName ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.visitorName && (
            <p className="text-xs text-rose-500 mt-1">{errors.visitorName}</p>
          )}
        </div>

        {/* Visitor Phone */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Phone className="h-3.5 w-3.5 text-emerald-500" />
            <span>Số điện thoại liên hệ</span>
            <span className="text-xs text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <input
            type="tel"
            placeholder="VD: 0912 345 678"
            value={formData.visitorPhone || ''}
            onChange={(e) =>
              setFormData({ ...formData, visitorPhone: e.target.value })
            }
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Visit Date & Expected Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-500" />
              <span>Ngày đến thăm</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.visitDate}
              onChange={(e) =>
                setFormData({ ...formData, visitDate: e.target.value })
              }
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
                errors.visitDate ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.visitDate && (
              <p className="text-xs text-rose-500 mt-1">{errors.visitDate}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>Khung giờ dự kiến</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: 19:00 - 22:00"
              value={formData.expectedTime}
              onChange={(e) =>
                setFormData({ ...formData, expectedTime: e.target.value })
              }
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ${
                errors.expectedTime ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.expectedTime && (
              <p className="text-xs text-rose-500 mt-1">{errors.expectedTime}</p>
            )}
          </div>
        </div>

        {/* Quick Time Presets */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {quickTimes.map((preset) => {
            const isSelected = formData.expectedTime === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setFormData({ ...formData, expectedTime: preset })}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>

        {/* License Plate */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Car className="h-3.5 w-3.5 text-blue-500" />
            <span>Biển số xe (nếu đi xe cá nhân)</span>
            <span className="text-xs text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <input
            type="text"
            placeholder="VD: 29A-888.88 hoặc 59-X1 123.45"
            value={formData.licensePlate || ''}
            onChange={(e) =>
              setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
            }
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm font-mono uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Ghi chú / Mục đích</span>
            <span className="text-xs text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <textarea
            rows={2}
            placeholder="VD: Bạn đại học đến ăn tối, giao đồ nội thất..."
            value={formData.note || ''}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs h-9 px-4 rounded-xl"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={createPassMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-5 rounded-xl shadow-md shadow-emerald-600/20 gap-2"
          >
            {createPassMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tạo thẻ...</span>
              </>
            ) : (
              <>
                <ShieldPlus className="h-4 w-4" />
                <span>Tạo Thẻ Khách & Sinh QR</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
