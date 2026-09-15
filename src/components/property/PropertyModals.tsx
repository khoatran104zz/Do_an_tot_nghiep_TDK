'use client';

import React, { useState, useEffect } from 'react';
import { FormDialog } from '@/components/shared/FormDialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ApartmentStatus } from '@prisma/client';

// ==========================================
// 1. BUILDING FORM MODAL
// ==========================================
interface BuildingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export function BuildingFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: BuildingFormModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        address: initialData.address || '',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        address: '',
        description: '',
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Chỉnh Sửa Tòa Nhà' : 'Thêm Tòa Nhà Mới'}
      description="Quản lý thông tin tổng thể khu/tổ hợp chung cư"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold block mb-1">Mã Tòa Nhà *</label>
          <Input
            placeholder="VD: SMART-CITY"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="font-mono uppercase"
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Tên Tòa Nhà / Khu Chung Cư *</label>
          <Input
            placeholder="VD: Tổ hợp SmartCity Landmark"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Địa Chỉ</label>
          <Input
            placeholder="VD: Số 108 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Mô Tả / Giới Thiệu</label>
          <textarea
            className="w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Khu phức hợp căn hộ thông minh cao cấp..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
    </FormDialog>
  );
}

// ==========================================
// 2. BLOCK FORM MODAL
// ==========================================
interface BlockFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  buildingId: string;
  initialData?: any;
  isLoading?: boolean;
}

export function BlockFormModal({
  open,
  onOpenChange,
  onSubmit,
  buildingId,
  initialData,
  isLoading,
}: BlockFormModalProps) {
  const [formData, setFormData] = useState({
    buildingId,
    code: '',
    name: '',
    totalFloors: 25,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        buildingId: initialData.buildingId || buildingId,
        code: initialData.code || '',
        name: initialData.name || '',
        totalFloors: initialData.totalFloors || 25,
      });
    } else {
      setFormData({
        buildingId,
        code: '',
        name: '',
        totalFloors: 25,
      });
    }
  }, [initialData, buildingId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Chỉnh Sửa Khối Tháp' : 'Thêm Khối Tháp Mới'}
      description="Quản lý khối tháp (Tower/Block) trực thuộc tòa nhà"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold block mb-1">Mã Khối Tháp *</label>
          <Input
            placeholder="VD: BLOCK-A"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="font-mono uppercase"
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Tên Khối Tháp *</label>
          <Input
            placeholder="VD: Tháp A (Sky Tower)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Tổng Số Tầng Thiết Kế *</label>
          <Input
            type="number"
            min={1}
            max={100}
            value={formData.totalFloors}
            onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value, 10) || 1 })}
            required
          />
        </div>
      </div>
    </FormDialog>
  );
}

// ==========================================
// 3. FLOOR FORM MODAL
// ==========================================
interface FloorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  blockId: string;
  suggestedFloorNumber?: number;
  initialData?: any;
  isLoading?: boolean;
}

