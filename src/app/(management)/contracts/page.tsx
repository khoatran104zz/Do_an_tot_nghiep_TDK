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
import { Plus, Edit, Trash2, Eye, FileText, Calendar, Building, User, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import {
  useContracts,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
} from '@/hooks/use-contracts';
import { useApartments } from '@/hooks/use-apartments';
import { useResidents } from '@/hooks/use-residents';
import { ContractStatus, ContractType } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Sorting & Selection
  const [sortKey, setSortKey] = useState<string>('contractCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Dialog & Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    contractCode: '',
    apartmentId: '',
    residentId: '',
    type: 'RENT' as ContractType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    monthlyRent: 8000000,
    deposit: 16000000,
    status: 'ACTIVE' as ContractStatus,
    note: '',
  });

  // Queries
  const { data: response, isLoading, isError, error, refetch } = useContracts({
    search: search || undefined,
    type: (typeFilter as ContractType) || undefined,
    status: (statusFilter as ContractStatus) || undefined,
    expiringSoon: expiringSoonFilter,
    page,
    limit: 10,
  });

  const { data: apartmentsRes } = useApartments({ limit: 100 });
  const { data: residentsRes } = useResidents({ limit: 100 });

  const apartments = apartmentsRes?.data || [];
  const residents = residentsRes?.data || [];

  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const deleteMutation = useDeleteContract();

  const contracts = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };
  const hasActiveFilters = Boolean(search || typeFilter || statusFilter || expiringSoonFilter);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setExpiringSoonFilter(false);
    setPage(1);
    setSelectedRowIds([]);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      contractCode: `HD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      apartmentId: apartments[0]?.id || '',
      residentId: residents[0]?.id || '',
      type: 'RENT',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      monthlyRent: 8000000,
      deposit: 16000000,
      status: 'ACTIVE',
      note: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      contractCode: item.contractCode,
      apartmentId: item.apartmentId,
      residentId: item.residentId,
      type: item.type,
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: new Date(item.endDate).toISOString().split('T')[0],
      monthlyRent: item.monthlyRent || 0,
      deposit: item.deposit || 0,
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
            toast.success(`Đã cập nhật hợp đồng ${formData.contractCode}`);
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
          toast.success(`Đã tạo mới hợp đồng ${formData.contractCode}`);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          toast.success('Đã xóa hợp đồng thành công');
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
    if (selectedRowIds.length === contracts.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(contracts.map((c: any) => c.id));
    }
  };

  // Active filter tags for FilterBar
  const activeTags = [];
  if (typeFilter) {
    activeTags.push({
      key: 'type',
      label: 'Loại HĐ',
      valueLabel: typeFilter === 'SALE' ? 'Mua bán' : 'Cho thuê',
      onRemove: () => setTypeFilter(''),
    });
  }
  if (statusFilter) {
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel:
        statusFilter === 'ACTIVE'
          ? 'Đang hiệu lực'
          : statusFilter === 'EXPIRED'
          ? 'Hết hạn'
          : 'Đã thanh lý',
      onRemove: () => setStatusFilter(''),
    });
  }
  if (expiringSoonFilter) {
    activeTags.push({
      key: 'expiringSoon',
      label: 'Thời hạn',
      valueLabel: 'Sắp hết hạn (<30 ngày)',
      onRemove: () => setExpiringSoonFilter(false),
    });
  }

  // Drawer detail items
  const drawerItems: DetailItem[] = inspectingItem
    ? [
        { label: 'Số hợp đồng', value: inspectingItem.contractCode, icon: FileText },
        { label: 'Căn hộ áp dụng', value: inspectingItem.apartment?.code || '—', icon: Building },
        { label: 'Chủ thể hợp đồng', value: inspectingItem.resident?.fullName || '—', icon: User },
        { label: 'Loại hợp đồng', value: inspectingItem.type === 'SALE' ? 'Mua bán vĩnh viễn' : 'Thuê căn hộ' },
        { label: 'Thời gian hiệu lực', value: `${formatDate(inspectingItem.startDate)} → ${formatDate(inspectingItem.endDate)}`, icon: Calendar },
        { label: 'Tiền thuê hàng tháng', value: inspectingItem.monthlyRent ? formatCurrency(inspectingItem.monthlyRent) : '—', icon: DollarSign },
        { label: 'Tiền đặt cọc', value: inspectingItem.deposit ? formatCurrency(inspectingItem.deposit) : '—', icon: DollarSign },
        { label: 'Ghi chú điều khoản', value: inspectingItem.note || 'Không có ghi chú thêm', fullWidth: true },
      ]
    : [];

  const columns: Column<any>[] = [
    {
      header: 'Số Hợp đồng',
      accessorKey: 'contractCode',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs">
          {row.contractCode}
        </span>
      ),
    },
    {
      header: 'Căn hộ',
      cell: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
          {row.apartment?.code || '—'}
        </span>
      ),
    },
    {
      header: 'Cư dân ký kết',
      cell: (row) => (
        <div>
          <span className="font-medium text-slate-900 dark:text-slate-100 block text-xs">
            {row.resident?.fullName || '—'}
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">
            {row.resident?.phone}
          </span>
        </div>
      ),
    },
    {
      header: 'Loại HĐ',
      accessorKey: 'type',
      cell: (row) => <StatusBadge type="contractType" status={row.type} />,
    },
    {
      header: 'Thời hạn',
      cell: (row) => {
        const isExpiring =
          row.status === 'ACTIVE' &&
          new Date(row.endDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 &&
          new Date(row.endDate).getTime() - new Date().getTime() > 0;
        return (
          <div className="space-y-0.5">
            <span className="text-xs text-slate-700 dark:text-slate-300 block">
              {formatDate(row.startDate)} - {formatDate(row.endDate)}
            </span>
            {isExpiring && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> Sắp hết hạn (&lt;30 ngày)
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Giá trị thuê',
      cell: (row) => (
        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
          {row.monthlyRent ? formatCurrency(row.monthlyRent) : '—'}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge type="contractStatus" status={row.status} />,
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
        title="Quản lý Hợp đồng"
        description="Theo dõi hợp đồng thuê và mua bán căn hộ, thời hạn hiệu lực, tiền cọc và cảnh báo hết hạn."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
          <Plus className="mr-1.5 h-4 w-4" /> Tạo Hợp đồng mới
        </Button>
      </PageHeader>

      {/* FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Hợp đồng"
      >
        <div className="w-44">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại HĐ</option>
            <option value="RENT">Cho thuê (RENT)</option>
            <option value="SALE">Mua bán (SALE)</option>
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
            <option value="ACTIVE">Đang hiệu lực</option>
            <option value="EXPIRED">Đã hết hạn</option>
            <option value="TERMINATED">Đã thanh lý</option>
          </Select>
        </div>

        <Button
          variant={expiringSoonFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setExpiringSoonFilter(!expiringSoonFilter);
            setPage(1);
          }}
          className="text-xs h-9 gap-1"
        >
          <Clock className="h-3.5 w-3.5" /> Sắp hết hạn (&lt;30 ngày)
        </Button>
      </FilterBar>

      {/* Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm mã hợp đồng..."
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
        title={inspectingItem?.contractCode || 'Chi tiết Hợp đồng'}
        description="Thông tin chi tiết thời hạn, điều khoản tài chính và chủ thể hợp đồng"
        badge={inspectingItem && <StatusBadge type="contractStatus" status={inspectingItem.status} />}
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
        title={editingItem ? `Chỉnh sửa: ${editingItem.contractCode}` : 'Tạo Hợp đồng mới'}
        description="Điền thông tin căn hộ, cư dân ký kết, thời hạn hợp đồng và mức phí"
        icon={FileText}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitText={editingItem ? 'Lưu thay đổi' : 'Tạo hợp đồng'}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số hợp đồng <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.contractCode}
              onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Loại hợp đồng</label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ContractType })}
            >
              <option value="RENT">Cho thuê (RENT)</option>
              <option value="SALE">Mua bán (SALE)</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Căn hộ áp dụng <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.apartmentId}
              onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
            >
              <option value="">Chọn căn hộ...</option>
              {apartments.map((apt: any) => (
                <option key={apt.id} value={apt.id}>
                  {apt.code} ({apt.building})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cư dân ký kết <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.residentId}
              onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
            >
              <option value="">Chọn cư dân...</option>
              {residents.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} ({r.phone})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ngày bắt đầu <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ngày kết thúc <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tiền thuê/tháng (VNĐ)</label>
            <Input
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tiền đặt cọc (VNĐ)</label>
            <Input
              type="number"
              value={formData.deposit}
              onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trạng thái hợp đồng</label>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
          >
            <option value="ACTIVE">Đang hiệu lực</option>
            <option value="EXPIRED">Đã hết hạn</option>
            <option value="TERMINATED">Đã thanh lý</option>
          </Select>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa hợp đồng?"
        description="Thao tác này sẽ xóa vĩnh viễn hợp đồng khỏi hệ thống dữ liệu tòa nhà. Không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
