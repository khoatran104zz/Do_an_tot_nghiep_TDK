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
import { Plus, Edit, Trash2, Eye, Building2, Users, Layers, Maximize2, BedDouble, Bath, FileText } from 'lucide-react';
import {
  useApartments,
  useCreateApartment,
  useUpdateApartment,
  useDeleteApartment,
} from '@/hooks/use-apartments';
import { ApartmentStatus } from '@prisma/client';
import { toast } from 'sonner';

export default function ApartmentsPage() {
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Sorting
  const [sortKey, setSortKey] = useState<string>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Row selection
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Dialog & Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<any>(null);

  // Form state
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
    setSelectedRowIds([]);
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
        {
          onSuccess: () => {
            setIsFormOpen(false);
            toast.success(`Đã cập nhật căn hộ ${formData.code}`);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
          toast.success(`Đã tạo mới căn hộ ${formData.code}`);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          toast.success('Đã xóa căn hộ thành công');
        },
      });
    }
  };

  // Row selection handler
  const handleSelectRow = (id: string | number) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === apartments.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(apartments.map((a: any) => a.id));
    }
  };

  // Active filter tags for FilterBar
  const activeTags = [];
  if (buildingFilter) {
    activeTags.push({
      key: 'building',
      label: 'Tòa nhà',
      valueLabel: buildingFilter,
      onRemove: () => setBuildingFilter(''),
    });
  }
  if (statusFilter) {
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel:
        statusFilter === 'OCCUPIED'
          ? 'Đang ở'
          : statusFilter === 'UNDER_MAINTENANCE'
          ? 'Đang sửa chữa'
          : 'Đang trống',
      onRemove: () => setStatusFilter(''),
    });
  }

  // Inspect Drawer detail items
  const drawerItems: DetailItem[] = inspectingItem
    ? [
        { label: 'Mã căn hộ', value: inspectingItem.code, icon: Building2 },
        { label: 'Tòa nhà & Tầng', value: `${inspectingItem.building} - Tầng ${inspectingItem.floor}`, icon: Layers },
        { label: 'Diện tích sàn', value: `${inspectingItem.area} m²`, icon: Maximize2 },
        { label: 'Cấu trúc căn hộ', value: `${inspectingItem.bedrooms} PN, ${inspectingItem.bathrooms} PT`, icon: BedDouble },
        { label: 'Số cư dân hiện tại', value: `${inspectingItem._count?.residents || 0} người`, icon: Users },
        { label: 'Ghi chú', value: inspectingItem.note || 'Không có ghi chú thêm', fullWidth: true },
      ]
    : [];

  const columns: Column<any>[] = [
    {
      header: 'Mã Căn hộ',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Tòa & Tầng',
      accessorKey: 'building',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.building}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Tầng {row.floor}</span>
        </div>
      ),
    },
    {
      header: 'Diện tích',
      accessorKey: 'area',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">{row.area} m²</span>
      ),
    },
    {
      header: 'Cấu trúc',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.bedrooms} PN, {row.bathrooms} PT
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge type="apartment" status={row.status} />,
    },
    {
      header: 'Cư dân',
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>{row._count?.residents || 0} người</span>
        </div>
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
        title="Quản lý Căn hộ"
        description="Quản lý danh mục căn hộ, cơ cấu phòng, trạng thái ở và theo dõi cư dân từng căn hộ."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
          <Plus className="mr-1.5 h-4 w-4" /> Thêm Căn hộ mới
        </Button>
      </PageHeader>

      {/* Standard FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Căn hộ"
      >
        <div className="w-44">
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

        <div className="w-44">
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
      </FilterBar>

      {/* Enterprise DataTable */}
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
        bulkActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.info(`Đã áp dụng thao tác cho ${selectedRowIds.length} căn hộ`);
              setSelectedRowIds([]);
            }}
            className="text-xs h-7"
          >
            Bỏ chọn
          </Button>
        }
      />

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        open={Boolean(inspectingItem)}
        onOpenChange={(open) => !open && setInspectingItem(null)}
        title={inspectingItem ? `Căn hộ ${inspectingItem.code}` : ''}
        description="Thông tin chi tiết hồ sơ căn hộ, cư dân và trạng thái"
        badge={inspectingItem && <StatusBadge type="apartment" status={inspectingItem.status} />}
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

      {/* Form Dialog for Create & Edit */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingItem ? `Chỉnh sửa căn hộ ${editingItem.code}` : 'Thêm Căn hộ mới'}
        description="Điền thông tin mã căn hộ, tòa nhà, tầng, diện tích và cơ cấu phòng"
        icon={Building2}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitText={editingItem ? 'Lưu thay đổi' : 'Tạo mới căn hộ'}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mã căn hộ <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: A-1001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tòa nhà <span className="text-rose-500">*</span>
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tầng <span className="text-rose-500">*</span>
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Diện tích (m²) <span className="text-rose-500">*</span>
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trạng thái</label>
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Số phòng ngủ</label>
            <Input
              type="number"
              min={1}
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Số phòng tắm</label>
            <Input
              type="number"
              min={1}
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ghi chú thêm</label>
          <Input
            placeholder="Nội thất bàn giao, hướng ban công..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa căn hộ?"
        description="Thao tác này sẽ xóa vĩnh viễn thông tin căn hộ khỏi hệ thống. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