export function FloorFormModal({
  open,
  onOpenChange,
  onSubmit,
  blockId,
  suggestedFloorNumber = 1,
  initialData,
  isLoading,
}: FloorFormModalProps) {
  const [formData, setFormData] = useState({
    blockId,
    floorNumber: suggestedFloorNumber,
    name: `Tầng ${suggestedFloorNumber.toString().padStart(2, '0')}`,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        blockId: initialData.blockId || blockId,
        floorNumber: initialData.floorNumber || suggestedFloorNumber,
        name: initialData.name || `Tầng ${initialData.floorNumber}`,
      });
    } else {
      setFormData({
        blockId,
        floorNumber: suggestedFloorNumber,
        name: `Tầng ${suggestedFloorNumber.toString().padStart(2, '0')}`,
      });
    }
  }, [initialData, blockId, suggestedFloorNumber, open]);

  const handleFloorNumChange = (num: number) => {
    setFormData({
      ...formData,
      floorNumber: num,
      name: `Tầng ${num.toString().padStart(2, '0')}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Chỉnh Sửa Tầng Lầu' : 'Thêm Tầng Lầu Mới'}
      description="Quản lý tầng lầu trong khối tháp"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold block mb-1">Số Tầng (Thứ tự) *</label>
          <Input
            type="number"
            min={1}
            max={100}
            value={formData.floorNumber}
            onChange={(e) => handleFloorNumChange(parseInt(e.target.value, 10) || 1)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Tên Tầng Hiển Thị *</label>
          <Input
            placeholder="VD: Tầng 10"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>
    </FormDialog>
  );
}

// ==========================================
// 4. APARTMENT FORM MODAL
// ==========================================
interface ApartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  defaultFloorId?: string;
  hierarchy?: any[];
  isLoading?: boolean;
}

export function ApartmentFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  defaultFloorId,
  hierarchy = [],
  isLoading,
}: ApartmentFormModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    building: 'Tòa A',
    floor: 1,
    floorId: defaultFloorId || '',
    bedrooms: 2,
    bathrooms: 2,
    area: 75,
    status: 'VACANT' as ApartmentStatus,
    note: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        building: initialData.building || 'Tòa A',
        floor: initialData.floor || 1,
        floorId: initialData.floorId || defaultFloorId || '',
        bedrooms: initialData.bedrooms || 2,
        bathrooms: initialData.bathrooms || 2,
        area: initialData.area || 75,
        status: initialData.status || 'VACANT',
        note: initialData.note || '',
      });
    } else {
      setFormData({
        code: '',
        building: 'Tòa A',
        floor: 1,
        floorId: defaultFloorId || '',
        bedrooms: 2,
        bathrooms: 2,
        area: 75,
        status: 'VACANT',
        note: '',
      });
    }
  }, [initialData, defaultFloorId, open]);

  // Flatten floors list for select
  const floorOptions: Array<{ id: string; label: string; floorNumber: number; blockName: string }> = [];
  hierarchy.forEach((b) => {
    (b.blocks || []).forEach((blk: any) => {
      (blk.floors || []).forEach((flr: any) => {
        floorOptions.push({
          id: flr.id,
          label: `${b.name} - ${blk.name} - ${flr.name}`,
          floorNumber: flr.floorNumber,
          blockName: blk.name,
        });
      });
    });
  });

  const handleSelectFloor = (selectedFloorId: string) => {
    const found = floorOptions.find((f) => f.id === selectedFloorId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        floorId: selectedFloorId,
        floor: found.floorNumber,
        building: found.blockName,
      }));
    } else {
      setFormData((prev) => ({ ...prev, floorId: selectedFloorId }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Chỉnh Sửa Căn Hộ' : 'Thêm Căn Hộ Mới'}
      description="Quản lý thông tin căn hộ vật lý"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Floor selector if hierarchy available */}
        {floorOptions.length > 0 && (
          <div>
            <label className="text-xs font-semibold block mb-1">Vị Trí Tầng Trực Thuộc *</label>
            <Select
              value={formData.floorId}
              onChange={(e) => handleSelectFloor(e.target.value)}
              className="text-xs"
              required
            >
              <option value="">-- Chọn Tầng Lầu --</option>
              {floorOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold block mb-1">Mã Căn Hộ *</label>
          <Input
            placeholder="VD: A-1001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="font-mono uppercase"
          />
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            Quy chuẩn: [Mã Tháp]-[Số tầng 2 số][Số căn 2 số] (VD: A-1001)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Diện Tích (m²) *</label>
            <Input
              type="number"
              step="0.1"
              min={1}
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Phòng Ngủ *</label>
            <Input
              type="number"
              min={1}
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value, 10) || 1 })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Phòng Tắm *</label>
            <Input
              type="number"
              min={1}
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value, 10) || 1 })}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Trạng Thái Căn Hộ *</label>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ApartmentStatus })}
            className="text-xs"
          >
            <option value="VACANT">Đang trống (Chưa bàn giao / chờ khách)</option>
            <option value="OCCUPIED">Đang ở (Có cư dân cư trú)</option>
            <option value="UNDER_MAINTENANCE">Đang bảo dưỡng / sửa chữa</option>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Ghi Chú Kỹ Thuật / Đặc Điểm</label>
          <Input
            placeholder="VD: Căn góc hướng Đông Nam, view hồ bơi..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
      </div>
    </FormDialog>
  );
}
