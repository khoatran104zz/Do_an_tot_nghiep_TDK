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
import { useCreateMaintenanceSchedule } from '@/hooks/use-assets';
import { MaintenanceCycle } from '@prisma/client';
import { MAINTENANCE_CYCLE_LABELS } from '@/modules/asset/asset.constants';
import { CalendarDays, Loader2, Plus } from 'lucide-react';

interface CreateScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAssetId?: string;
  assets?: Array<{ id: string; name: string; code: string }>;
  technicians?: Array<{ id: string; name: string; code?: string }>;
}

export function CreateScheduleModal({
  open,
  onOpenChange,
  preselectedAssetId,
  assets = [],
  technicians = [],
}: CreateScheduleModalProps) {
  const createSchedule = useCreateMaintenanceSchedule();

  const [assetId, setAssetId] = useState(preselectedAssetId || '');
  const [title, setTitle] = useState('');
  const [cycle, setCycle] = useState<MaintenanceCycle>('MONTHLY');
  const [lastMaintenance, setLastMaintenance] = useState('');
  const [nextMaintenance, setNextMaintenance] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [vendor, setVendor] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [notes, setNotes] = useState('');

  // Keep assetId synced if preselectedAssetId passed
  React.useEffect(() => {
    if (preselectedAssetId) {
      setAssetId(preselectedAssetId);
    } else if (assets.length > 0 && !assetId) {
      setAssetId(assets[0].id);
    }
  }, [preselectedAssetId, assets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !title.trim() || !nextMaintenance) return;

    await createSchedule.mutateAsync({
      assetId,
      title: title.trim(),
      cycle,
      lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : undefined,
      nextMaintenance: new Date(nextMaintenance),
      vendor: vendor.trim() || undefined,
      technicianId: technicianId || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset & close
    setTitle('');
    setVendor('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              Lập Kế hoạch Bảo trì Phòng ngừa
            </DialogTitle>
            <DialogDescription>
              Tạo chu kỳ kiểm tra, bảo dưỡng định kỳ giúp tăng tuổi thọ và độ an toàn của thiết bị.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Thiết bị cần bảo trì <span className="text-red-500">*</span>
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                disabled={!!preselectedAssetId}
                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                required
              >
                {assets.map((ast) => (
                  <option key={ast.id} value={ast.id}>
                    [{ast.code}] {ast.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tên hạng mục / Tiêu đề bảo trì <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="VD: Kiểm định an toàn ray & cáp kéo thang máy định kỳ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Chu kỳ bảo dưỡng <span className="text-red-500">*</span>
                </label>
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as MaintenanceCycle)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(MAINTENANCE_CYCLE_LABELS).map(([cyc, label]) => (
                    <option key={cyc} value={cyc}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ngày kế hoạch tiếp theo <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={nextMaintenance}
                  onChange={(e) => setNextMaintenance(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Lần bảo trì gần nhất (nếu có)
                </label>
                <Input
                  type="date"
                  value={lastMaintenance}
                  onChange={(e) => setLastMaintenance(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kỹ thuật viên phụ trách
                </label>
                <select
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chỉ định kỹ thuật viên --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} {tech.code ? `(${tech.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Đơn vị thầu / Nhà cung cấp dịch vụ ngoài (nếu có)
              </label>
              <Input
                placeholder="VD: Hãng thang máy Schindler VN / Bảo dưỡng PCCC Thăng Long"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ghi chú / Quy trình kiểm tra
              </label>
              <textarea
                rows={3}
                placeholder="Nội dung cần thực hiện theo danh mục kiểm tra tiêu chuẩn..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSchedule.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={createSchedule.isPending}
            >
              {createSchedule.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lập kế hoạch...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo kế hoạch bảo trì
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
