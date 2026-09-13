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
import { useCreateFacility, useUpdateFacility } from '@/hooks/use-facilities';
import { FacilityType, FacilityStatus } from '@prisma/client';
import {
  FACILITY_TYPE_LABELS,
  FACILITY_STATUS_LABELS,
} from '@/modules/facility/facility.constants';
import { Sparkles, Loader2, Plus, Edit3 } from 'lucide-react';

interface CreateFacilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityToEdit?: any | null;
}

export function CreateFacilityModal({
  open,
  onOpenChange,
  facilityToEdit,
}: CreateFacilityModalProps) {
  const createMutation = useCreateFacility();
  const updateMutation = useUpdateFacility();

  const isEditing = !!facilityToEdit;

  const [name, setName] = useState(facilityToEdit?.name || '');
  const [type, setType] = useState<FacilityType>(facilityToEdit?.type || 'SWIMMING_POOL');
  const [location, setLocation] = useState(facilityToEdit?.location || '');
  const [openTime, setOpenTime] = useState(facilityToEdit?.openTime || '06:00');
  const [closeTime, setCloseTime] = useState(facilityToEdit?.closeTime || '22:00');
  const [slotDuration, setSlotDuration] = useState(facilityToEdit?.slotDuration || 60);
  const [maxUsers, setMaxUsers] = useState(facilityToEdit?.maxUsers || 1);
  const [fee, setFee] = useState(facilityToEdit?.fee || 0);
  const [status, setStatus] = useState<FacilityStatus>(facilityToEdit?.status || 'ACTIVE');
  const [rules, setRules] = useState(facilityToEdit?.rules || '');
  const [description, setDescription] = useState(facilityToEdit?.description || '');

  // Reset fields if editing target changes
  React.useEffect(() => {
    if (facilityToEdit) {
      setName(facilityToEdit.name);
      setType(facilityToEdit.type);
      setLocation(facilityToEdit.location);
      setOpenTime(facilityToEdit.openTime);
      setCloseTime(facilityToEdit.closeTime);
      setSlotDuration(facilityToEdit.slotDuration || 60);
      setMaxUsers(facilityToEdit.maxUsers || 1);
      setFee(facilityToEdit.fee || 0);
      setStatus(facilityToEdit.status || 'ACTIVE');
      setRules(facilityToEdit.rules || '');
      setDescription(facilityToEdit.description || '');
    } else {
      setName('');
      setType('SWIMMING_POOL');
      setLocation('');
      setOpenTime('06:00');
      setCloseTime('22:00');
      setSlotDuration(60);
      setMaxUsers(1);
      setFee(0);
      setStatus('ACTIVE');
      setRules('');
      setDescription('');
    }
  }, [facilityToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    if (isEditing) {
      await updateMutation.mutateAsync({
        id: facilityToEdit.id,
        data: {
          name: name.trim(),
          type,
          location: location.trim(),
          openTime,
          closeTime,
          slotDuration: Number(slotDuration),
          maxUsers: Number(maxUsers),
          fee: Number(fee),
          status,
          rules: rules.trim() || undefined,
          description: description.trim() || undefined,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: name.trim(),
        type,
        location: location.trim(),
        openTime,
        closeTime,
        slotDuration: Number(slotDuration),
        maxUsers: Number(maxUsers),
        fee: Number(fee),
        status,
        rules: rules.trim() || undefined,
        description: description.trim() || undefined,
      });
    }

    onOpenChange(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-blue-600" />
              {isEditing ? 'Cập nhật Cấu hình Tiện ích' : 'Thêm mới Tiện ích Cư dân'}
            </DialogTitle>
            <DialogDescription>
              Thiết lập khung giờ hoạt động, sức chứa tối đa và phí sử dụng cho tiện ích nội khu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tên tiện ích <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="VD: Hồ bơi vô cực chân mây Tầng 5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Phân loại tiện ích <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FacilityType)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(FACILITY_TYPE_LABELS).map(([t, label]) => (
                  <option key={t} value={t}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Trạng thái vận hành
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FacilityStatus)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(FACILITY_STATUS_LABELS).map(([st, label]) => (
                  <option key={st} value={st}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Vị trí lắp đặt / Khu vực <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="VD: Tầng 5 - Khu tiện ích ngoài trời Tháp Sky Oasis"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Giờ mở cửa (HH:mm) <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="06:00"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Giờ đóng cửa (HH:mm) <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="22:00"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Thời lượng mỗi lượt / slot (phút)
              </label>
              <Input
                type="number"
                min="15"
                step="15"
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-slate-400">VD: 60 phút hoặc 120 phút</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sức chứa tối đa / slot (người)
              </label>
              <Input
                type="number"
                min="1"
                value={maxUsers}
                onChange={(e) => setMaxUsers(Number(e.target.value))}
                required
              />
              <span className="text-[10px] text-slate-400">
                1: Độc quyền (BBQ/Sân/Họp), &gt;1: Chia sẻ (Gym/Bơi)
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Phí dịch vụ mỗi slot (VNĐ)
              </label>
              <Input
                type="number"
                min="0"
                step="10000"
                placeholder="0 (Miễn phí)"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mô tả giới thiệu tiện ích
              </label>
              <textarea
                rows={2}
                placeholder="Thông tin cơ sở vật chất, trang thiết bị đi kèm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nội quy & Hướng dẫn sử dụng
              </label>
              <textarea
                rows={3}
                placeholder="- Yêu cầu trang phục, bảo quản tài sản, khung giờ giới nghiêm..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditing ? (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Cập nhật tiện ích
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm tiện ích
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
