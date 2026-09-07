'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailDrawer, DetailItem } from '@/components/shared/DetailDrawer';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Receipt, DollarSign, CheckCircle2, Clock, Zap, Eye, Trash2, Calendar, Building, CreditCard } from 'lucide-react';
import {
  useInvoices,
  useGenerateMonthlyInvoices,
  useDeleteInvoice,
} from '@/hooks/use-invoices';
import { InvoiceStatus } from '@prisma/client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [billingMonthFilter, setBillingMonthFilter] = useState('2026-08');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Sorting & Selection
  const [sortKey, setSortKey] = useState<string>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Modal & Drawer states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Generate form state
  const [generateForm, setGenerateForm] = useState({
    billingMonth: '2026-08',
    dueDate: '2026-08-25',
  });

  // Queries
  const { data: response, isLoading, isError, error, refetch } = useInvoices({
    search: search || undefined,
    billingMonth: billingMonthFilter || undefined,
    status: (statusFilter as InvoiceStatus) || undefined,
    page,
    limit: 10,
  });

  const generateMutation = useGenerateMonthlyInvoices();
  const deleteMutation = useDeleteInvoice();

  const invoices = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };
  const hasActiveFilters = Boolean(search || statusFilter || billingMonthFilter !== '2026-08');

  const handleResetFilters = () => {
    setSearch('');
    setBillingMonthFilter('2026-08');
    setStatusFilter('');
    setPage(1);
    setSelectedRowIds([]);
  };

  // Financial aggregates
  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const paidAmount = invoices
    .filter((inv: any) => inv.status === 'PAID')
    .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(generateForm, {
      onSuccess: () => {
        setIsGenerateOpen(false);
        toast.success(`Đã phát hành hàng loạt hóa đơn cho kỳ ${generateForm.billingMonth}`);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          toast.success('Đã xóa hóa đơn thành công');
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
    if (selectedRowIds.length === invoices.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(invoices.map((inv: any) => inv.id));
    }
  };

  // Active filter tags for FilterBar
  const activeTags = [];
  if (billingMonthFilter) {
    activeTags.push({
      key: 'month',
      label: 'Kỳ thanh toán',
      valueLabel: billingMonthFilter,
      onRemove: () => setBillingMonthFilter(''),
    });
  }
  if (statusFilter) {
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel:
        statusFilter === 'PAID'
          ? 'Đã thanh toán'
          : statusFilter === 'OVERDUE'
          ? 'Quá hạn'
          : 'Chưa thanh toán',
      onRemove: () => setStatusFilter(''),
    });
  }

  // Drawer detail items
  const drawerItems: DetailItem[] = inspectingItem
    ? [
        { label: 'Mã hóa đơn', value: inspectingItem.code, icon: Receipt },
        { label: 'Căn hộ áp dụng', value: inspectingItem.apartment?.code || '—', icon: Building },
        { label: 'Kỳ thanh toán', value: `Tháng ${inspectingItem.billingMonth}`, icon: Calendar },
        { label: 'Hạn thanh toán', value: formatDate(inspectingItem.dueDate), icon: Clock },
        { label: 'Tổng tiền phải thu', value: formatCurrency(inspectingItem.totalAmount), icon: DollarSign },
        { label: 'Phương thức thanh toán', value: inspectingItem.paymentMethod ? <StatusBadge type="paymentMethod" status={inspectingItem.paymentMethod} /> : 'Chưa ghi nhận' },
        { label: 'Thời điểm thanh toán', value: inspectingItem.paidAt ? formatDateTime(inspectingItem.paidAt) : 'Chưa thanh toán' },
      ]
    : [];

  const columns: Column<any>[] = [
    {
      header: 'Mã Hóa đơn',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Căn hộ',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            {row.apartment?.code}
          </span>
          <span className="text-[11px] text-slate-400 block">{row.apartment?.building}</span>
        </div>
      ),
    },
    {
      header: 'Kỳ tháng',
      accessorKey: 'billingMonth',
      sortable: true,
      cell: (row) => <span className="font-medium text-xs text-slate-700 dark:text-slate-300">T{row.billingMonth}</span>,
    },
    {
      header: 'Hạn nộp',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(row.dueDate)}</span>
      ),
    },
    {
      header: 'Tổng tiền',
      accessorKey: 'totalAmount',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge type="invoice" status={row.status} />,
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
            title="Xem chi tiết các khoản"
          >
            <Eye className="h-4 w-4" />
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
        title="Quản lý Hóa đơn & Thu nợ"
        description="Theo dõi phát hành hóa đơn định kỳ, tiến độ thu phí dịch vụ và quản lý công nợ cư dân."
      >
        <Button
          onClick={() => setIsGenerateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
        >
          <Zap className="mr-1.5 h-4 w-4" /> Phát hành hàng loạt
        </Button>
      </PageHeader>

      {/* KPI Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Tổng phát hành kỳ này"
          value={formatCurrency(totalAmount)}
          icon={DollarSign}
          iconBgColor="bg-blue-50 dark:bg-blue-950/60"
          iconTextColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Đã thanh toán (Thực thu)"
          value={formatCurrency(paidAmount)}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50 dark:bg-emerald-950/60"
          iconTextColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Công nợ chưa thu"
          value={formatCurrency(unpaidAmount)}
          icon={Clock}
          iconBgColor="bg-amber-50 dark:bg-amber-950/60"
          iconTextColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Hóa đơn"
      >
        <div className="w-44">
          <Select
            value={billingMonthFilter}
            onChange={(e) => {
              setBillingMonthFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả các tháng</option>
            <option value="2026-08">Tháng 08/2026</option>
            <option value="2026-07">Tháng 07/2026</option>
            <option value="2026-06">Tháng 06/2026</option>
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
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="OVERDUE">Quá hạn</option>
          </Select>
        </div>
      </FilterBar>

      {/* Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm mã hóa đơn (VD: INV-202608)..."
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

      {/* Slide-over Detail Drawer with Invoice Items Breakdown */}
      <DetailDrawer
        open={Boolean(inspectingItem)}
        onOpenChange={(open) => !open && setInspectingItem(null)}
        title={inspectingItem?.code || 'Chi tiết Hóa đơn'}
        description={`Kỳ thanh toán ${inspectingItem?.billingMonth} - Căn hộ ${inspectingItem?.apartment?.code}`}
        badge={inspectingItem && <StatusBadge type="invoice" status={inspectingItem.status} />}
        items={drawerItems}
        size="lg"
      >
        {inspectingItem?.items && inspectingItem.items.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chi tiết các khoản phí
            </h4>
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 dark:bg-slate-800/40">
                    <TableHead className="text-xs font-semibold">Tên khoản mục</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Số lượng</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Đơn giá</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectingItem.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-xs text-center text-slate-600 dark:text-slate-400">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Batch Generation Form Dialog */}
      <FormDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        title="Tự động phát hành Hóa đơn hàng loạt"
        description="Hệ thống sẽ tự động tính toán phí quản lý, phí gửi xe và dịch vụ theo m² của từng căn hộ."
        icon={Zap}
        onSubmit={handleGenerateSubmit}
        isLoading={generateMutation.isPending}
        submitText="Phát hành ngay"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kỳ tháng phát hành <span className="text-rose-500">*</span>
            </label>
            <Input
              type="month"
              value={generateForm.billingMonth}
              onChange={(e) => setGenerateForm({ ...generateForm, billingMonth: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hạn chót thanh toán <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={generateForm.dueDate}
              onChange={(e) => setGenerateForm({ ...generateForm, dueDate: e.target.value })}
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa hóa đơn?"
        description="Thao tác này sẽ xóa vĩnh viễn hóa đơn và các dòng chi tiết phí đính kèm."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
