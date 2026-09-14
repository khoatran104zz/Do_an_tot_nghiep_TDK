'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
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
  Users,
  UserPlus,
  Wrench,
  Shield,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit,
  Power,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Award,
  FileText,
  Briefcase,
  ShieldCheck,
  Building,
  KeyRound,
} from 'lucide-react';
import {
  useStaffList,
  useStaffStats,
  useStaffMember,
  useCreateStaff,
  useUpdateStaff,
  useAssignShift,
  useUpdateStaffStatus,
} from '@/hooks/use-staff';
import { Role, StaffShift, StaffStatus } from '@prisma/client';
import { formatDateTime, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function StaffPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Sorting
  const [sortKey, setSortKey] = useState<string>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Dialog & Drawer states
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [shiftingItem, setShiftingItem] = useState<any>(null);
  const [togglingStatusItem, setTogglingStatusItem] = useState<any>(null);

  // Form states
  const [createFormData, setCreateFormData] = useState<{
    email: string;
    password?: string;
    fullName: string;
    phone: string;
    role: Role;
    position: string;
    department: string;
    currentShift: StaffShift;
    assignedZone: string;
    notes: string;
  }>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: Role.STAFF_TECHNICIAN,
    position: 'Kỹ thuật viên',
    department: 'Ban Kỹ thuật & Bảo trì',
    currentShift: StaffShift.MORNING,
    assignedZone: '',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState<{
    fullName: string;
    phone: string;
    role: Role;
    position: string;
    department: string;
    currentShift: StaffShift;
    assignedZone: string;
    status: StaffStatus;
    notes: string;
  }>({
    fullName: '',
    phone: '',
    role: Role.STAFF_TECHNICIAN,
    position: '',
    department: '',
    currentShift: StaffShift.MORNING,
    assignedZone: '',
    status: StaffStatus.ACTIVE,
    notes: '',
  });

  const [shiftFormData, setShiftFormData] = useState<{
    currentShift: StaffShift;
    assignedZone: string;
    notes: string;
  }>({
    currentShift: StaffShift.MORNING,
    assignedZone: '',
    notes: '',
  });

  // Queries
  const {
    data: listResponse,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useStaffList({
    search: search || undefined,
    role: (roleFilter as Role) || undefined,
    shift: (shiftFilter as StaffShift) || undefined,
    status: (statusFilter as StaffStatus) || undefined,
    page,
    limit: 10,
  });

  const { data: statsResponse } = useStaffStats();
  const { data: inspectingResponse, isLoading: isInspectingLoading } = useStaffMember(
    inspectingId || undefined
  );

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const assignShiftMutation = useAssignShift();
  const updateStatusMutation = useUpdateStaffStatus();

  const staffList = listResponse?.data || [];
  const meta = listResponse?.meta || { page: 1, totalPages: 1, total: 0 };
  const stats = statsResponse?.data || {
    totalStaff: 0,
    onShiftNow: 0,
    techniciansCount: 0,
    securityCount: 0,
    receptionistCount: 0,
    morningShiftCount: 0,
    afternoonShiftCount: 0,
    nightShiftCount: 0,
  };
  const inspectingMember = inspectingResponse?.data || null;

  const hasActiveFilters = Boolean(search || roleFilter || shiftFilter || statusFilter);

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setShiftFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleOpenCreate = () => {
    setCreateFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: Role.STAFF_TECHNICIAN,
      position: 'Kỹ thuật viên bảo trì',
      department: 'Ban Kỹ thuật & Bảo trì',
      currentShift: StaffShift.MORNING,
      assignedZone: 'Hệ thống Điện & Thang máy',
      notes: '',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditFormData({
      fullName: item.fullName,
      phone: item.phone || '',
      role: item.role,
      position: item.staffProfile?.position || '',
      department: item.staffProfile?.department || '',
      currentShift: item.staffProfile?.currentShift || StaffShift.MORNING,
      assignedZone: item.staffProfile?.assignedZone || '',
      status: item.staffProfile?.status || StaffStatus.ACTIVE,
      notes: item.staffProfile?.notes || '',
    });
  };

  const handleOpenShift = (item: any) => {
    setShiftingItem(item);
    setShiftFormData({
      currentShift: item.staffProfile?.currentShift || StaffShift.MORNING,
      assignedZone: item.staffProfile?.assignedZone || '',
      notes: item.staffProfile?.notes || '',
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(createFormData);
      setIsCreateOpen(false);
      refetchList();
    } catch {
      // Handled in mutation hook
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        data: editFormData,
      });
      setEditingItem(null);
      refetchList();
    } catch {
      // Handled in mutation hook
    }
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftingItem) return;
    try {
      await assignShiftMutation.mutateAsync({
        id: shiftingItem.id,
        data: shiftFormData,
      });
      setShiftingItem(null);
      refetchList();
    } catch {
      // Handled in mutation hook
    }
  };

  const handleToggleStatus = async () => {
    if (!togglingStatusItem) return;
    try {
      const isCurrentlyActive =
        togglingStatusItem.isActive && togglingStatusItem.staffProfile?.status === StaffStatus.ACTIVE;
      const nextStatus = isCurrentlyActive ? StaffStatus.SUSPENDED : StaffStatus.ACTIVE;

      await updateStatusMutation.mutateAsync({
        id: togglingStatusItem.id,
        data: {
          status: nextStatus,
          reason: isCurrentlyActive ? 'Khóa quyền đăng nhập nhân sự' : 'Kích hoạt lại tài khoản',
        },
      });
      setTogglingStatusItem(null);
      refetchList();
    } catch {
      // Handled in mutation hook
    }
  };

  const renderRoleBadge = (role: Role) => {
    switch (role) {
      case Role.STAFF_TECHNICIAN:
        return (
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 gap-1 text-[11px] font-semibold">
            <Wrench className="h-3 w-3" /> Kỹ thuật viên
          </Badge>
        );
      case Role.STAFF_SECURITY:
        return (
          <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 gap-1 text-[11px] font-semibold">
            <Shield className="h-3 w-3" /> An ninh / Bảo vệ
          </Badge>
        );
      case Role.STAFF_RECEPTIONIST:
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 gap-1 text-[11px] font-semibold">
            <Building className="h-3 w-3" /> Lễ tân tòa nhà
          </Badge>
        );
      case Role.MANAGER:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 gap-1 text-[11px] font-semibold">
            <Briefcase className="h-3 w-3" /> Quản lý Vận hành
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const renderShiftBadge = (shift?: StaffShift) => {
    switch (shift) {
      case StaffShift.MORNING:
        return (
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border-amber-300 text-[10px] gap-1 font-mono">
            <span>🌅</span> Ca Sáng (06h - 14h)
          </Badge>
        );
      case StaffShift.AFTERNOON:
        return (
          <Badge className="bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200 border-orange-300 text-[10px] gap-1 font-mono">
            <span>🌇</span> Ca Chiều (14h - 22h)
          </Badge>
        );
      case StaffShift.NIGHT:
        return (
          <Badge className="bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200 border-indigo-300 text-[10px] gap-1 font-mono">
            <span>🌙</span> Ca Đêm (22h - 06h)
          </Badge>
        );
      default:
        return <span className="text-slate-400 text-xs">—</span>;
    }
  };

  const renderStatusBadge = (status?: StaffStatus, isActive?: boolean) => {
    if (!isActive || status === StaffStatus.SUSPENDED) {
      return (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <AlertTriangle className="h-3 w-3" /> Đã tạm khóa
        </Badge>
      );
    }
    if (status === StaffStatus.ON_LEAVE) {
      return (
        <Badge className="bg-sky-100 text-sky-800 border-sky-300 text-[10px] gap-1">
          <Clock className="h-3 w-3" /> Đang nghỉ phép
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] gap-1">
        <CheckCircle2 className="h-3 w-3" /> Đang làm việc
      </Badge>
    );
  };

  const activeTags = [];
  if (roleFilter) {
    activeTags.push({
      key: 'role',
      label: 'Vai trò',
      valueLabel:
        roleFilter === 'STAFF_TECHNICIAN'
          ? 'Kỹ thuật viên'
          : roleFilter === 'STAFF_SECURITY'
          ? 'An ninh / Bảo vệ'
          : roleFilter === 'STAFF_RECEPTIONIST'
          ? 'Lễ tân'
          : 'Quản lý',
      onRemove: () => setRoleFilter(''),
    });
  }
  if (shiftFilter) {
    activeTags.push({
      key: 'shift',
      label: 'Ca trực',
      valueLabel:
        shiftFilter === 'MORNING' ? 'Ca Sáng' : shiftFilter === 'AFTERNOON' ? 'Ca Chiều' : 'Ca Đêm',
      onRemove: () => setShiftFilter(''),
    });
  }
  if (statusFilter) {
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel: statusFilter === 'ACTIVE' ? 'Đang làm việc' : 'Đã khóa',
      onRemove: () => setStatusFilter(''),
    });
  }

  const columns: Column<any>[] = [
    {
      header: 'Nhân viên',
      accessorKey: 'fullName',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="default" />
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs sm:text-sm">
              {row.fullName}
            </span>
            <span className="text-[11px] text-slate-500 font-mono block">
              {row.staffProfile?.employeeCode || 'CHƯA CẤP MÃ'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Vị trí & Chức danh',
      cell: (row) => (
        <div className="space-y-1">
          {renderRoleBadge(row.role)}
          <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">
            {row.staffProfile?.position || 'Nhân viên vận hành'}
          </span>
        </div>
      ),
    },
    {
      header: 'Liên hệ',
      cell: (row) => (
        <div className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-mono">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{row.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Mail className="h-3 w-3 text-slate-400" />
            <span className="truncate max-w-[140px]">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Ca trực & Phân công',
      cell: (row) => (
        <div className="space-y-1">
          {renderShiftBadge(row.staffProfile?.currentShift)}
          {row.staffProfile?.assignedZone && (
            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
              <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
              <span className="truncate max-w-[150px] font-medium">
                {row.staffProfile.assignedZone}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Nhiệm vụ',
      cell: (row) => {
        const count = row._count?.assignedTickets || 0;
        return (
          <div>
            {count > 0 ? (
              <Badge className="bg-amber-500 text-white text-[11px] font-mono">
                {count} sự vụ mở
              </Badge>
            ) : (
              <span className="text-xs text-slate-400">Sẵn sàng nhận việc</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Trạng thái',
      cell: (row) => renderStatusBadge(row.staffProfile?.status, row.isActive),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setInspectingId(row.id)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            title="Xem hồ sơ chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenShift(row)}
            className="text-slate-500 hover:text-amber-600 hover:bg-amber-50"
            title="Phân ca trực & khu vực"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenEdit(row)}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
            title="Chỉnh sửa thông tin"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTogglingStatusItem(row)}
            className={`hover:bg-slate-100 ${
              row.isActive && row.staffProfile?.status === StaffStatus.ACTIVE
                ? 'text-slate-400 hover:text-rose-600'
                : 'text-emerald-600 hover:text-emerald-700'
            }`}
            title={row.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Quản lý Đội ngũ Vận hành"
        description="Điều phối phân ca làm việc, quản lý chuyên môn Kỹ thuật, An ninh, Lễ tân và giám sát KPI giải quyết sự vụ của tòa nhà."
      >
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 text-xs"
        >
          <UserPlus className="mr-1.5 h-4 w-4" /> Thêm Nhân sự mới
        </Button>
      </PageHeader>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng nhân sự
            </span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {stats.totalStaff}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Toàn bộ khối vận hành</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đang trực ca này
            </span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            {stats.onShiftNow}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sẵn sàng phản ứng nhanh</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kỹ thuật viên
            </span>
            <Wrench className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {stats.techniciansCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Điện, Nước, Thang máy, PCCC</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              An ninh & Lễ tân
            </span>
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {stats.securityCount + stats.receptionistCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats.securityCount} An ninh • {stats.receptionistCount} Lễ tân
          </span>
        </Card>
      </div>

      {/* FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Nhân sự"
      >
        <div className="w-48">
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả chuyên môn</option>
            <option value="STAFF_TECHNICIAN">🛠️ Kỹ thuật viên</option>
            <option value="STAFF_SECURITY">🛡️ An ninh / Bảo vệ</option>
            <option value="STAFF_RECEPTIONIST">🛎️ Lễ tân tòa nhà</option>
            <option value="MANAGER">💼 Ban Quản lý</option>
          </Select>
        </div>

        <div className="w-44">
          <Select
            value={shiftFilter}
            onChange={(e) => {
              setShiftFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả ca trực</option>
            <option value="MORNING">🌅 Ca Sáng (06h-14h)</option>
            <option value="AFTERNOON">🌇 Ca Chiều (14h-22h)</option>
            <option value="NIGHT">🌙 Ca Đêm (22h-06h)</option>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="ON_LEAVE">Nghỉ phép</option>
            <option value="SUSPENDED">Đã tạm khóa</option>
          </Select>
        </div>
      </FilterBar>

      {/* Staff DataTable */}
      <DataTable
        columns={columns}
        data={staffList}
        isLoading={isListLoading}
        isError={isListError}
        errorMessage={(listError as any)?.message}
        onRetry={refetchList}
        emptyTitle="Không tìm thấy nhân sự"
        emptyDescription="Không có hồ sơ nhân viên nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc."
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
        onRowClick={(row) => setInspectingId(row.id)}
      />

      {/* =====================================================================
          STAFF DETAIL DRAWER
          ===================================================================== */}
      <DetailDrawer
        open={Boolean(inspectingId)}
        onOpenChange={(open: boolean) => !open && setInspectingId(null)}
        title={`Hồ sơ Nhân sự: ${inspectingMember?.fullName || ''}`}
        badge={
          inspectingMember &&
          renderStatusBadge(
            inspectingMember.staffProfile?.status,
            inspectingMember.isActive
          )
        }
        items={
          inspectingMember
            ? [
                {
                  label: 'Mã nhân viên',
                  value: (
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      {inspectingMember.staffProfile?.employeeCode || 'CHƯA CẤP'}
                    </span>
                  ),
                },
                { label: 'Chức vụ', value: inspectingMember.staffProfile?.position || 'Nhân viên' },
                {
                  label: 'Bộ phận / Đội',
                  value: inspectingMember.staffProfile?.department || 'Khối Vận hành',
                },
                { label: 'Số điện thoại', value: inspectingMember.phone || 'Chưa cung cấp', icon: Phone },
                { label: 'Email tài khoản', value: inspectingMember.email, icon: Mail },
                {
                  label: 'Ca làm việc',
                  value: renderShiftBadge(inspectingMember.staffProfile?.currentShift),
                },
                {
                  label: 'Khu vực / Chốt trực',
                  value: inspectingMember.staffProfile?.assignedZone || 'Chưa gán khu vực',
                  icon: MapPin,
                },
                {
                  label: 'Ngày gia nhập',
                  value: inspectingMember.staffProfile?.joinedDate
                    ? formatDate(inspectingMember.staffProfile.joinedDate)
                    : formatDate(inspectingMember.createdAt),
                  icon: Calendar,
                },
              ]
            : []
        }
        footerActions={
          inspectingMember && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const m = inspectingMember;
                  setInspectingId(null);
                  handleOpenShift(m);
                }}
              >
                <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-600" /> Đổi ca trực
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const m = inspectingMember;
                  setInspectingId(null);
                  handleOpenEdit(m);
                }}
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Chỉnh sửa
              </Button>
            </div>
          )
        }
      >
        {/* Extra Rich Sections in Drawer */}
        {inspectingMember && (
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            {/* RBAC Role & Granular Permissions */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                  Vai trò & Quyền hạn hệ thống
                </span>
                {renderRoleBadge(inspectingMember.role)}
              </div>
              <p className="text-[11px] text-slate-500">
                Nhân sự tuân thủ nghiêm ngặt chính sách phân quyền vai trò. Không được tự ý
                thay đổi role hoặc vượt quá phạm vi chuyên môn.
              </p>
            </div>

            {/* Assigned Tasks / Tickets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-amber-600" />
                  Nhiệm vụ / Sự vụ được giao gần đây
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {inspectingMember.assignedTickets?.length || 0} tickets
                </Badge>
              </div>

              {inspectingMember.assignedTickets && inspectingMember.assignedTickets.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  {inspectingMember.assignedTickets.map((t: any) => (
                    <div key={t.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {t.code}
                          </span>
                          <span className="font-mono text-blue-600 text-[11px]">
                            {t.apartment?.code || ''}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[240px]">
                          {t.title}
                        </span>
                      </div>
                      <Badge
                        className={`text-[10px] ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-600 text-white'
                            : t.status === 'PROCESSING'
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  Hiện không có sự vụ nào đang chờ xử lý.
                </p>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* =====================================================================
          DIALOG: CREATE STAFF
          ===================================================================== */}
      <FormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Thêm Nhân sự Vận hành Mới"
        description="Khởi tạo tài khoản nhân viên, phân công chuyên môn và ca làm việc cho tòa nhà."
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Trần Văn Kỹ Thuật"
              value={createFormData.fullName}
              onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="0912345678"
              value={createFormData.phone}
              onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email đăng nhập <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="staff@building.com"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mật khẩu khởi tạo
            </label>
            <Input
              type="password"
              placeholder="Mặc định: Staff@123"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vai trò chuyên môn <span className="text-rose-500">*</span>
            </label>
            <Select
              value={createFormData.role}
              onChange={(e) => {
                const r = e.target.value as Role;
                let defaultPos = 'Kỹ thuật viên';
                let defaultDept = 'Ban Kỹ thuật & Bảo trì';
                let defaultZone = 'Hệ thống Cơ Điện';
                if (r === Role.STAFF_SECURITY) {
                  defaultPos = 'Nhân viên an ninh';
                  defaultDept = 'Đội An ninh & Bảo vệ';
                  defaultZone = 'Cổng chính & Hầm B1';
                } else if (r === Role.STAFF_RECEPTIONIST) {
                  defaultPos = 'Nhân viên lễ tân';
                  defaultDept = 'Tổ Lễ tân & CSKH';
                  defaultZone = 'Sảnh chính Tòa A';
                }
                setCreateFormData({
                  ...createFormData,
                  role: r,
                  position: defaultPos,
                  department: defaultDept,
                  assignedZone: defaultZone,
                });
              }}
            >
              <option value="STAFF_TECHNICIAN">🛠️ Kỹ thuật viên</option>
              <option value="STAFF_SECURITY">🛡️ Nhân viên an ninh</option>
              <option value="STAFF_RECEPTIONIST">🛎️ Nhân viên lễ tân</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chức danh cụ thể <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Kỹ thuật viên trưởng"
              value={createFormData.position}
              onChange={(e) => setCreateFormData({ ...createFormData, position: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ca trực phân công <span className="text-rose-500">*</span>
            </label>
            <Select
              value={createFormData.currentShift}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  currentShift: e.target.value as StaffShift,
                })
              }
            >
              <option value="MORNING">🌅 Ca Sáng (06:00 - 14:00)</option>
              <option value="AFTERNOON">🌇 Ca Chiều (14:00 - 22:00)</option>
              <option value="NIGHT">🌙 Ca Đêm (22:00 - 06:00)</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Khu vực / Chốt trực
            </label>
            <Input
              placeholder="VD: Cổng chính, Sảnh Tòa A, Điện nước..."
              value={createFormData.assignedZone}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, assignedZone: e.target.value })
              }
            />
          </div>
        </div>
      </FormDialog>

      {/* =====================================================================
          DIALOG: EDIT STAFF
          ===================================================================== */}
      <FormDialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
        title={`Chỉnh sửa: ${editingItem?.fullName || ''}`}
        description="Cập nhật thông tin nhân viên, chức danh hoặc điều chuyển vai trò."
        onSubmit={handleEditSubmit}
        isLoading={updateMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <Input
              value={editFormData.fullName}
              onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <Input
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vai trò chuyên môn <span className="text-rose-500">*</span>
            </label>
            <Select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as Role })}
            >
              <option value="STAFF_TECHNICIAN">🛠️ Kỹ thuật viên</option>
              <option value="STAFF_SECURITY">🛡️ Nhân viên an ninh</option>
              <option value="STAFF_RECEPTIONIST">🛎️ Nhân viên lễ tân</option>
              <option value="MANAGER">💼 Ban Quản lý</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chức danh <span className="text-rose-500">*</span>
            </label>
            <Input
              value={editFormData.position}
              onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Khu vực / Chốt trực
            </label>
            <Input
              value={editFormData.assignedZone}
              onChange={(e) => setEditFormData({ ...editFormData, assignedZone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trạng thái nhân sự
            </label>
            <Select
              value={editFormData.status}
              onChange={(e) =>
                setEditFormData({ ...editFormData, status: e.target.value as StaffStatus })
              }
            >
              <option value="ACTIVE">Đang làm việc</option>
              <option value="ON_LEAVE">Nghỉ phép</option>
              <option value="SUSPENDED">Tạm khóa</option>
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* =====================================================================
          DIALOG: ASSIGN SHIFT & ZONE
          ===================================================================== */}
      <FormDialog
        open={Boolean(shiftingItem)}
        onOpenChange={(open) => !open && setShiftingItem(null)}
        title={`Điều chuyển Ca trực: ${shiftingItem?.fullName || ''}`}
        description={`Mã nhân viên: ${
          shiftingItem?.staffProfile?.employeeCode || ''
        } - Vị trí: ${shiftingItem?.staffProfile?.position || ''}`}
        onSubmit={handleShiftSubmit}
        isLoading={assignShiftMutation.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ca làm việc mới <span className="text-rose-500">*</span>
            </label>
            <Select
              value={shiftFormData.currentShift}
              onChange={(e) =>
                setShiftFormData({
                  ...shiftFormData,
                  currentShift: e.target.value as StaffShift,
                })
              }
            >
              <option value="MORNING">🌅 Ca Sáng (06:00 - 14:00)</option>
              <option value="AFTERNOON">🌇 Ca Chiều (14:00 - 22:00)</option>
              <option value="NIGHT">🌙 Ca Đêm (22:00 - 06:00)</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Phân công khu vực / Chốt trực
            </label>
            <Input
              placeholder={
                shiftingItem?.role === Role.STAFF_SECURITY
                  ? 'VD: Cổng chính Tòa A, Trạm barie hầm B1...'
                  : shiftingItem?.role === Role.STAFF_RECEPTIONIST
                  ? 'VD: Sảnh chính Tòa A, Quầy đón tiếp Tòa B...'
                  : 'VD: Hệ thống Cơ điện, Chữa cháy tự động, Thang máy...'
              }
              value={shiftFormData.assignedZone}
              onChange={(e) =>
                setShiftFormData({ ...shiftFormData, assignedZone: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ghi chú điều chuyển
            </label>
            <Input
              placeholder="Lý do điều chuyển, ca thay thế..."
              value={shiftFormData.notes}
              onChange={(e) => setShiftFormData({ ...shiftFormData, notes: e.target.value })}
            />
          </div>
        </div>
      </FormDialog>

      {/* =====================================================================
          CONFIRM: TOGGLE ACTIVATE / SUSPEND STATUS
          ===================================================================== */}
      <ConfirmDialog
        open={Boolean(togglingStatusItem)}
        onOpenChange={(open) => !open && setTogglingStatusItem(null)}
        title={
          togglingStatusItem?.isActive &&
          togglingStatusItem?.staffProfile?.status === StaffStatus.ACTIVE
            ? `Tạm khóa quyền truy cập của ${togglingStatusItem?.fullName}?`
            : `Kích hoạt lại tài khoản của ${togglingStatusItem?.fullName}?`
        }
        description={
          togglingStatusItem?.isActive &&
          togglingStatusItem?.staffProfile?.status === StaffStatus.ACTIVE
            ? 'Nhân viên sẽ không thể đăng nhập vào cổng vận hành cho đến khi được Ban Quản Lý mở khóa.'
            : 'Nhân viên sẽ được khôi phục quyền đăng nhập và tiếp tục thực hiện ca trực theo phân công.'
        }
        isLoading={updateStatusMutation.isPending}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
