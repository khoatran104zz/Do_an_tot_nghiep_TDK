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
import { Plus, Edit, Trash2, FileText, Calendar, AlertCircle } from 'lucide-react';
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

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false);
  const [page, setPage] = useState(1);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const { data: response, isLoading } = useContracts({
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
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
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

  const isExpiringSoon = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const renderStatusBadge = (status: ContractStatus, endDateStr: string) => {
    if (status === 'ACTIVE' && isExpiringSoon(endDateStr)) {
      return <Badge variant="warning">Sắp hết hạn (&lt;30 ngày)</Badge>;
    }
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Đang hiệu lực</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Đã hết hạn</Badge>;
      case 'TERMINATED':
      default:
        return <Badge variant="destructive">Đã thanh lý</Badge>;
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Mã Hợp đồng',
      accessorKey: 'contractCode',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs">
          {row.contractCode}
        </span>
      ),
    },
    {
      header: 'Căn hộ',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
          {row.apartment?.code || '-'}
        </span>
      ),
    },
    {
      header: 'Cư dân đại diện',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.resident?.fullName || '-'}</span>
          <span className="text-xs text-slate-500">{row.resident?.phone}</span>
        </div>
      ),
    },
    {
      header: 'Loại HĐ',
      cell: (row) =>
        row.type === 'RENT' ? (
          <Badge variant="default">Cho thuê</Badge>
        ) : (
          <Badge variant="success">Mua bán</Badge>
        ),
    },
    {
      header: 'Thời hạn',
      cell: (row) => (
        <div className="text-xs text-slate-700 space-y-0.5">
          <div>{formatDate(row.startDate)} ➔ {formatDate(row.endDate)}</div>
        </div>
      ),
    },
    {
      header: 'Giá thuê / Tiền cọc',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-emerald-700 block">
            {formatCurrency(row.monthlyRent)}/tháng
          </span>
          <span className="text-slate-400">Cọc: {formatCurrency(row.deposit)}</span>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (row) => renderStatusBadge(row.status, row.endDate),
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
            title="Chỉnh sửa hợp đồng"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingId(row.id)}
            className="h-8 w-8 text-red-600 hover:bg-red-50"
            title="Xóa hợp đồng"
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
        description="Quản lý hợp đồng cho thuê/mua bán căn hộ, cảnh báo hợp đồng sắp hết hạn."
      >
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Tạo Hợp đồng mới
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Loại Hợp đồng</label>
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại HĐ</option>
            <option value="RENT">Hợp đồng thuê</option>
            <option value="SALE">Hợp đồng mua bán</option>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Trạng thái HĐ</label>
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

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Cảnh báo hết hạn</label>
          <button
            type="button"
            onClick={() => {
              setExpiringSoonFilter(!expiringSoonFilter);
              setPage(1);
            }}
            className={`h-9 w-full flex items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-all cursor-pointer ${
              expiringSoonFilter
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Sắp hết hạn (&lt;30 ngày)
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Tổng số Hợp đồng</label>
          <div className="h-9 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700">
            {meta.total} Hợp đồng
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        searchPlaceholder="Tìm mã HĐ, tên cư dân, căn hộ..."
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

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Chỉnh sửa Hợp đồng' : 'Tạo Hợp đồng mới'}</DialogTitle>
          <DialogDescription>
            Thiết lập thông tin thời hạn hợp đồng, giá thuê/mua và gán cư dân đại diện.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Mã hợp đồng (*)</label>
            <Input
              placeholder="HD-2026-001"
              value={formData.contractCode}
              onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Căn hộ (*)</label>
              <Select
                value={formData.apartmentId}
                onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                required
              >
                <option value="">-- Chọn Căn hộ --</option>
                {apartments.map((apt: any) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.code} ({apt.building})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Cư dân đại diện (*)</label>
              <Select
                value={formData.residentId}
                onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                required
              >
                <option value="">-- Chọn Cư dân --</option>
                {residents.map((res: any) => (
                  <option key={res.id} value={res.id}>
                    {res.fullName} ({res.phone})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Loại Hợp đồng</label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ContractType })}
              >
                <option value="RENT">Cho thuê</option>
                <option value="SALE">Mua bán</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Ngày bắt đầu (*)</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Ngày kết thúc (*)</label>
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
              <label className="text-xs font-medium text-slate-700">Giá thuê hàng tháng (VNĐ)</label>
              <Input
                type="number"
                step="100000"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Tiền đặt cọc (VNĐ)</label>
              <Input
                type="number"
                step="100000"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Trạng thái Hợp đồng</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
            >
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="EXPIRED">Đã hết hạn</option>
              <option value="TERMINATED">Đã thanh lý</option>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Đang lưu...'
                : editingItem
                ? 'Cập nhật'
                : 'Tạo Hợp đồng'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa hợp đồng?"
        description="Thao tác này sẽ xóa hợp đồng khỏi hệ thống. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
