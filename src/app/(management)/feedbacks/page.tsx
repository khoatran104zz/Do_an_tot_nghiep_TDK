'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailDrawer, DetailItem } from '@/components/shared/DetailDrawer';
import { FormDialog } from '@/components/shared/FormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MessageSquareWarning, Wrench, ShieldAlert, CheckCircle2, Clock, Eye, Send, Star, Building, User, Tag } from 'lucide-react';
import { useFeedbacks, useRespondFeedback } from '@/hooks/use-feedbacks';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function FeedbacksPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Sorting & Selection
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Modal & Drawer state
  const [inspectingItem, setInspectingItem] = useState<any>(null);
  const [respondingItem, setRespondingItem] = useState<any>(null);
  const [respondForm, setRespondForm] = useState({
    status: 'PROCESSING' as TicketStatus,
    responseContent: '',
  });

  const { data: response, isLoading, isError, error, refetch } = useFeedbacks({
    search: search || undefined,
    category: (categoryFilter as TicketCategory) || undefined,
    status: (statusFilter as TicketStatus) || undefined,
    page,
    limit: 10,
  });

  const respondMutation = useRespondFeedback();

  const feedbacks = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };
  const hasActiveFilters = Boolean(search || categoryFilter || statusFilter);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
    setSelectedRowIds([]);
  };

  const handleOpenRespond = (item: any) => {
    setRespondingItem(item);
    setRespondForm({
      status: item.status === 'NEW' ? 'PROCESSING' : item.status,
      responseContent: item.responseContent || '',
    });
  };

  const handleRespondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingItem) return;
    respondMutation.mutate(
      { id: respondingItem.id, data: respondForm },
      {
        onSuccess: () => {
          setRespondingItem(null);
          toast.success(`Đã cập nhật trạng thái sự cố ${respondingItem.code}`);
        },
      }
    );
  };

  const handleSelectRow = (id: string | number) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === feedbacks.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(feedbacks.map((f: any) => f.id));
    }
  };

  // Active filter tags for FilterBar
  const activeTags = [];
  if (categoryFilter) {
    const catMap: Record<string, string> = {
      ELECTRIC: 'Điện sinh hoạt',
      WATER: 'Nước & Đường ống',
      ELEVATOR: 'Thang máy',
      SECURITY: 'An ninh trật tự',
      CLEANLINESS: 'Vệ sinh môi trường',
      OTHER: 'Khác',
    };
    activeTags.push({
      key: 'category',
      label: 'Danh mục',
      valueLabel: catMap[categoryFilter] || categoryFilter,
      onRemove: () => setCategoryFilter(''),
    });
  }
  if (statusFilter) {
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel:
        statusFilter === 'NEW'
          ? 'Mới tiếp nhận'
          : statusFilter === 'PROCESSING'
          ? 'Đang xử lý'
          : statusFilter === 'RESOLVED'
          ? 'Hoàn thành'
          : 'Từ chối',
      onRemove: () => setStatusFilter(''),
    });
  }

  // Drawer detail items
  const drawerItems: DetailItem[] = inspectingItem
    ? [
        { label: 'Mã phản ánh', value: inspectingItem.code, icon: Tag },
        { label: 'Căn hộ gửi', value: inspectingItem.apartment?.code || '—', icon: Building },
        { label: 'Cư dân thông báo', value: inspectingItem.resident?.fullName || '—', icon: User },
        { label: 'Thời gian gửi', value: formatDateTime(inspectingItem.createdAt), icon: Clock },
        { label: 'Mức độ ưu tiên', value: <StatusBadge type="ticketPriority" status={inspectingItem.priority} /> },
        { label: 'Danh mục sự cố', value: <StatusBadge type="ticketCategory" status={inspectingItem.category} /> },
      ]
    : [];

  const columns: Column<any>[] = [
    {
      header: 'Mã Ticket',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Căn hộ & Cư dân',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
            {row.apartment?.code}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[130px]">
            {row.resident?.fullName}
          </span>
        </div>
      ),
    },
    {
      header: 'Danh mục',
      accessorKey: 'category',
      cell: (row) => <StatusBadge type="ticketCategory" status={row.category} />,
    },
    {
      header: 'Tiêu đề sự cố',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <div className="max-w-xs">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
            {row.title}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {row.content}
          </p>
        </div>
      ),
    },
    {
      header: 'Ưu tiên',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => <StatusBadge type="ticketPriority" status={row.priority} />,
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge type="ticketStatus" status={row.status} />,
    },
    {
      header: 'Đánh giá',
      cell: (row) => (
        row.rating ? (
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{row.rating}/5</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
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
            onClick={() => router.push(`/feedbacks/${row.id}`)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
            title="Xem chi tiết quy trình bảo trì"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenRespond(row)}
            className="text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
            title="Phản hồi / Xử lý"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phản ánh & Sự cố Kỹ thuật"
        description="Tiếp nhận, phân loại và điều phối xử lý các sự cố điện nước, thang máy, an ninh từ cư dân."
      />

      {/* FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Phản ánh"
      >
        <div className="w-48">
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả danh mục</option>
            <option value="ELECTRIC">Điện sinh hoạt</option>
            <option value="WATER">Nước & Đường ống</option>
            <option value="ELEVATOR">Thang máy</option>
            <option value="SECURITY">An ninh trật tự</option>
            <option value="CLEANLINESS">Vệ sinh môi trường</option>
            <option value="OTHER">Khác</option>
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
            <option value="NEW">Mới tiếp nhận</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="RESOLVED">Đã hoàn thành</option>
            <option value="REJECTED">Từ chối</option>
          </Select>
        </div>
      </FilterBar>

      {/* Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={feedbacks}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm tiêu đề hoặc nội dung phản ánh..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={(p) => setPage(p)}
        onRowClick={(row) => router.push(`/feedbacks/${row.id}`)}
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

      {/* Detail Drawer */}
      <DetailDrawer
        open={Boolean(inspectingItem)}
        onOpenChange={(open) => !open && setInspectingItem(null)}
        title={inspectingItem?.code || 'Chi tiết Phản ánh'}
        description={inspectingItem?.title}
        badge={inspectingItem && <StatusBadge type="ticketStatus" status={inspectingItem.status} />}
        items={drawerItems}
        size="lg"
        footerActions={
          inspectingItem && (
            <Button
              size="sm"
              onClick={() => {
                const item = inspectingItem;
                setInspectingItem(null);
                handleOpenRespond(item);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Phản hồi & Xử lý
            </Button>
          )
        }
      >
        <div className="space-y-4 pt-2">
          {/* Issue Content description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nội dung mô tả sự cố
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {inspectingItem?.content}
            </div>
          </div>

          {/* Attached Images */}
          {inspectingItem?.images && inspectingItem.images.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hình ảnh hiện trường
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {inspectingItem.images.map((img: string, idx: number) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    className="group block relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-opacity"
                  >
                    <img src={img} alt={`Minh chứng sự cố ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Response log */}
          {inspectingItem?.responseContent && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Phản hồi từ Ban Quản Lý
              </h4>
              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {inspectingItem.responseContent}
              </div>
            </div>
          )}

          {/* Resident Rating */}
          {inspectingItem?.rating && (
            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>Cư dân đánh giá: {inspectingItem.rating}/5 sao</span>
              </div>
              {inspectingItem.ratingComment && (
                <p className="text-xs text-amber-800 dark:text-amber-300 italic">
                  "{inspectingItem.ratingComment}"
                </p>
              )}
            </div>
          )}
        </div>
      </DetailDrawer>

      {/* Response Form Dialog */}
      <FormDialog
        open={Boolean(respondingItem)}
        onOpenChange={(open) => !open && setRespondingItem(null)}
        title={`Xử lý sự cố: ${respondingItem?.code}`}
        description="Cập nhật tiến trình xử lý kỹ thuật và gửi thông điệp phản hồi tới cư dân."
        icon={Send}
        onSubmit={handleRespondSubmit}
        isLoading={respondMutation.isPending}
        submitText="Gửi phản hồi"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trạng thái xử lý <span className="text-rose-500">*</span>
            </label>
            <Select
              value={respondForm.status}
              onChange={(e) => setRespondForm({ ...respondForm, status: e.target.value as TicketStatus })}
            >
              <option value="PROCESSING">Đang xử lý kỹ thuật</option>
              <option value="RESOLVED">Đã giải quyết hoàn thành</option>
              <option value="REJECTED">Từ chối tiếp nhận</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nội dung phản hồi / Phương án giải quyết <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              placeholder="VD: Đội kỹ thuật đã kiểm tra và thay thế aptomat tổng tại tầng 10..."
              value={respondForm.responseContent}
              onChange={(e) => setRespondForm({ ...respondForm, responseContent: e.target.value })}
              required
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
