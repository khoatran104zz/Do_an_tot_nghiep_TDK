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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  Home,
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Users,
  AlertCircle,
  Check,
  X,
  Filter,
} from 'lucide-react';
import {
  useResidents,
  useCreateResident,
  useUpdateResident,
  useDeleteResident,
} from '@/hooks/use-residents';
import { useApartments } from '@/hooks/use-apartments';
import {
  useResidenceRequests,
  useReviewResidenceRequest,
} from '@/hooks/use-household';
import {
  ResidentRelationship,
  ResidentStatus,
  ResidenceRequestStatus,
  ResidenceRequestType,
} from '@prisma/client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function ResidentsPage() {
  // Main Tab: RESIDENTS or PENDING_REQUESTS
  const [mainTab, setMainTab] = useState<'RESIDENTS' | 'PENDING_REQUESTS'>('RESIDENTS');

  // --- RESIDENTS TAB FILTERS ---
  const [search, setSearch] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Sorting & Selection
  const [sortKey, setSortKey] = useState<string>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Dialog & Drawer states for Residents
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

  // --- PENDING REQUESTS TAB STATE ---
  const [requestSearch, setRequestSearch] = useState('');
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('PENDING');
  const [requestPage, setRequestPage] = useState(1);
  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvingItem, setApprovingItem] = useState<any>(null);
  const [inspectingRequest, setInspectingRequest] = useState<any>(null);

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

  // Residence Requests query
  const {
    data: requestsResponse,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useResidenceRequests({
    search: requestSearch || undefined,
    status: (requestStatusFilter as ResidenceRequestStatus) || undefined,
    type: (requestTypeFilter as ResidenceRequestType) || undefined,
    page: requestPage,
    limit: 15,
  });

  // Pending count badge query
  const { data: pendingOnlyRes } = useResidenceRequests({
    status: ResidenceRequestStatus.PENDING,
    limit: 100,
  });
  const pendingCount = pendingOnlyRes?.meta?.total ?? 0;

  const createMutation = useCreateResident();
  const updateMutation = useUpdateResident();
  const deleteMutation = useDeleteResident();
  const reviewMutation = useReviewResidenceRequest();

  const residents = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };
  const requests = requestsResponse?.data || [];
  const requestsMeta = requestsResponse?.meta || { page: 1, totalPages: 1, total: 0 };

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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsFormOpen(false);
      refetch();
    } catch {
      // Error handled by react-query mutation toast
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
      refetch();
    } catch {
      // Error handled by react-query mutation toast
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvingItem) return;
    try {
      await reviewMutation.mutateAsync({
        id: approvingItem.id,
        data: { action: 'APPROVE' },
      });
      setApprovingItem(null);
      refetchRequests();
      refetch();
    } catch {
      // Error handled in hook
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    try {
      await reviewMutation.mutateAsync({
        id: rejectingItem.id,
        data: { action: 'REJECT', rejectReason: rejectReason || 'Không đủ điều kiện phê duyệt' },
      });
      setRejectingItem(null);
      setRejectReason('');
      refetchRequests();
    } catch {
      // Error handled in hook
    }
  };

  const renderRequestTypeBadge = (type: ResidenceRequestType) => {
    switch (type) {
      case 'TEMPORARY_RESIDENCE':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 gap-1 text-[11px] font-semibold">
            <span>⏱️</span> Đăng ký tạm trú
          </Badge>
        );
      case 'TEMPORARY_ABSENCE':
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 gap-1 text-[11px] font-semibold">
            <span>🏖️</span> Đăng ký tạm vắng
          </Badge>
        );
      case 'ADD_MEMBER':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 gap-1 text-[11px] font-semibold">
            <span>👨‍👩‍👧</span> Thêm thành viên
          </Badge>
        );
      case 'MOVE_IN':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 gap-1 text-[11px] font-semibold">
            <span>🚚</span> Đăng ký chuyển vào
          </Badge>
        );
      case 'MOVE_OUT':
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 gap-1 text-[11px] font-semibold">
            <span>📦</span> Đăng ký chuyển đi
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const renderRequestStatusBadge = (status: ResidenceRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-[11px]">
            <Clock className="h-3 w-3 animate-spin" /> Chờ phê duyệt
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]">
            <Check className="h-3 w-3" /> Đã duyệt
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1 text-[11px]">
            <X className="h-3 w-3" /> Bị từ chối
          </Badge>
        );
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
          : relationshipFilter === 'TEMPORARY_RESIDENT'
          ? 'Tạm trú'
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

  const residentColumns: Column<any>[] = [
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
      cell: (row) =>
        row.apartment ? (
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs">
            {row.apartment.code}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Chưa gắn</span>
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
      cell: (row) => {
        if (row.relationshipToOwner === 'TEMPORARY_RESIDENT') {
          return (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              Tạm trú
            </Badge>
          );
        }
        return <StatusBadge type="relationship" status={row.relationshipToOwner} />;
      },
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
        title="Quản lý Hộ gia đình & Cư trú"
        description="Quản lý cấu trúc nhân khẩu hộ gia đình, danh bạ cư dân và xét duyệt các thủ tục hành chính cư trú."
      >
        <div className="flex items-center gap-2">
          {mainTab === 'RESIDENTS' && (
            <Button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 text-xs"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Thêm Cư dân mới
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setMainTab('RESIDENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            mainTab === 'RESIDENTS'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Danh bạ Cư dân & Nhân khẩu</span>
          <Badge variant="secondary" className="text-[10px] ml-1">
            {meta.total}
          </Badge>
        </button>

        <button
          onClick={() => setMainTab('PENDING_REQUESTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all relative ${
            mainTab === 'PENDING_REQUESTS'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>Yêu cầu Cư trú Chờ duyệt</span>
          {pendingCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {pendingCount}
            </span>
          ) : (
            <Badge variant="outline" className="text-[10px] ml-1">
              0
            </Badge>
          )}
        </button>
      </div>

      {/* =====================================================================
          TAB 1: DANH BẠ CƯ DÂN (RESIDENTS DIRECTORY)
          ===================================================================== */}
      {mainTab === 'RESIDENTS' && (
        <div className="space-y-4">
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
                <option value="TEMPORARY_RESIDENT">Tạm trú</option>
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

          <DataTable
            columns={residentColumns}
            data={residents}
            isLoading={isLoading}
            isError={isError}
            errorMessage={(error as any)?.message}
            onRetry={refetch}
            emptyTitle="Không tìm thấy cư dân"
            emptyDescription="Không tìm thấy hồ sơ cư dân phù hợp với bộ lọc."
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            onPageChange={(newPage: number) => setPage(newPage)}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSortChange={(key: string, order: 'asc' | 'desc') => {
              setSortKey(key);
              setSortOrder(order);
            }}
            onRowClick={(row) => setInspectingItem(row)}
          />
        </div>
      )}

      {/* =====================================================================
          TAB 2: YÊU CẦU CƯ TRÚ CHỜ DUYỆT (PENDING RESIDENCE REQUESTS)
          ===================================================================== */}
      {mainTab === 'PENDING_REQUESTS' && (
        <div className="space-y-4">
          {/* Requests Filter Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-56">
                <Input
                  placeholder="Tìm mã đơn, tên, CCCD, căn hộ..."
                  value={requestSearch}
                  onChange={(e) => {
                    setRequestSearch(e.target.value);
                    setRequestPage(1);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              <div className="w-48">
                <Select
                  value={requestStatusFilter}
                  onChange={(e) => {
                    setRequestStatusFilter(e.target.value);
                    setRequestPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ phê duyệt</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                  <option value="REJECTED">Bị từ chối</option>
                </Select>
              </div>

              <div className="w-48">
                <Select
                  value={requestTypeFilter}
                  onChange={(e) => {
                    setRequestTypeFilter(e.target.value);
                    setRequestPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="">Tất cả thủ tục</option>
                  <option value="TEMPORARY_RESIDENCE">Đăng ký tạm trú</option>
                  <option value="TEMPORARY_ABSENCE">Đăng ký tạm vắng</option>
                  <option value="ADD_MEMBER">Thêm thành viên hộ</option>
                  <option value="MOVE_IN">Đăng ký chuyển vào</option>
                  <option value="MOVE_OUT">Đăng ký chuyển đi</option>
                </Select>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Tổng cộng: <span className="font-bold text-slate-900 dark:text-slate-100">{requestsMeta.total}</span> yêu cầu
            </div>
          </div>

          {/* Requests List */}
          {isRequestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <Card className="border-dashed py-12 text-center text-slate-400">
              <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold">Không có yêu cầu cư trú nào</p>
              <p className="text-xs">Các đơn đăng ký tạm trú, tạm vắng hoặc thêm nhân khẩu của cư dân sẽ xuất hiện tại đây.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-blue-400/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {req.code}
                      </span>
                      {renderRequestTypeBadge(req.type)}
                      {renderRequestStatusBadge(req.status)}
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs">
                        Căn {req.apartment?.code || 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        Họ & Tên: <span className="font-bold text-slate-900 dark:text-slate-100">{req.fullName}</span>
                      </div>
                      <div className="font-mono text-slate-500">
                        CCCD: <span className="text-slate-700 dark:text-slate-300">{req.identityCard}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Phone className="h-3 w-3" />
                        <span>{req.phone}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Người gửi: <span className="font-medium text-slate-600 dark:text-slate-300">{req.requester?.fullName}</span> ({formatDateTime(req.createdAt)})
                      </div>
                    </div>

                    {(req.startDate || req.endDate || req.note) && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg space-y-0.5">
                        {(req.startDate || req.endDate) && (
                          <div>
                            Thời hạn áp dụng:{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {req.startDate ? formatDate(req.startDate) : 'Hiện tại'} ➔{' '}
                              {req.endDate ? formatDate(req.endDate) : 'Không xác định'}
                            </span>
                          </div>
                        )}
                        {req.note && (
                          <div>
                            Ghi chú: <span className="italic text-slate-700 dark:text-slate-300">{req.note}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reviewer info if processed */}
                    {req.status !== 'PENDING' && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>
                          Xét duyệt bởi: <span className="font-semibold text-slate-600 dark:text-slate-300">{req.reviewer?.fullName || req.reviewer?.email || 'BQL'}</span>
                        </span>
                        <span>•</span>
                        <span>Thời điểm: {req.reviewedAt ? formatDateTime(req.reviewedAt) : '—'}</span>
                        {req.rejectReason && (
                          <span className="text-rose-600 font-medium">Lý do từ chối: {req.rejectReason}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {req.status === 'PENDING' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setApprovingItem(req)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Phê duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingItem(req);
                            setRejectReason('');
                          }}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Từ chối
                        </Button>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {req.status === 'APPROVED' ? 'Đã duyệt hồ sơ' : 'Đã từ chối'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drawer: Detail Profile */}
      <DetailDrawer
        open={Boolean(inspectingItem)}
        onOpenChange={(open: boolean) => !open && setInspectingItem(null)}
        title={`Hồ sơ Cư dân: ${inspectingItem?.fullName || ''}`}
        badge={
          inspectingItem?.relationshipToOwner === 'TEMPORARY_RESIDENT' ? (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">
              Tạm trú
            </Badge>
          ) : (
            inspectingItem && <StatusBadge type="relationship" status={inspectingItem.relationshipToOwner} />
          )
        }
        items={drawerItems}
        footerActions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const item = inspectingItem;
                setInspectingItem(null);
                handleOpenEdit(item);
              }}
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Chỉnh sửa
            </Button>
          </div>
        }
      />

      {/* Dialog: Create / Edit Resident */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingItem ? `Chỉnh sửa Cư dân: ${editingItem.fullName}` : 'Thêm Cư dân mới'}
        description="Điền thông tin nhân thân, số định danh CCCD và phân quyền cư trú cho căn hộ."
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Nguyễn Văn A"
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
            placeholder="VD: 001201000123"
            value={formData.identityCard}
            onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
            required
          />
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
              <option value="FAMILY">Thân nhân gia đình</option>
              <option value="TENANT">Khách thuê</option>
              <option value="TEMPORARY_RESIDENT">Nhân khẩu tạm trú</option>
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

      {/* Approve Request Confirmation */}
      <ConfirmDialog
        open={Boolean(approvingItem)}
        onOpenChange={(open) => !open && setApprovingItem(null)}
        title={`Phê duyệt yêu cầu: ${approvingItem?.code}?`}
        description={`Hệ thống sẽ cập nhật trạng thái cư trú của nhân khẩu ${approvingItem?.fullName} và tự động ghi nhận vào Lịch sử Biến động căn hộ (Apartment History).`}
        isLoading={reviewMutation.isPending}
        onConfirm={handleConfirmApprove}
      />

      {/* Reject Request Dialog */}
      <FormDialog
        open={Boolean(rejectingItem)}
        onOpenChange={(open) => !open && setRejectingItem(null)}
        title={`Từ chối yêu cầu: ${rejectingItem?.code}`}
        description="Vui lòng nhập lý do từ chối để thông báo tới cư dân gửi yêu cầu."
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirmReject();
        }}
        isLoading={reviewMutation.isPending}
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Lý do từ chối <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Thông tin CCCD không khớp hoặc thiếu giấy tờ xác minh..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </div>
      </FormDialog>
    </div>
  );
}
