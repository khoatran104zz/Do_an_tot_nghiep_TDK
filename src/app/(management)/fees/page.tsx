'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import {
  useFeeCategories,
  useCreateFeeCategory,
  useUpdateFeeCategory,
  useDeleteFeeCategory,
} from '@/hooks/use-fees';
import { FeeUnit } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

export default function FeeCategoriesPage() {
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unit: 'PER_MONTH' as FeeUnit,
    unitPrice: 10000,
    description: '',
  });

  const { data: response, isLoading, isError, error, refetch } = useFeeCategories();
  const feeCategories = response?.data || [];

  const createMutation = useCreateFeeCategory();
  const updateMutation = useUpdateFeeCategory();
  const deleteMutation = useDeleteFeeCategory();

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      unit: 'PER_MONTH',
      unitPrice: 10000,
      description: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      unit: item.unit,
      unitPrice: item.unitPrice,
      description: item.description || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, data: formData },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  const renderUnitName = (unit: FeeUnit) => {
    switch (unit) {
      case 'PER_M2':
        return 'VNĐ / m² / tháng';
      case 'PER_VEHICLE':
        return 'VNĐ / xe / tháng';
      case 'PER_KWH':
        return 'VNĐ / kWh';
      case 'PER_M3':
        return 'VNĐ / m³';
      case 'PER_MONTH':
      default:
        return 'VNĐ / tháng';
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Mã danh mục',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Tên danh mục phí',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-500">{row.description || 'Không có mô tả'}</span>
        </div>
      ),
    },
    {
      header: 'Đơn vị tính',
      cell: (row) => <Badge variant="secondary">{renderUnitName(row.unit)}</Badge>,
    },
    {
      header: 'Đơn giá chuẩn',
      cell: (row) => (
        <span className="font-bold text-emerald-700">{formatCurrency(row.unitPrice)}</span>
      ),
    },
    {
      header: 'Thao tác',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(row)}
            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!row.isSystem && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingId(row.id)}
              className="h-8 w-8 text-red-600 hover:bg-red-50"
              title="Xóa danh mục"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục Phí dịch vụ"
        description="Cấu hình đơn giá dịch vụ: phí quản lý chung cư, phí gửi xe máy/ô tô, điện, nước..."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Thêm Danh mục phí
        </Button>
      </PageHeader>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={feeCategories}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        emptyTitle="Chưa có danh mục phí nào"
        emptyDescription="Bấm nút 'Thêm Danh mục phí' để cấu hình bảng giá thu dịch vụ tòa nhà."
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Chỉnh sửa Danh mục phí' : 'Thêm Danh mục phí mới'}</DialogTitle>
          <DialogDescription>
            Thiết lập tên phí, đơn vị tính và mức đơn giá áp dụng cho toàn bộ tòa nhà.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Mã danh mục <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="MGMT, WATER..."
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Tên loại phí <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Phí dịch vụ quản lý..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Đơn vị tính <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as FeeUnit })}
              >
                <option value="PER_M2">VNĐ / m² / tháng (Phí quản lý)</option>
                <option value="PER_MONTH">VNĐ / tháng (Cố định)</option>
                <option value="PER_VEHICLE">VNĐ / xe / tháng (Phí gửi xe)</option>
                <option value="PER_KWH">VNĐ / kWh (Tiền điện)</option>
                <option value="PER_M3">VNĐ / m³ (Tiền nước)</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Đơn giá áp dụng (VNĐ) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={0}
                step="1000"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Mô tả ngắn</label>
            <Input
              placeholder="Ghi chú diễn giải cách tính phí..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Đang lưu...'
                : editingItem
                ? 'Cập nhật'
                : 'Thêm Phí mới'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xóa danh mục phí?"
        description="Xóa loại phí dịch vụ khỏi danh sách. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
