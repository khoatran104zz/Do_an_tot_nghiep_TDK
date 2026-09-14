'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  Car,
  FileText,
  ShieldPlus,
  Loader2,
} from 'lucide-react';
import { useCreateVisitorPass } from '@/hooks/use-visitors';
import { CreateVisitorPassDto } from '@/modules/visitor/visitor.types';
import { format } from 'date-fns';

interface CreateVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pass: any) => void;
}

export const CreateVisitorModal: React.FC<CreateVisitorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [formData, setFormData] = useState<CreateVisitorPassDto>({
    visitorName: '',
    visitorPhone: '',
    visitDate: today,
    expectedTime: '19:00 - 22:00',
    licensePlate: '',
    note: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createPassMutation = useCreateVisitorPass();

  if (!isOpen) return null;

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      const res = await createPassMutation.mutateAsync(formData);
      if (onSuccess) {
        onSuccess(res?.data || res);
      }
      onClose();
    } catch (err) {
      // Handled by hook toast
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Tạo Thẻ Khách Ra Vào
              </h2>
              <p className="text-xs text-muted-foreground">
                Đăng ký trước thông tin khách đến thăm căn hộ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Visitor Name */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
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
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 ${
                errors.visitorName ? 'border-rose-500' : 'border-border'
              }`}
            />
            {errors.visitorName && (
              <p className="text-xs text-rose-500 mt-1">{errors.visitorName}</p>
            )}
          </div>

          {/* Visitor Phone */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-500" />
              <span>Số điện thoại liên hệ</span>
              <span className="text-xs text-muted-foreground font-normal">(không bắt buộc)</span>
            </label>
            <input
              type="tel"
              placeholder="VD: 0912 345 678"
              value={formData.visitorPhone || ''}
              onChange={(e) =>
                setFormData({ ...formData, visitorPhone: e.target.value })
              }
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Visit Date & Expected Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
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
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 ${
                  errors.visitDate ? 'border-rose-500' : 'border-border'
                }`}
              />
              {errors.visitDate && (
                <p className="text-xs text-rose-500 mt-1">{errors.visitDate}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
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
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 ${
                  errors.expectedTime ? 'border-rose-500' : 'border-border'
                }`}
              />
              {errors.expectedTime && (
                <p className="text-xs text-rose-500 mt-1">{errors.expectedTime}</p>
              )}
            </div>
          </div>

          {/* Quick Time Presets */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {quickTimes.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFormData({ ...formData, expectedTime: preset })}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* License Plate */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
              <Car className="h-3.5 w-3.5 text-blue-500" />
              <span>Biển số xe (nếu đi xe cá nhân)</span>
              <span className="text-xs text-muted-foreground font-normal">(không bắt buộc)</span>
            </label>
            <input
              type="text"
              placeholder="VD: 29A-888.88 hoặc 59-X1 123.45"
              value={formData.licensePlate || ''}
              onChange={(e) =>
                setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
              }
              className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm font-mono uppercase bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Ghi chú / Mục đích</span>
              <span className="text-xs text-muted-foreground font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              rows={2}
              placeholder="VD: Bạn đại học đến ăn tối, giao đồ nội thất..."
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full rounded-xl border border-border px-3.5 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createPassMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 transition-all"
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
