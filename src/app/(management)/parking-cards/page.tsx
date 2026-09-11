'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  KeyRound,
  Car,
  Lock,
  Unlock,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Trash2,
  Edit,
  Building2,
  User,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import {
  useParkingCards,
  useLockParkingCard,
  useUnlockParkingCard,
  useUpdateParkingCard,
  useDeleteParkingCard,
} from '@/hooks/use-parking-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkingCardStatus } from '@prisma/client';
import { toast } from 'sonner';

function ParkingCardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'MANAGER';
  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER';

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [page, setPage] = useState(1);

  // Sorting & Row Selection
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Dialog States
  const [lockingCard, setLockingCard] = useState<any>(null);
  const [lockReason, setLockReason] = useState('');

  const [unlockingCard, setUnlockingCard] = useState<any>(null);

  const [editingCard, setEditingCard] = useState<any>(null);
  const [editExpiresAt, setEditExpiresAt] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Queries
  const { data: response, isLoading, isError, error, refetch } = useParkingCards({
    search: search || undefined,
    status: (statusFilter as ParkingCardStatus) || undefined,
    page,
    limit: 10,
  });

  // Mutations
  const lockMutation = useLockParkingCard();
  const unlockMutation = useUnlockParkingCard();
  const updateMutation = useUpdateParkingCard();
  const deleteMutation = useDeleteParkingCard();

  const cards = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };

  // Filter tags
  const activeTags = [];
  if (statusFilter) {
    const statusLabels: Record<string, string> = {
      ACTIVE: 'Đang hoạt động',
      LOCKED: 'Đang khóa',
      EXPIRED: 'Hết hạn',
    };
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel: statusLabels[statusFilter] || statusFilter,
      onRemove: () => setStatusFilter(''),
    });
  }

  const hasActiveFilters = Boolean(search || statusFilter);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
    setSelectedRowIds([]);
  };

  // Lock Card Confirm
  const handleLockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockingCard) return;
    if (!lockReason.trim()) {
      toast.error('Vui lòng nhập lý do khóa thẻ RFID');
      return;
    }

    lockMutation.mutate(
      {
        id: lockingCard.id,
        data: { lockReason: lockReason.trim() },
      },
      {
        onSuccess: () => {
          setLockingCard(null);
          setLockReason('');
        },
      }
    );
  };

  // Unlock Card Confirm
  const handleUnlockConfirm = () => {
    if (!unlockingCard) return;

    unlockMutation.mutate(unlockingCard.id, {
      onSuccess: () => {
        setUnlockingCard(null);
      },
    });
  };

  // Update Expiration Confirm
  const handleUpdateExpirationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    updateMutation.mutate(
      {
        id: editingCard.id,
        data: {
          expiresAt: editExpiresAt || null,
        },
      },
      {
        onSuccess: () => {
          setEditingCard(null);
          setEditExpiresAt('');
        },
      }
    );
  };

  // Delete Confirm
  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
        },
      });
    }
  };

  // Row selection
  const handleSelectRow = (id: string | number) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === cards.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(cards.map((c: any) => c.id));
    }
  };

  // Columns
  const columns: Column<any>[] = [
    {
      header: 'Mã thẻ RFID',
      accessorKey: 'cardCode',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="font-mono font-black text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 px-2.5 py-1 rounded text-xs tracking-wider flex items-center gap-1.5 shadow-2xs">
            <KeyRound className="h-3.5 w-3.5" />
            {row.cardCode}
          </div>
        </div>
      ),
    },
    {
      header: 'Phương tiện gắn kèm',
      cell: (row) => {
        const v = row.vehicle;
        if (!v) {
          return <span className="text-slate-400 text-xs italic">Chưa gán xe</span>;
        }

        return (
          <Link
            href={`/vehicles/${v.id}`}
            className="group block space-y-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                {v.licensePlate}
              </span>
              <StatusBadge type="vehicleType" status={v.type} size="sm" />
            </div>
            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
              {v.brand} {v.model || ''}
            </span>
          </Link>
        );
      },
    },
    {
      header: 'Căn hộ',
      cell: (row) => {
        const apt = row.vehicle?.apartment;
        if (!apt) {
          return <span className="text-slate-400 text-xs italic">—</span>;
        }

        return (
          <div>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs block w-fit">
              {apt.code}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {apt.building}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Chủ phương tiện',
      cell: (row) => {
        const res = row.vehicle?.resident;
        if (!res) {
          return <span className="text-slate-400 text-xs italic">Đại diện hộ</span>;
        }

        return (
          <div className="space-y-0.5">
            <span className="font-medium text-slate-900 dark:text-slate-100 text-xs block">
              {res.fullName}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              {res.phone}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Ngày cấp',
      accessorKey: 'issuedAt',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {formatDate(row.issuedAt)}
        </span>
      ),
    },
    {
      header: 'Hạn sử dụng',
      accessorKey: 'expiresAt',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.expiresAt ? formatDate(row.expiresAt) : 'Vô thời hạn'}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge type="parkingCardStatus" status={row.status} />
          {row.lockReason && (
            <span className="text-[10px] text-rose-500 dark:text-rose-400 block truncate max-w-[140px]" title={row.lockReason}>
              Lý do: {row.lockReason}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Thao tác',
      className: 'text-right',
      cell: (row) => {
        const isActive = row.status === 'ACTIVE';
        const isLocked = row.status === 'LOCKED';

        return (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lock Action (requires reason) */}
            {canManage && isActive && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setLockingCard(row);
                  setLockReason('');
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Khóa thẻ"
                aria-label="Khóa thẻ"
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}

            {/* Unlock Action */}
            {canManage && isLocked && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setUnlockingCard(row)}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                title="Mở khóa thẻ"
                aria-label="Mở khóa thẻ"
              >
                <Unlock className="h-4 w-4" />
              </Button>
            )}

            {/* Edit Expiration */}
            {canManage && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setEditingCard(row);
                  setEditExpiresAt(
                    row.expiresAt ? new Date(row.expiresAt).toISOString().split('T')[0] : ''
                  );
                }}
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                title="Gia hạn / Sửa hạn dùng"
                aria-label="Gia hạn / Sửa hạn dùng"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            )}

            {/* Delete (Admin only) */}
            {userRole === 'ADMIN' && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeletingId(row.id)}
                className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                title="Xóa thẻ"
                aria-label="Xóa thẻ"
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
        title="Thẻ Gửi Xe RFID"
        description="Kiểm soát danh mục thẻ từ ra vào hầm xe, quản lý khóa/mở quyền quẹt và đối soát phương tiện gắn kèm."
      />

      {/* FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={meta.total}
        totalCountLabel="Thẻ RFID"
      >
        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo Trạng thái thẻ"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đang khóa</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </Select>
        </div>
      </FilterBar>

      {/* Enterprise DataTable */}
      <DataTable
        columns={columns}
        data={cards}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        searchPlaceholder="Tìm theo mã thẻ, biển số xe..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        page={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={(p) => setPage(p)}
        onRowClick={(row) => {
          if (row.vehicle?.id) {
            router.push(`/vehicles/${row.vehicle.id}`);
          }
        }}
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

      {/* Lock Card Dialog (Mandatory Reason) */}
      <FormDialog
        open={Boolean(lockingCard)}
        onOpenChange={(open) => !open && setLockingCard(null)}
        title={`Khóa thẻ RFID: ${lockingCard?.cardCode}`}
        description="Thẻ sau khi khóa sẽ bị hệ thống barie từ chối mở cổng kiểm soát ra vào."
        icon={Lock}
        onSubmit={handleLockSubmit}
        isLoading={lockMutation.isPending}
        submitText="Xác nhận Khóa thẻ"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Mã thẻ: <span className="font-mono text-indigo-600">{lockingCard?.cardCode}</span>
            </p>
            {lockingCard?.vehicle && (
              <p className="text-slate-500">
                Phương tiện: {lockingCard.vehicle.brand} - Biển số {lockingCard.vehicle.licensePlate} (Căn hộ{' '}
                {lockingCard.vehicle.apartment?.code})
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Lý do khóa thẻ <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Cư dân báo mất thẻ; Chậm đóng phí giữ xe 2 tháng..."
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>
      </FormDialog>

      {/* Unlock Card Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(unlockingCard)}
        onOpenChange={(open) => !open && setUnlockingCard(null)}
        title={`Mở khóa thẻ RFID: ${unlockingCard?.cardCode}?`}
        description="Thẻ sẽ được phục hồi trạng thái hoạt động bình thường để quẹt qua cổng hầm xe."
        isLoading={unlockMutation.isPending}
        onConfirm={handleUnlockConfirm}
      />

      {/* Edit Expiration Dialog */}
      <FormDialog
        open={Boolean(editingCard)}
        onOpenChange={(open) => !open && setEditingCard(null)}
        title={`Gia hạn thẻ RFID: ${editingCard?.cardCode}`}
        description="Cập nhật ngày hết hạn sử dụng của thẻ từ giữ xe."
        icon={Calendar}
        onSubmit={handleUpdateExpirationSubmit}
        isLoading={updateMutation.isPending}
        submitText="Lưu hạn dùng"
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Hạn dùng mới (Để trống nếu vô thời hạn)
          </label>
          <Input
            type="date"
            value={editExpiresAt}
            onChange={(e) => setEditExpiresAt(e.target.value)}
          />
        </div>
      </FormDialog>

      {/* Delete Card Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa thẻ RFID?"
        description="Thao tác này sẽ xóa vĩnh viễn mã thẻ khỏi hệ thống. Không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default function ParkingCardsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6 p-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ParkingCardsContent />
    </React.Suspense>
  );
}
