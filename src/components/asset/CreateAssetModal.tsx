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
import { useCreateAsset } from '@/hooks/use-assets';
import { useBuildingContext } from '@/context/BuildingContext';
import { AssetCategory, AssetStatus } from '@prisma/client';
import { ASSET_CATEGORY_LABELS, ASSET_STATUS_LABELS } from '@/modules/asset/asset.constants';
import { Loader2, Plus, Wrench } from 'lucide-react';

interface CreateAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildings?: Array<{ id: string; name: string }>;
}

export function CreateAssetModal({ open, onOpenChange, buildings = [] }: CreateAssetModalProps) {
  const { selectedBuildingId } = useBuildingContext();
  const createAsset = useCreateAsset();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('ELEVATOR');
  const [buildingId, setBuildingId] = useState(selectedBuildingId || '');
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [status, setStatus] = useState<AssetStatus>('OPERATIONAL');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    await createAsset.mutateAsync({
      code: code.trim() || undefined,
      name: name.trim(),
      category,
      buildingId: buildingId || undefined,
      location: location.trim(),
      supplier: supplier.trim() || undefined,
      installDate: installDate ? new Date(installDate) : undefined,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      status,
      description: description.trim() || undefined,
    });

    // Reset & close
    setCode('');
    setName('');
    setLocation('');
    setSupplier('');
    setInstallDate('');
    setWarrantyExpiry('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Wrench className="h-5 w-5 text-blue-600" />
              Thêm mới Tài sản / Thiết bị Tòa nhà
            </DialogTitle>
            <DialogDescription>
              Đăng ký trang thiết bị kỹ thuật vào hệ thống theo dõi vận hành & bảo trì định kỳ.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tên thiết bị <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="VD: Thang máy chở khách TM-01"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Mã tài sản (Để trống để tự tạo AST-...)
              </label>
              <Input
                placeholder="VD: AST-ELEV-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Phân loại thiết bị <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ASSET_CATEGORY_LABELS).map(([cat, label]) => (
                  <option key={cat} value={cat}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tòa nhà quản lý
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Toàn khu chung cư --</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Vị trí lắp đặt <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="VD: Tòa A - Trục thang máy số 1 (Tầng B2 đến Tầng 25)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nhà cung cấp / Đối tác kỹ thuật
              </label>
              <Input
                placeholder="VD: Schindler Việt Nam / Cummins VN"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Trạng thái vận hành ban đầu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ASSET_STATUS_LABELS).map(([st, label]) => (
                  <option key={st} value={st}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ngày đưa vào vận hành
              </label>
              <Input
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Hạn bảo hành chính hãng
              </label>
              <Input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Thông số kỹ thuật & Mô tả chi tiết
              </label>
              <textarea
                rows={3}
                placeholder="Thông số kỹ thuật, chu kỳ thay thế phụ tùng, khuyến nghị bảo trì..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAsset.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={createAsset.isPending}
            >
              {createAsset.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm thiết bị
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
