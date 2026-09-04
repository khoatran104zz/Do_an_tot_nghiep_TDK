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
import { Plus, Edit, Trash2, Building2, Layers, Users, Home, RotateCcw } from 'lucide-react';
import {
  useApartments,
  useCreateApartment,
  useUpdateApartment,
  useDeleteApartment,
} from '@/hooks/use-apartments';
import { ApartmentStatus } from '@prisma/client';

export default function ApartmentsPage() {
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    building: 'Tòa A',
    floor: 1,
    bedrooms: 2,
    bathrooms: 2,
    area: 75,
    status: 'VACANT' as ApartmentStatus,
    note: '',
  });

  // Queries & Mutations
  const { data: response, isLoading, isError, error, refetch } = useApartments({
    search: search || undefined,
    building: buildingFilter || undefined,
    status: (statusFilter as ApartmentStatus) || undefined,
    page,
    limit: 10,
  });

  const createMutation = useCreateApartment();
  const updateMutation = useUpdateApartment();
  const deleteMutation = useDeleteApartment();

  const apartments = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };
  const hasActiveFilters = Boolean(search || buildingFilter || statusFilter);

  const handleResetFilters = () => {
    setSearch('');
    setBuildingFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      building: 'Tòa A',
      floor: 1,
      bedrooms: 2,
      bathrooms: 2,
      area: 75,
      status: 'VACANT',
      note: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      building: item.building,
      floor: item.floor,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      area: item.area,
      status: item.status,
      note: item.note || '',
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

  const renderStatusBadge = (status: ApartmentStatus) => {
    switch (status) {
      case 'OCCUPIED':
        return <Badge variant="success">Đang ở</Badge>;
      case 'UNDER_MAINTENANCE':
        return <Badge variant="warning">Đang sửa chữa</Badge>;
      case 'VACANT':
      default:
        return <Badge variant="secondary">Đang trống</Badge>;
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Mã Căn hộ',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Tòa & Tầng',
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.building}</span>
          <span className="text-xs text-slate-500 block">Tầng {row.floor}</span>
        </div>
      ),
    },
    {
      header: 'Diện tích',
      cell: (row) => <span className="font-medium text-slate-700">{row.area} m²</span>,
    },
    {
      header: 'Cấu trúc',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.bedrooms} PN, {row.bathrooms} PT
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (row) => renderStatusBadge(row.status),
    },
    {
      header: 'Cư dân',
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>{row._count?.residents || 0} người</span>
        </div>
      ),
    },
    {
      header: 'Thao tác',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenEdit(row)}
            className="h-9 w-9 min-h-[36px] min-w-[36px] text-blue-600 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600/30"
            title={`Chỉnh sửa căn hộ ${row.code}`}
            aria-label={`Chỉnh sửa căn hộ ${row.code}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingId(row.id)}
            className="h-9 w-9 min-h-[36px] min-w-[36px] text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600/30"
            title={`Xóa căn hộ ${row.code}`}
            aria-label={`Xóa căn hộ ${row.code}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Căn hộ"
        description="Quản lý danh sách căn hộ, diện tích, trạng thái ở và cư dân trong tòa nhà."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Thêm Căn hộ mới
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Lọc theo Tòa nhà</label>
            <Select
              value={buildingFilter}
              onChange={(e) => {
                setBuildingFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả tòa nhà</option>
              <option value="Tòa A">Tòa A</option>
              <option value="Tòa B">Tòa B</option>
              <option value="Tòa C">Tòa C</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Lọc theo Trạng thái</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="VACANT">Đang trống</option>
              <option value="OCCUPIED">Đang ở</option>
              <option value="UNDER_MAINTENANCE">Đang sửa chữa</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tổng số bản ghi</label>
            <div className="h-9 flex items-center justify-between px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
              <span>{meta.total} Căn hộ</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Đặt lại
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={apartments}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm mã căn hộ (VD: A-1001)..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Chỉnh sửa Căn hộ' : 'Thêm mới Căn hộ'}</DialogTitle>
          <DialogDescription>
            Điền đầy đủ thông tin mã căn hộ, tòa nhà, diện tích và cấu trúc phòng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Mã căn hộ <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="A-1001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Tòa nhà <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              >
                <option value="Tòa A">Tòa A</option>
                <option value="Tòa B">Tòa B</option>
                <option value="Tòa C">Tòa C</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Tầng <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Diện tích (m²) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.1"
                min={10}
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Trạng thái</label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ApartmentStatus })}
              >
                <option value="VACANT">Đang trống</option>
                <option value="OCCUPIED">Đang ở</option>
                <option value="UNDER_MAINTENANCE">Đang sửa chữa</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Số phòng ngủ</label>
              <Input
                type="number"
                min={1}
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Số phòng tắm</label>
              <Input
                type="number"
                min={1}
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Ghi chú thêm</label>
            <Input
              placeholder="Ghi chú thiết bị, ban công..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                : 'Thêm Căn hộ'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa căn hộ?"
        description="Thao tác này sẽ xóa vĩnh viễn thông tin căn hộ khỏi hệ thống. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
