'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Receipt, DollarSign, CheckCircle2, Clock, Zap, Eye, Trash2, Calendar, RotateCcw } from 'lucide-react';
import {
  useInvoices,
  useGenerateMonthlyInvoices,
  useDeleteInvoice,
} from '@/hooks/use-invoices';
import { InvoiceStatus } from '@prisma/client';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [billingMonthFilter, setBillingMonthFilter] = useState('2026-08');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
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
  };

  // Calculate summaries
  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const paidAmount = invoices
    .filter((inv: any) => inv.status === 'PAID')
    .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(generateForm, {
      onSuccess: () => setIsGenerateOpen(false),
    });
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  const renderStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Đã thanh toán</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive" className="font-bold">Quá hạn</Badge>;
      case 'UNPAID':
      default:
        return <Badge variant="warning">Chưa thanh toán</Badge>;
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Mã Hóa đơn',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Căn hộ',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
            {row.apartment?.code}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">{row.apartment?.building}</span>
        </div>
      ),
    },
    {
      header: 'Kỳ thanh toán',
      accessorKey: 'billingMonth',
      cell: (row) => <span className="font-semibold text-slate-700">{row.billingMonth}</span>,
    },
    {
      header: 'Hạn thanh toán',
      cell: (row) => <span className="text-xs text-slate-600">{formatDate(row.dueDate)}</span>,
    },
    {
      header: 'Tổng tiền',
      cell: (row) => (
        <span className="font-bold text-blue-700 text-sm">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (row) => renderStatusBadge(row.status),
    },
    {
      header: 'Thao tác',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDetailItem(row)}
            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
            title="Xem chi tiết hóa đơn"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingId(row.id)}
            className="h-8 w-8 text-red-600 hover:bg-red-50"
            title="Xóa hóa đơn"
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
        title="Quản lý Hóa đơn & Phí dịch vụ"
        description="Tạo hóa đơn tự động hàng tháng, theo dõi trạng thái thanh toán và doanh thu tòa nhà."
      >
        <Button onClick={() => setIsGenerateOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Zap className="mr-2 h-4 w-4" /> Tự động Tạo Hóa đơn Kỳ mới
        </Button>
      </PageHeader>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={`Tổng hóa đơn kỳ ${billingMonthFilter}`}
          value={formatCurrency(totalAmount)}
          description={`${meta.total} hóa đơn trong hệ thống`}
          icon={Receipt}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-600"
        />
        <StatCard
          title="Đã thu thành công"
          value={formatCurrency(paidAmount)}
          description="Đã gạch nợ thành công"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
        />
        <StatCard
          title="Còn phải thu"
          value={formatCurrency(unpaidAmount)}
          description="Đang chờ cư dân thanh toán"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Chọn Kỳ Billing</label>
            <Select
              value={billingMonthFilter}
              onChange={(e) => {
                setBillingMonthFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="2026-08">Tháng 08/2026</option>
              <option value="2026-07">Tháng 07/2026</option>
              <option value="2026-06">Tháng 06/2026</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Trạng thái Thanh toán</label>
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

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tổng số Hóa đơn</label>
            <div className="h-9 flex items-center justify-between px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
              <span>{meta.total} Hóa đơn</span>
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
        data={invoices}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm theo mã HĐ, mã căn hộ..."
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

      {/* Auto Batch Generation Modal */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogHeader>
          <DialogTitle>Tự động Tạo Hóa đơn Hàng tháng</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ quét toàn bộ hợp đồng đang hoạt động và các định mức phí cơ bản để phát hành hóa đơn đồng loạt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Kỳ thanh toán (YYYY-MM) <span className="text-red-500">*</span>
            </label>
            <Input
              type="month"
              value={generateForm.billingMonth}
              onChange={(e) => setGenerateForm({ ...generateForm, billingMonth: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Hạn chót thanh toán (Due Date) <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={generateForm.dueDate}
              onChange={(e) => setGenerateForm({ ...generateForm, dueDate: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsGenerateOpen(false)}
              disabled={generateMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={generateMutation.isPending}
              disabled={generateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              {generateMutation.isPending ? 'Đang tự động tạo...' : 'Phát hành Hóa đơn'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Invoice Detail Modal */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        {detailItem && (
          <div>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Hóa đơn {detailItem.code}</span>
                {renderStatusBadge(detailItem.status)}
              </DialogTitle>
              <DialogDescription>
                Căn hộ {detailItem.apartment?.code} ({detailItem.apartment?.building}) - Kỳ {detailItem.billingMonth}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                <div className="bg-slate-50 p-2.5 font-bold text-slate-700 grid grid-cols-4">
                  <span className="col-span-2">Chi tiết khoản phí</span>
                  <span className="text-center">Số lượng</span>
                  <span className="text-right">Thành tiền</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {detailItem.items?.map((item: any) => (
                    <div key={item.id} className="p-2.5 grid grid-cols-4 items-center">
                      <span className="col-span-2 font-medium text-slate-800">{item.title}</span>
                      <span className="text-center text-slate-500">{item.quantity}</span>
                      <span className="text-right font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 p-3 flex justify-between items-center font-bold text-blue-900 text-sm border-t border-blue-100">
                  <span>TỔNG CỘNG THANH TOÁN:</span>
                  <span className="text-base text-blue-700">{formatCurrency(detailItem.totalAmount)}</span>
                </div>
              </div>

              {detailItem.status === 'PAID' && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Đã thanh toán thành công
                  </p>
                  <p>Phương thức: {detailItem.paymentMethod || 'VNPay Sandbox'}</p>
                  <p>Mã giao dịch: {detailItem.transactionId}</p>
                  <p>Thời gian: {formatDate(detailItem.paidAt)}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailItem(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa hóa đơn?"
        description="Xóa bản ghi hóa đơn này khỏi hệ thống. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
