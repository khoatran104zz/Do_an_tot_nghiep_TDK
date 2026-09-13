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
import { useCompleteMaintenance } from '@/hooks/use-assets';
import { CheckCircle2, Loader2, Sparkles, Wrench } from 'lucide-react';

interface CompleteMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: {
    id: string;
    code: string;
    title: string;
    cycle: string;
    asset?: {
      name: string;
      code: string;
      location: string;
    };
  } | null;
}

export function CompleteMaintenanceModal({
  open,
  onOpenChange,
  schedule,
}: CompleteMaintenanceModalProps) {
  const completeMutation = useCompleteMaintenance();

  const [findings, setFindings] = useState('');
  const [cost, setCost] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  if (!schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim()) return;

    await completeMutation.mutateAsync({
      id: schedule.id,
      data: {
        findings: findings.trim(),
        cost: typeof cost === 'number' ? cost : 0,
        notes: notes.trim() || undefined,
      },
    });

    // Reset & close
    setFindings('');
    setCost(0);
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-700">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              Nghiệm thu & Hoàn thành Bảo trì
            </DialogTitle>
            <DialogDescription>
              Ghi nhận kết quả kiểm tra thực tế, chi phí phát sinh và tự động tạo Phiếu công việc (Work Order).
            </DialogDescription>
          </DialogHeader>

          {/* Schedule & Asset Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mã lịch: {schedule.code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Chu kỳ: {schedule.cycle}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-1">{schedule.title}</h4>
            {schedule.asset && (
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <Wrench className="h-3 w-3 text-slate-400" />
                <span>[{schedule.asset.code}] {schedule.asset.name}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{schedule.asset.location}</span>
              </p>
            )}
          </div>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kết quả kiểm tra & Nội dung đã xử lý <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="VD: Đã kiểm tra lực căng cáp ray thang máy, bôi trơn bạc đạn, lau chùi tiếp điểm tủ điều khiển. Các chỉ số rung lắc trong ngưỡng an toàn."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Chi phí vật tư / Phụ tùng thay thế (VNĐ)
              </label>
              <Input
                type="number"
                min="0"
                step="10000"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ghi chú & Khuyến nghị vận hành tiếp theo
              </label>
              <textarea
                rows={2}
                placeholder="Khuyến nghị theo dõi thêm hoặc chuẩn bị vật tư cho kỳ tới..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tự động hóa thông minh:</strong> Khi hoàn thành, hệ thống sẽ tự động tính toán và cập nhật ngày bảo trì kế tiếp theo chu kỳ ({schedule.cycle}) để ban quản lý không bị quên.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={completeMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang ghi nhận...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Xác nhận hoàn thành
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
