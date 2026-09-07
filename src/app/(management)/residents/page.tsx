'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailDrawer, DetailItem } from '@/components/shared/DetailDrawer';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, Eye, User, Phone, Mail, Home, CreditCard, Calendar } from 'lucide-react';
import {
  useResidents,
  useCreateResident,
  useUpdateResident,
  useDeleteResident,
} from '@/hooks/use-residents';
import { useApartments } from '@/hooks/use-apartments';
import { ResidentRelationship, ResidentStatus } from '@prisma/client';
import { toast } from 'sonner';

export default function ResidentsPage() {
  const [search, setSearch] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Sorting & Selection
  const [sortKey, setSortKey] = useState<string>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Dialog & Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<any>(null);

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
    setSelectedRowIds([]);
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
        {
          onSuccess: () => {
            setIsFormOpen(false);
            toast.success(`Đã cập nhật cư dân ${formData.fullName}`);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
          toast.success(`Đã thêm cư dân ${formData.fullName}`);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          toast.success('Đã xóa hồ sơ cư dân thành công');
        },
      });
    }
  };

  const handleSelectRow = (id: string | number) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === residents.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(residents.map((r: any) => r.id));
    }
  };

  // Active filter tags for FilterBar
  const activeTags = [];
  if (relationshipFilter) {
    activeTags.push({
      key: 'relationship',
      label: 'Quan hệ',
      valueLabel:
        relationshipFilter === 'OWNER'
          ? 'Chủ hộ'
          : relationshipFilter === 'FAMILY'
          ? 'Thân nhân'
          : 'Khách thuê',
      onRemove: () => setRelationshipFilter(''),
    });
  }
  if (statusFilter) {
    activeTags.push({
      key: 'status',
      label: 'Cư trú',
      valueLabel:
        statusFilter === 'RESIDING'
          ? 'Đang cư trú'
          : statusFilter === 'TEMPORARY_ABSENT'
          ? 'Tạm vắng'
          : 'Đã chuyển đi',
      onRemove: () => setStatusFilter(''),
    });
  }

  // Drawer detail items
  const drawerItems: DetailItem[] = inspectingItem
    ? [
        { label: 'Họ và tên', value: inspectingItem.fullName, icon: User },
        { label: 'Số CCCD / Hộ chiếu', value: inspectingItem.identityCard, icon: CreditCard },
        { label: 'Số điện thoại', value: inspectingItem.phone, icon: Phone },
        { label: 'Địa chỉ Email', value: inspectingItem.email || 'Chưa cung cấp', icon: Mail },
        { label: 'Căn hộ gắn kèm', value: inspectingItem.apartment?.code || 'Chưa gán', icon: Home },
        { label: 'Giới tính', value: inspectingItem.gender || 'Chưa xác định' },
      ]
    : [];

  const columns: Column<any>[] = [
    {
      header: 'Họ & Tên',
      accessorKey: 'fullName',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.fullName} size="default" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs sm:text-sm">
              {row.fullName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
              {row.identityCard}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Căn hộ',
      cell: (row) => (
        row.apartment ? (
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs">
            {row.apartment.code}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Chưa gắn</span>
        )
      ),
    },
    {
      header: 'Liên hệ',
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{row.phone}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Mail className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-[140px]">{row.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Quan hệ',
      accessorKey: 'relationshipToOwner',
      cell: (row) => <StatusBadge type="relationship" status={row.relationshipToOwner} />,
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge type="resident" status={row.status} />,
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
            title="Xem hồ sơ"
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeletingId(row.id)}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
            title="Xóa"
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
        title="Hồ sơ Cư dân"
        description="Quản lý định danh CCCD/Passport, thông tin liên lạc và mối quan hệ cư trú tại từng căn hộ."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
          <Plus className="mr-1.5 h-4 w-4" /> Thêm Cư dân mới
        </Button>
      </PageHeader>

      {/* FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Cư dân"
      >
        <div className="w-44">
          <Select
            value={relationshipFilter}
            onChange={(e) => {
              setRelationshipFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả quan hệ</option>
            <option value="OWNER">Chủ hộ</option>
            <option value="FAMILY">Thân nhân</option>
            <option value="TENANT">Khách thuê</option>
          </Select>
        </div>

        <div className="w-44">
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
      </FilterBar>

      {/* Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={residents}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm theo tên, SĐT hoặc CCCD..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={(p) => setPage(p)}
        onRowClick={(row) => setInspectingItem(row)}
        enableRowSelection
        selectedRowIds={selectedRowIds}
        onRowSelect={handleSelectRow}
        onSelectAll={handleSelectAll}
        enableColumnVisibility
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSortChange={(key, order) => {
          setSortKey(key);
          setSortOrder(order);
        }}
      />

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        open={Boolean(inspectingItem)}
        onOpenChange={(open) => !open && setInspectingItem(null)}
        title={inspectingItem?.fullName || 'Hồ sơ Cư dân'}
        description="Chi tiết thông tin định danh cá nhân và căn hộ cư trú"
        badge={inspectingItem && <StatusBadge type="resident" status={inspectingItem.status} />}
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
        title={editingItem ? `Chỉnh sửa: ${editingItem.fullName}` : 'Thêm Cư dân mới'}
        description="Điền thông tin định danh, liên lạc và gán căn hộ cho cư dân"
        icon={User}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitText={editingItem ? 'Lưu thay đổi' : 'Tạo hồ sơ cư dân'}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Nguyễn Văn An"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số CCCD / Hộ chiếu <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: 001201012345"
              value={formData.identityCard}
              onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="0912345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email liên lạc</label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gán vào Căn hộ <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.apartmentId}
              onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
            >
              <option value="">Chọn căn hộ...</option>
              {apartmentOptions.map((apt: any) => (
                <option key={apt.id} value={apt.id}>
                  {apt.code} ({apt.building} - Tầng {apt.floor})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Giới tính</label>
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quan hệ với chủ hộ</label>
            <Select
              value={formData.relationshipToOwner}
              onChange={(e) =>
                setFormData({ ...formData, relationshipToOwner: e.target.value as ResidentRelationship })
              }
            >
              <option value="OWNER">Chủ hộ</option>
              <option value="FAMILY">Thân nhân</option>
              <option value="TENANT">Khách thuê</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trạng thái cư trú</label>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as ResidentStatus })
              }
            >
              <option value="RESIDING">Đang cư trú</option>
              <option value="TEMPORARY_ABSENT">Tạm vắng</option>
              <option value="MOVED_OUT">Đã chuyển đi</option>
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa hồ sơ cư dân?"
        description="Thao tác này sẽ xóa thông tin cư dân khỏi căn hộ và hệ thống quản lý. Không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
