'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MessageSquareWarning, Wrench, ShieldAlert, CheckCircle2, Clock, Eye, Send } from 'lucide-react';
import { useFeedbacks, useRespondFeedback } from '@/hooks/use-feedbacks';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import { formatDateTime } from '@/lib/utils';

export default function FeedbacksPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Respond Modal state
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [respondForm, setRespondForm] = useState({
    status: 'PROCESSING' as TicketStatus,
    responseContent: '',
  });

  const { data: response, isLoading } = useFeedbacks({
    search: search || undefined,
    category: (categoryFilter as TicketCategory) || undefined,
    status: (statusFilter as TicketStatus) || undefined,
    page,
    limit: 10,
  });

  const respondMutation = useRespondFeedback();

  const feedbacks = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };

  const handleOpenRespond = (item: any) => {
    setSelectedItem(item);
    setRespondForm({
      status: item.status === 'NEW' ? 'PROCESSING' : item.status,
      responseContent: item.responseContent || '',
    });
  };

  const handleRespondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    respondMutation.mutate(
      { id: selectedItem.id, data: respondForm },
      {
        onSuccess: () => setSelectedItem(null),
      }
    );
  };

  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="destructive">Mới tiếp nhận</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">Đang xử lý</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'REJECTED':
      default:
        return <Badge variant="secondary">Từ chối</Badge>;
    }
  };

  const renderPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'URGENT':
        return <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">Khẩn cấp</span>;
      case 'HIGH':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Cao</span>;
      case 'MEDIUM':
      default:
        return <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Trung bình</span>;
    }
  };

  const renderCategoryName = (c: TicketCategory) => {
    switch (c) {
      case 'ELECTRIC':
        return 'Điện sinh hoạt';
      case 'WATER':
        return 'Nước & Đường ống';
      case 'ELEVATOR':
        return 'Thang máy';
      case 'SECURITY':
        return 'An ninh tòa nhà';
      case 'CLEANLINESS':
        return 'Vệ sinh môi trường';
      case 'OTHER':
      default:
        return 'Khác';
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Mã Sự cố',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Căn hộ & Cư dân',
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs mr-1">
            {row.apartment?.code}
          </span>
          <span className="font-semibold text-slate-900">{row.resident?.fullName}</span>
          <span className="text-xs text-slate-400 block">{row.resident?.phone}</span>
        </div>
      ),
    },
    {
      header: 'Phân loại',
      cell: (row) => <Badge variant="outline">{renderCategoryName(row.category)}</Badge>,
    },
    {
      header: 'Nội dung phản ánh',
      cell: (row) => (
        <div className="max-w-xs">
          <p className="font-semibold text-slate-900 text-xs truncate">{row.title}</p>
          <p className="text-xs text-slate-500 truncate">{row.content}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      header: 'Độ ưu tiên',
      cell: (row) => renderPriorityBadge(row.priority),
    },
    {
      header: 'Trạng thái',
      cell: (row) => renderStatusBadge(row.status),
    },
    {
      header: 'Thao tác',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenRespond(row)}
          className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Wrench className="mr-1 h-3.5 w-3.5" /> Xử lý
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiếp nhận & Xử lý Phản ánh"
        description="Tiếp nhận báo cáo sự cố điện, nước, an ninh từ cư dân và cập nhật tiến độ xử lý."
      />

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Lọc danh mục sự cố</label>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả sự cố</option>
            <option value="ELECTRIC">Điện</option>
            <option value="WATER">Nước</option>
            <option value="ELEVATOR">Thang máy</option>
            <option value="SECURITY">An ninh</option>
            <option value="CLEANLINESS">Vệ sinh</option>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Lọc trạng thái xử lý</label>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NEW">Mới tiếp nhận</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="RESOLVED">Hoàn thành</option>
            <option value="REJECTED">Từ chối</option>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Tổng phản ánh</label>
          <div className="h-9 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700">
            {meta.total} Sự cố báo cáo
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={feedbacks}
        isLoading={isLoading}
        searchPlaceholder="Tìm mã sự cố, căn hộ, tiêu đề..."
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

      {/* Response Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <div>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Cập nhật xử lý: {selectedItem.code}</span>
                {renderStatusBadge(selectedItem.status)}
              </DialogTitle>
              <DialogDescription>
                Căn hộ {selectedItem.apartment?.code} - {selectedItem.resident?.fullName} ({selectedItem.resident?.phone})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRespondSubmit} className="space-y-4 my-4">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800">{selectedItem.title}</p>
                <p className="text-slate-600">{selectedItem.content}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Cập nhật trạng thái xử lý (*)</label>
                <Select
                  value={respondForm.status}
                  onChange={(e) => setRespondForm({ ...respondForm, status: e.target.value as TicketStatus })}
                  required
                >
                  <option value="NEW">Mới tiếp nhận</option>
                  <option value="PROCESSING">Đang cử kỹ thuật xử lý</option>
                  <option value="RESOLVED">Đã hoàn thành sửa chữa</option>
                  <option value="REJECTED">Từ chối / Khống thuộc thẩm quyền</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Nội dung phản hồi cho Cư dân</label>
                <textarea
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-blue-600 outline-none"
                  rows={3}
                  placeholder="Ghi nhận phản hồi kỹ thuật, thời gian hỗ trợ..."
                  value={respondForm.responseContent}
                  onChange={(e) => setRespondForm({ ...respondForm, responseContent: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setSelectedItem(null)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={respondMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {respondMutation.isPending ? 'Đang lưu...' : 'Lưu phản hồi'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </Dialog>
    </div>
  );
}
