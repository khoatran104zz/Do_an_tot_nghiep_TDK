'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Car,
  Bike,
  Plus,
  Edit,
  Trash2,
  Eye,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Home,
  User,
  Search,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Calendar,
  ExternalLink,
  PowerOff,
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useApproveVehicle,
  useRejectVehicle,
  useDeactivateVehicle,
  useIssueParkingCard,
} from '@/hooks/use-vehicles';
import { useApartments } from '@/hooks/use-apartments';
import { useResidents } from '@/hooks/use-residents';
import { Skeleton } from '@/components/ui/skeleton';
import { VehicleType, VehicleStatus, ParkingCardStatus } from '@prisma/client';
import { toast } from 'sonner';

function VehiclesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'MANAGER';
  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER';

  // Filters & Search
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [apartmentFilter, setApartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [cardStatusFilter, setCardStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Sorting & Row Selection
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Dialog & Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<any>(null);

  // Approval Dialog states
  const [approvingItem, setApprovingItem] = useState<any>(null);
  const [approveCardCode, setApproveCardCode] = useState('');
  const [approveExpiresAt, setApproveExpiresAt] = useState('');

  // Rejection Dialog states
  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Issue Card Dialog states
  const [issuingCardItem, setIssuingCardItem] = useState<any>(null);
  const [newCardCode, setNewCardCode] = useState('');
  const [newCardExpiresAt, setNewCardExpiresAt] = useState('');

  // Deactivate Confirmation state
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    licensePlate: '',
    type: 'MOTORBIKE' as VehicleType,
    brand: '',
    model: '',
    color: '',
    apartmentId: '',
    residentId: '',
    registrationDocumentUrl: '',
  });

  // Queries
  const { data: response, isLoading, isError, error, refetch } = useVehicles({
    search: search || undefined,
    building: buildingFilter || undefined,
    apartmentId: apartmentFilter || undefined,
    type: (typeFilter as VehicleType) || undefined,
    status: (statusFilter as VehicleStatus) || undefined,
    parkingCardStatus: (cardStatusFilter as ParkingCardStatus) || undefined,
    page,
    limit: 10,
  });

  const { data: apartmentsRes } = useApartments({ limit: 150 });
  const apartments = apartmentsRes?.data || [];

  // Filter residents based on selected apartment in form
  const { data: residentsRes } = useResidents({
    apartmentId: formData.apartmentId || undefined,
    limit: 50,
  });
  const apartmentResidents = residentsRes?.data || [];

  // Mutations
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();
  const approveMutation = useApproveVehicle();
  const rejectMutation = useRejectVehicle();
  const deactivateMutation = useDeactivateVehicle();
  const issueCardMutation = useIssueParkingCard();

  const vehicles = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };

  // Distinct buildings for filter
  const buildings = useMemo(() => {
    const set = new Set<string>();
    apartments.forEach((apt: any) => {
      if (apt.building) set.add(apt.building);
    });
    return Array.from(set).sort();
  }, [apartments]);

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
  if (apartmentFilter) {
    const apt = apartments.find((a: any) => a.id === apartmentFilter);
    activeTags.push({
      key: 'apartment',
      label: 'Căn hộ',
      valueLabel: apt ? apt.code : apartmentFilter,
      onRemove: () => setApartmentFilter(''),
    });
  }
  if (typeFilter) {
    const typeNames: Record<string, string> = {
      CAR: 'Ô tô',
      MOTORBIKE: 'Xe máy',
      BICYCLE: 'Xe đạp',
      ELECTRIC_BIKE: 'Xe điện',
    };
    activeTags.push({
      key: 'type',
      label: 'Loại xe',
      valueLabel: typeNames[typeFilter] || typeFilter,
      onRemove: () => setTypeFilter(''),
    });
  }
  if (statusFilter) {
    const statusNames: Record<string, string> = {
      ACTIVE: 'Đang hoạt động',
      PENDING_APPROVAL: 'Chờ duyệt',
      REJECTED: 'Từ chối',
      INACTIVE: 'Ngưng hoạt động',
    };
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel: statusNames[statusFilter] || statusFilter,
      onRemove: () => setStatusFilter(''),
    });
  }
  if (cardStatusFilter) {
    const cardStatusNames: Record<string, string> = {
      ACTIVE: 'Thẻ đang hoạt động',
      LOCKED: 'Thẻ đang khóa',
      EXPIRED: 'Thẻ hết hạn',
    };
    activeTags.push({
      key: 'cardStatus',
      label: 'Thẻ RFID',
      valueLabel: cardStatusNames[cardStatusFilter] || cardStatusFilter,
      onRemove: () => setCardStatusFilter(''),
    });
  }

  const hasActiveFilters = Boolean(
    search || buildingFilter || apartmentFilter || typeFilter || statusFilter || cardStatusFilter
  );

  const handleResetFilters = () => {
    setSearch('');
    setBuildingFilter('');
    setApartmentFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setCardStatusFilter('');
    setPage(1);
    setSelectedRowIds([]);
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      licensePlate: '',
      type: 'MOTORBIKE',
      brand: '',
      model: '',
      color: '',
      apartmentId: apartments[0]?.id || '',
      residentId: '',
      registrationDocumentUrl: '',
    });
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      licensePlate: item.licensePlate,
      type: item.type,
      brand: item.brand,
      model: item.model || '',
      color: item.color || '',
      apartmentId: item.apartmentId,
      residentId: item.residentId || '',
      registrationDocumentUrl: item.registrationDocumentUrl || '',
    });
    setIsFormOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licensePlate.trim()) {
      toast.error('Vui lòng nhập biển số xe hợp lệ');
      return;
    }
    if (!formData.apartmentId) {
      toast.error('Vui lòng chọn căn hộ sở hữu');
      return;
    }

    if (editingItem) {
      updateMutation.mutate(
        {
          id: editingItem.id,
          data: {
            licensePlate: formData.licensePlate.trim().toUpperCase(),
            type: formData.type,
            brand: formData.brand,
            model: formData.model || null,
            color: formData.color || null,
            apartmentId: formData.apartmentId,
            residentId: formData.residentId || null,
            registrationDocumentUrl: formData.registrationDocumentUrl || null,
          },
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          licensePlate: formData.licensePlate.trim().toUpperCase(),
          type: formData.type,
          brand: formData.brand,
          model: formData.model || null,
          color: formData.color || null,
          apartmentId: formData.apartmentId,
          residentId: formData.residentId || null,
          registrationDocumentUrl: formData.registrationDocumentUrl || null,
        },
        {
          onSuccess: () => {
            setIsFormOpen(false);
          },
        }
      );
    }
  };

  // Approve Vehicle
  const handleApproveConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingItem) return;

    approveMutation.mutate(
      {
        id: approvingItem.id,
        data: {
          cardCode: approveCardCode.trim() ? approveCardCode.trim().toUpperCase() : undefined,
          expiresAt: approveExpiresAt || undefined,
        },
      },
      {
        onSuccess: () => {
          setApprovingItem(null);
          setApproveCardCode('');
          setApproveExpiresAt('');
        },
      }
    );
  };

  // Reject Vehicle
  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối phê duyệt');
      return;
    }

    rejectMutation.mutate(
      {
        id: rejectingItem.id,
        data: { reason: rejectReason.trim() },
      },
      {
        onSuccess: () => {
          setRejectingItem(null);
          setRejectReason('');
        },
      }
    );
  };

  // Issue RFID Parking Card
  const handleIssueCardConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingCardItem) return;
    if (!newCardCode.trim()) {
      toast.error('Vui lòng nhập mã thẻ RFID');
      return;
    }

    issueCardMutation.mutate(
      {
        vehicleId: issuingCardItem.id,
        data: {
          cardCode: newCardCode.trim().toUpperCase(),
          expiresAt: newCardExpiresAt || undefined,
        },
      },
      {
        onSuccess: () => {
          setIssuingCardItem(null);
          setNewCardCode('');
          setNewCardExpiresAt('');
        },
      }
    );
  };

  // Deactivate Vehicle Confirm
  const handleDeactivateConfirm = () => {
    if (deactivatingId) {
      deactivateMutation.mutate(deactivatingId, {
        onSuccess: () => {
          setDeactivatingId(null);
        },
      });
    }
  };

  // Delete Vehicle Confirm
  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
        },
      });
    }
  };

  // Selection handlers
  const handleSelectRow = (id: string | number) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === vehicles.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(vehicles.map((v: any) => v.id));
    }
  };

  // Drawer detail items
  const drawerItems: DetailItem[] = inspectingItem
    ? [
        { label: 'Biển số xe', value: inspectingItem.licensePlate, icon: Car },
        { label: 'Loại phương tiện', value: inspectingItem.type },
        { label: 'Hãng sản xuất', value: inspectingItem.brand },
        { label: 'Dòng xe / Model', value: inspectingItem.model || 'Không có' },
        { label: 'Màu sơn', value: inspectingItem.color || 'Không có' },
        {
          label: 'Căn hộ sở hữu',
          value: `${inspectingItem.apartment?.code} (${inspectingItem.apartment?.building || 'Tòa nhà'})`,
          icon: Home,
        },
        {
          label: 'Chủ phương tiện',
          value: inspectingItem.resident?.fullName || 'Chưa gán cư dân cụ thể',
          icon: User,
        },
        {
          label: 'Thẻ gửi xe RFID',
          value:
            inspectingItem.parkingCards?.[0]?.cardCode || 'Chưa cấp thẻ',
          icon: KeyRound,
        },
        {
          label: 'Ngày đăng ký',
          value: formatDate(inspectingItem.createdAt),
          icon: Calendar,
        },
      ]
    : [];

  // DataTable Columns
  const columns: Column<any>[] = [
    {
      header: 'Biển số',
      accessorKey: 'licensePlate',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="font-mono font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded text-xs tracking-wider shadow-2xs">
            {row.licensePlate}
          </div>
          {row.status === 'PENDING_APPROVAL' && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" title="Cần duyệt" />
          )}
        </div>
      ),
    },
    {
      header: 'Loại xe',
      accessorKey: 'type',
      cell: (row) => <StatusBadge type="vehicleType" status={row.type} />,
    },
    {
      header: 'Hãng & Mẫu',
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
            {row.brand}
          </span>
          {row.model && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {row.model}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Màu',
      accessorKey: 'color',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.color || '—'}
        </span>
      ),
    },
    {
      header: 'Căn hộ',
      cell: (row) => (
        row.apartment ? (
          <div>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs block w-fit">
              {row.apartment.code}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {row.apartment.building} - Tầng {row.apartment.floor}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Chưa gắn</span>
        )
      ),
    },
    {
      header: 'Chủ phương tiện',
      cell: (row) => (
        row.resident ? (
          <div className="space-y-0.5">
            <span className="font-medium text-slate-900 dark:text-slate-100 text-xs block">
              {row.resident.fullName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {row.resident.phone}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">Đại diện căn hộ</span>
        )
      ),
    },
    {
      header: 'Thẻ gửi xe',
      cell: (row) => {
        const activeCard = row.parkingCards?.find((c: any) => c.status === 'ACTIVE');
        const latestCard = row.parkingCards?.[0];

        if (activeCard) {
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> {activeCard.cardCode}
              </span>
            </div>
          );
        }

        if (latestCard) {
          return (
            <div className="space-y-1">
              <span className="font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] block line-through w-fit">
                {latestCard.cardCode}
              </span>
              <StatusBadge type="parkingCardStatus" status={latestCard.status} size="sm" />
            </div>
          );
        }

        return (
          <span className="text-slate-400 text-xs italic">Chưa cấp thẻ</span>
        );
      },
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge type="vehicleStatus" status={row.status} />,
    },
    {
      header: 'Ngày tạo',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      cell: (row) => {
        const isPending = row.status === 'PENDING_APPROVAL';
        const isActive = row.status === 'ACTIVE';

        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Approval Actions for PENDING_APPROVAL */}
            {canManage && isPending && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setApprovingItem(row);
                    setApproveCardCode('');
                    setApproveExpiresAt('');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  title="Phê duyệt xe"
                  aria-label="Phê duyệt xe"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setRejectingItem(row);
                    setRejectReason('');
                  }}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Từ chối duyệt xe"
                  aria-label="Từ chối duyệt xe"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* View Details */}
            <Link href={`/vehicles/${row.id}`}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                title="Xem chi tiết hồ sơ"
                aria-label="Xem chi tiết hồ sơ"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>

            {/* Issue RFID Card (if active and doesn't have active card) */}
            {canManage && isActive && !row.parkingCards?.some((c: any) => c.status === 'ACTIVE') && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setIssuingCardItem(row);
                  setNewCardCode('');
                  setNewCardExpiresAt('');
                }}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                title="Cấp thẻ gửi xe RFID"
                aria-label="Cấp thẻ gửi xe RFID"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
            )}

            {/* Edit */}
            {canManage && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleOpenEdit(row)}
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                title="Chỉnh sửa thông tin"
                aria-label="Chỉnh sửa thông tin"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {/* Deactivate */}
            {canManage && isActive && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeactivatingId(row.id)}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                title="Ngưng hoạt động phương tiện"
                aria-label="Ngưng hoạt động phương tiện"
              >
                <PowerOff className="h-4 w-4" />
              </Button>
            )}

            {/* Delete (Admin only) */}
            {userRole === 'ADMIN' && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeletingId(row.id)}
                className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                title="Xóa phương tiện"
                aria-label="Xóa phương tiện"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Phương tiện & Hầm xe"
        description="Quản lý phương tiện đăng ký của cư dân, quy trình phê duyệt xe và cấp phát thẻ từ RFID."
      >
        {canManage && (
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Đăng ký xe mới
          </Button>
        )}
      </PageHeader>

      {/* FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Phương tiện"
      >
        {/* Building Filter */}
        <div className="w-40">
          <Select
            value={buildingFilter}
            onChange={(e) => {
              setBuildingFilter(e.target.value);
              setApartmentFilter('');
              setPage(1);
            }}
            aria-label="Lọc theo Tòa nhà"
          >
            <option value="">Tất cả tòa</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>

        {/* Apartment Filter */}
        <div className="w-44">
          <Select
            value={apartmentFilter}
            onChange={(e) => {
              setApartmentFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo Căn hộ"
          >
            <option value="">Tất cả căn hộ</option>
            {apartments
              .filter((a: any) => !buildingFilter || a.building === buildingFilter)
              .map((apt: any) => (
                <option key={apt.id} value={apt.id}>
                  {apt.code} ({apt.building})
                </option>
              ))}
          </Select>
        </div>

        {/* Vehicle Type Filter */}
        <div className="w-36">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo Loại phương tiện"
          >
            <option value="">Tất cả loại xe</option>
            <option value="CAR">Ô tô</option>
            <option value="MOTORBIKE">Xe máy</option>
            <option value="BICYCLE">Xe đạp</option>
            <option value="ELECTRIC_BIKE">Xe điện</option>
          </Select>
        </div>

        {/* Vehicle Status Filter */}
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo Trạng thái duyệt"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="REJECTED">Từ chối duyệt</option>
            <option value="INACTIVE">Ngưng hoạt động</option>
          </Select>
        </div>

        {/* Parking Card Status Filter */}
        <div className="w-40">
          <Select
            value={cardStatusFilter}
            onChange={(e) => {
              setCardStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo Thẻ gửi xe"
          >
            <option value="">Thẻ gửi xe (Tất cả)</option>
            <option value="ACTIVE">Thẻ hoạt động</option>
            <option value="LOCKED">Thẻ đang khóa</option>
            <option value="EXPIRED">Thẻ hết hạn</option>
          </Select>
        </div>
      </FilterBar>

      {/* Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm theo biển số, tên cư dân, số căn hộ, hiệu xe..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={(p) => setPage(p)}
        onRowClick={(row) => router.push(`/vehicles/${row.id}`)}
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
        title={`Phương tiện: ${inspectingItem?.licensePlate || ''}`}
        description="Thông tin chi tiết phương tiện và thẻ gửi xe liên kết"
        badge={inspectingItem && <StatusBadge type="vehicleStatus" status={inspectingItem.status} />}
        items={drawerItems}
        footerActions={
          inspectingItem && (
            <div className="flex items-center gap-2">
              <Link href={`/vehicles/${inspectingItem.id}`}>
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  Xem trang hồ sơ <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {canManage && (
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
              )}
            </div>
          )
        }
      />

      {/* Form Dialog: Create & Edit Vehicle */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingItem ? `Chỉnh sửa: ${editingItem.licensePlate}` : 'Đăng ký Phương tiện mới'}
        description="Điền thông tin biển số, chủng loại phương tiện và gán vào căn hộ cư trú."
        icon={Car}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitText={editingItem ? 'Lưu thay đổi' : 'Tạo hồ sơ phương tiện'}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Biển số xe <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: 51F-123.45 hoặc 29A-88888"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Loại phương tiện <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
            >
              <option value="MOTORBIKE">Xe máy</option>
              <option value="CAR">Ô tô</option>
              <option value="ELECTRIC_BIKE">Xe điện</option>
              <option value="BICYCLE">Xe đạp</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hãng sản xuất <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Honda, Toyota, VinFast, Yamaha"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dòng xe / Model
            </label>
            <Input
              placeholder="VD: SH 150i, Camry 2.5Q, VF8"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Màu sơn xe
            </label>
            <Input
              placeholder="VD: Trắng ngọc trai, Đen bóng, Xám titan"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gán vào Căn hộ <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.apartmentId}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  apartmentId: e.target.value,
                  residentId: '', // reset resident when apartment changes
                });
              }}
              required
            >
              <option value="">Chọn căn hộ...</option>
              {apartments.map((apt: any) => (
                <option key={apt.id} value={apt.id}>
                  {apt.code} ({apt.building} - Tầng {apt.floor})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Chủ phương tiện (Cư dân thuộc căn hộ)
          </label>
          <Select
            value={formData.residentId}
            onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
            disabled={!formData.apartmentId}
          >
            <option value="">Đại diện chung hộ gia đình / Chưa chỉ định</option>
            {apartmentResidents.map((res: any) => (
              <option key={res.id} value={res.id}>
                {res.fullName} ({res.phone}) - {res.relationshipToOwner}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Link ảnh chụp Cà vẹt / Giấy đăng ký xe
          </label>
          <Input
            type="url"
            placeholder="https://storage.example.com/cavet-xe.jpg"
            value={formData.registrationDocumentUrl}
            onChange={(e) => setFormData({ ...formData, registrationDocumentUrl: e.target.value })}
          />
        </div>
      </FormDialog>

      {/* Approve Dialog */}
      <FormDialog
        open={Boolean(approvingItem)}
        onOpenChange={(open) => !open && setApprovingItem(null)}
        title={`Phê duyệt xe: ${approvingItem?.licensePlate}`}
        description="Xác nhận hồ sơ hợp lệ, kích hoạt trạng thái phương tiện và tùy chọn cấp phát thẻ từ RFID ngay."
        icon={CheckCircle2}
        onSubmit={handleApproveConfirm}
        isLoading={approveMutation.isPending}
        submitText="Xác nhận Phê duyệt"
      >
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1 text-xs text-emerald-800 dark:text-emerald-200">
          <p className="font-semibold">
            Phương tiện: {approvingItem?.brand} {approvingItem?.model} - Biển số {approvingItem?.licensePlate}
          </p>
          <p>
            Căn hộ: {approvingItem?.apartment?.code} ({approvingItem?.apartment?.building}) | Chủ xe:{' '}
            {approvingItem?.resident?.fullName || 'Đại diện căn hộ'}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mã thẻ gửi xe RFID (Tùy chọn cấp ngay)
            </label>
            <Input
              placeholder="VD: RFID-09823 (hoặc quẹt thẻ vào đầu đọc)"
              value={approveCardCode}
              onChange={(e) => setApproveCardCode(e.target.value.toUpperCase())}
            />
            <span className="text-[11px] text-slate-400">
              Nếu để trống, phương tiện vẫn được kích hoạt và có thể cấp thẻ sau.
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hạn dùng của thẻ (Tùy chọn)
            </label>
            <Input
              type="date"
              value={approveExpiresAt}
              onChange={(e) => setApproveExpiresAt(e.target.value)}
            />
          </div>
        </div>
      </FormDialog>

      {/* Reject Dialog */}
      <FormDialog
        open={Boolean(rejectingItem)}
        onOpenChange={(open) => !open && setRejectingItem(null)}
        title={`Từ chối duyệt: ${rejectingItem?.licensePlate}`}
        description="Nhập lý do từ chối đăng ký phương tiện để thông báo đến cư dân chủ hộ."
        icon={XCircle}
        onSubmit={handleRejectConfirm}
        isLoading={rejectMutation.isPending}
        submitText="Xác nhận Từ chối"
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Lý do từ chối <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Ảnh chụp cà vẹt xe mờ không rõ biển số; Căn hộ đã vượt số lượng xe cho phép..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            autoFocus
          />
        </div>
      </FormDialog>

      {/* Issue Card Dialog */}
      <FormDialog
        open={Boolean(issuingCardItem)}
        onOpenChange={(open) => !open && setIssuingCardItem(null)}
        title={`Cấp thẻ gửi xe RFID: ${issuingCardItem?.licensePlate}`}
        description="Gán mã thẻ từ RFID vào phương tiện để kích hoạt barie kiểm soát ra vào hầm giữ xe."
        icon={KeyRound}
        onSubmit={handleIssueCardConfirm}
        isLoading={issueCardMutation.isPending}
        submitText="Kích hoạt Thẻ RFID"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mã thẻ RFID <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: RFID-A1-0023"
              value={newCardCode}
              onChange={(e) => setNewCardCode(e.target.value.toUpperCase())}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hạn sử dụng thẻ (Tùy chọn)
            </label>
            <Input
              type="date"
              value={newCardExpiresAt}
              onChange={(e) => setNewCardExpiresAt(e.target.value)}
            />
          </div>
        </div>
      </FormDialog>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deactivatingId)}
        onOpenChange={(open) => !open && setDeactivatingId(null)}
        title="Ngưng hoạt động phương tiện?"
        description="Phương tiện sẽ chuyển sang trạng thái Ngưng hoạt động. Tất cả các thẻ gửi xe RFID liên quan sẽ bị tự động khóa quyền ra vào."
        isLoading={deactivateMutation.isPending}
        onConfirm={handleDeactivateConfirm}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa hồ sơ phương tiện?"
        description="Thao tác này sẽ xóa vĩnh viễn phương tiện và các thẻ gửi xe liên quan khỏi cơ sở dữ liệu. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 p-4">
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <VehiclesContent />
    </React.Suspense>
  );
}
