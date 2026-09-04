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
import { Plus, Edit, Trash2, User, Phone, Mail, Home, CreditCard, RotateCcw } from 'lucide-react';
import {
  useResidents,
  useCreateResident,
  useUpdateResident,
  useDeleteResident,
} from '@/hooks/use-residents';
import { useApartments } from '@/hooks/use-apartments';
import { ResidentRelationship, ResidentStatus } from '@prisma/client';

export default function ResidentsPage() {
  const [search, setSearch] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    identityCard: '',
    phone: '',
    email: '',
    gender: 'Nam',
    relationshipToOwner: 'OWNER' as ResidentRelationship,
    status: 'RESIDING' as ResidentStatus,
    apartmentId: '',
  });

  // Queries
  const { data: response, isLoading, isError, error, refetch } = useResidents({
    search: search || undefined,
    relationshipToOwner: (relationshipFilter as ResidentRelationship) || undefined,
    status: (statusFilter as ResidentStatus) || undefined,
    page,
    limit: 10,
  });

  const { data: apartmentsRes } = useApartments({ limit: 100 });
  const apartmentOptions = apartmentsRes?.data || [];

  const createMutation = useCreateResident();
  const updateMutation = useUpdateResident();
  const deleteMutation = useDeleteResident();

  const residents = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };
  const hasActiveFilters = Boolean(search || relationshipFilter || statusFilter);

  const handleResetFilters = () => {
    setSearch('');
    setRelationshipFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      fullName: '',
      identityCard: '',
      phone: '',
      email: '',
      gender: 'Nam',
      relationshipToOwner: 'OWNER',
      status: 'RESIDING',
      apartmentId: apartmentOptions[0]?.id || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      fullName: item.fullName,
      identityCard: item.identityCard,
      phone: item.phone,
      email: item.email || '',
      gender: item.gender || 'Nam',
      relationshipToOwner: item.relationshipToOwner,
      status: item.status,
      apartmentId: item.apartmentId || '',
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

  const renderRelationshipBadge = (rel: ResidentRelationship) => {
    switch (rel) {
      case 'OWNER':
        return <Badge variant="default">Chủ hộ</Badge>;
      case 'FAMILY':
        return <Badge variant="secondary">Thân nhân</Badge>;
      case 'TENANT':
      default:
        return <Badge variant="outline">Khách thuê</Badge>;
    }
  };

  const renderStatusBadge = (status: ResidentStatus) => {
    switch (status) {
      case 'RESIDING':
        return <Badge variant="success">Đang cư trú</Badge>;
      case 'TEMPORARY_ABSENT':
        return <Badge variant="warning">Tạm vắng</Badge>;
      case 'MOVED_OUT':
      default:
        return <Badge variant="destructive">Đã chuyển đi</Badge>;
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Họ và Tên',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">{row.fullName}</span>
            <span className="text-xs text-slate-400">{row.gender || 'Chưa cập nhật'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Số CCCD/CMND',
      accessorKey: 'identityCard',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {row.identityCard}
        </span>
      ),
    },
    {
      header: 'Liên hệ',
      cell: (row) => (
        <div className="space-y-0.5 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{row.phone}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-1 text-slate-400">
              <Mail className="h-3 w-3" />
              <span>{row.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Căn hộ',
      cell: (row) =>
        row.apartment ? (
          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
            {row.apartment.code}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Chưa gắn</span>
        ),
    },
    {
      header: 'Quan hệ',
      cell: (row) => renderRelationshipBadge(row.relationshipToOwner),
    },
    {
      header: 'Trạng thái',
      cell: (row) => renderStatusBadge(row.status),
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
            title={`Chỉnh sửa hồ sơ ${row.fullName}`}
            aria-label={`Chỉnh sửa hồ sơ ${row.fullName}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingId(row.id)}
            className="h-9 w-9 min-h-[36px] min-w-[36px] text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600/30"
            title={`Xóa cư dân ${row.fullName}`}
            aria-label={`Xóa cư dân ${row.fullName}`}
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
        title="Quản lý Cư dân"
        description="Quản lý hồ sơ cư dân, CCCD, thông tin liên hệ và phân quyền cư trú."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Thêm Cư dân mới
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Lọc Quan hệ Chủ hộ</label>
            <Select
              value={relationshipFilter}
              onChange={(e) => {
                setRelationshipFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="OWNER">Chủ hộ</option>
              <option value="FAMILY">Thân nhân gia đình</option>
              <option value="TENANT">Người thuê nhà</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Trạng thái Cư trú</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="RESIDING">Đang cư trú</option>
              <option value="TEMPORARY_ABSENT">Tạm vắng</option>
              <option value="MOVED_OUT">Đã chuyển đi</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tổng số cư dân</label>
            <div className="h-9 flex items-center justify-between px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
              <span>{meta.total} Cư dân</span>
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
        data={residents}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm theo tên, SĐT, CCCD..."
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
          <DialogTitle>{editingItem ? 'Chỉnh sửa Hồ sơ Cư dân' : 'Thêm mới Hồ sơ Cư dân'}</DialogTitle>
          <DialogDescription>
            Nhập đầy đủ thông tin định danh cá nhân và gán vào căn hộ tương ứng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Họ và Tên <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Số CCCD/CMND <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="012345678901"
                value={formData.identityCard}
                onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="0987654321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Địa chỉ Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Giới tính</label>
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Gán Căn hộ <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.apartmentId}
                onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                required
              >
                <option value="">-- Chọn căn hộ --</option>
                {apartmentOptions.map((apt: any) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.code} ({apt.building} - Tầng {apt.floor})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Quan hệ với Chủ hộ</label>
              <Select
                value={formData.relationshipToOwner}
                onChange={(e) => setFormData({ ...formData, relationshipToOwner: e.target.value as ResidentRelationship })}
              >
                <option value="OWNER">Chủ hộ</option>
                <option value="FAMILY">Thân nhân</option>
                <option value="TENANT">Người thuê nhà</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Trạng thái Cư trú</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ResidentStatus })}
            >
              <option value="RESIDING">Đang cư trú</option>
              <option value="TEMPORARY_ABSENT">Tạm vắng</option>
              <option value="MOVED_OUT">Đã chuyển đi</option>
            </Select>
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
                : 'Thêm Cư dân'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa cư dân?"
        description="Xóa thông tin cư dân khỏi danh sách tòa nhà. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
