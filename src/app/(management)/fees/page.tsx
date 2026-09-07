'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FormDialog } from '@/components/shared/FormDialog';
import { DetailDrawer, DetailItem } from '@/components/shared/DetailDrawer';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, CreditCard, Shield, Layers, Tag } from 'lucide-react';
import {
  useFeeCategories,
  useCreateFeeCategory,
  useUpdateFeeCategory,
  useDeleteFeeCategory,
} from '@/hooks/use-fees';
import { FeeUnit } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function FeeCategoriesPage() {
  const [search, setSearch] = useState('');

  // Dialog & Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unit: 'PER_MONTH' as FeeUnit,
    unitPrice: 10000,
    description: '',
  });

  const { data: response, isLoading, isError, error, refetch } = useFeeCategories();
  const rawFeeCategories = response?.data || [];

  const createMutation = useCreateFeeCategory();
  const updateMutation = useUpdateFeeCategory();
  const deleteMutation = useDeleteFeeCategory();

  const filteredFeeCategories = rawFeeCategories.filter((f: any) =>
    search
      ? f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase())
      : true
  );

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
        {
          onSuccess: () => {
            setIsFormOpen(false);
            toast.success(`Đã cập nhật danh mục phí ${formData.name}`);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
          toast.success(`Đã thêm loại phí ${formData.name}`);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          toast.success('Đã xóa loại phí thành công');
        },
      });
    }
  };

  const renderUnitName = (unit: FeeUnit) => {
    switch (unit) {
      case 'PER_M2':
        return 'Theo diện tích (m²)';
      case 'PER_MONTH':
        return 'Theo tháng';
      case 'PER_VEHICLE':
        return 'Theo phương tiện';
      case 'PER_KWH':
        return 'Theo số điện (kWh)';
      case 'PER_M3':
        return 'Theo khối nước (m³)';
      case 'FIXED':
      default:
        return 'Cố định';
    }
  };

  // Drawer detail items
  const drawerItems: DetailItem[] = inspectingItem
    ? [
        { label: 'Mã danh mục', value: inspectingItem.code, icon: Tag },
        { label: 'Tên loại phí', value: inspectingItem.name, icon: CreditCard },
        { label: 'Đơn vị tính', value: renderUnitName(inspectingItem.unit), icon: Layers },
        { label: 'Đơn giá định mức', value: formatCurrency(inspectingItem.unitPrice), icon: CreditCard },
        { label: 'Phân loại', value: inspectingItem.isSystem ? 'Phí hệ thống cố định' : 'Phí tùy chỉnh' },
        { label: 'Mô tả chi tiết', value: inspectingItem.description || 'Chưa có mô tả', fullWidth: true },
      ]
    : [];

  const columns: Column<any>[] = [
    {
      header: 'Mã Phí',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Tên Khoản Phí',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
            {row.name}
          </span>
          {row.isSystem && (
            <Badge variant="outline" size="sm" className="text-[10px]">
              Mặc định
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Đơn vị tính',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {renderUnitName(row.unit)}
        </span>
      ),
    },
    {
      header: 'Đơn giá (VNĐ)',
      accessorKey: 'unitPrice',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      header: 'Mô tả',
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">
          {row.description || '—'}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setInspectingItem(row)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenEdit(row)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!row.isSystem && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeletingId(row.id)}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
              title="Xóa"
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
        title="Danh mục Biểu phí"
        description="Quản lý các loại định mức phí dịch vụ tòa nhà, phí gửi xe, điện, nước và đơn giá áp dụng."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
          <Plus className="mr-1.5 h-4 w-4" /> Thêm Loại phí mới
        </Button>
      </PageHeader>

      {/* Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={filteredFeeCategories}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm kiếm tên loại phí hoặc mã..."
        searchValue={search}
        onSearchChange={(val) => setSearch(val)}
        onRowClick={(row) => setInspectingItem(row)}
        enableColumnVisibility
      />

      {/* Detail Drawer */}
      <DetailDrawer
        open={Boolean(inspectingItem)}
        onOpenChange={(open) => !open && setInspectingItem(null)}
        title={inspectingItem?.name || 'Chi tiết Loại phí'}
        description="Thông tin cấu hình đơn giá và phương thức tính phí"
        badge={
          inspectingItem && (
            <Badge variant="info" size="sm">
              {inspectingItem.code}
            </Badge>
          )
        }
        items={drawerItems}
        footerActions={
          inspectingItem && (
            <Button
              size="sm"
              onClick={() => {
                const item = inspectingItem;
                setInspectingItem(null);
                handleOpenEdit(item);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Chỉnh sửa
            </Button>
          )
        }
      />

      {/* Form Dialog */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingItem ? `Chỉnh sửa: ${editingItem.name}` : 'Thêm Loại phí mới'}
        description="Thiết lập mã khoản phí, tên hiển thị, đơn vị tính và đơn giá định mức"
        icon={CreditCard}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitText={editingItem ? 'Lưu thay đổi' : 'Tạo mới loại phí'}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mã loại phí <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: MGMT_PREMIUM"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              disabled={editingItem?.isSystem}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tên loại phí <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Phí quản lý cao cấp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Đơn vị tính <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as FeeUnit })}
            >
              <option value="PER_MONTH">Theo tháng (Cố định/tháng)</option>
              <option value="PER_M2">Theo diện tích (VNĐ/m²/tháng)</option>
              <option value="PER_VEHICLE">Theo phương tiện (VNĐ/xe/tháng)</option>
              <option value="PER_KWH">Theo lượng điện (VNĐ/kWh)</option>
              <option value="PER_M3">Theo khối nước (VNĐ/m³)</option>
              <option value="FIXED">Phí cố định 1 lần</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Đơn giá (VNĐ) <span className="text-rose-500">*</span>
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
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mô tả quy định áp dụng</label>
          <Input
            placeholder="Quy định áp dụng, kỳ tính phí..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa loại phí?"
        description="Thao tác này sẽ xóa loại phí khỏi danh mục cấu hình. Các hóa đơn cũ đã phát hành sẽ không bị ảnh hưởng."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
