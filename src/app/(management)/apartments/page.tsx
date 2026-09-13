'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Building2,
  Users,
  Layers,
  Maximize2,
  BedDouble,
  Bath,
  FileText,
  LayoutGrid,
  List,
  History,
  UserCheck,
  Receipt,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Search,
  RotateCcw,
  Sparkles,
  Phone,
  Clock,
  Car,
  X,
  Home,
  User,
} from 'lucide-react';
import {
  useApartments,
  useApartmentHierarchy,
  useApartmentHistory,
  useCreateApartment,
  useUpdateApartment,
  useDeleteApartment,
  useCreateApartmentHistory,
} from '@/hooks/use-apartments';
import { ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function ApartmentsPage() {
  // View mode switcher: 'LIST' or 'FLOOR_PLAN'
  const [viewMode, setViewMode] = useState<'LIST' | 'FLOOR_PLAN'>('FLOOR_PLAN');

  // Filters
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Sorting
  const [sortKey, setSortKey] = useState<string>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Row selection
  const [selectedRowIds, setSelectedRowIds] = useState<(string | number)[]>([]);

  // Dialog & Drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<any>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'DETAILS' | 'HISTORY'>('DETAILS');
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);

  // Form state for Apartment
  const [formData, setFormData] = useState({
    code: '',
    building: 'Tòa A (Sky)',
    floor: 1,
    bedrooms: 2,
    bathrooms: 2,
    area: 75,
    status: 'VACANT' as ApartmentStatus,
    note: '',
  });

  // Form state for History Event
  const [historyForm, setHistoryForm] = useState({
    event: 'STATUS_CHANGE' as ApartmentHistoryEvent,
    title: '',
    description: '',
  });

  // Queries & Mutations
  // For List view: paginated query
  const {
    data: listResponse,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useApartments({
    search: search || undefined,
    building: blockFilter ? (blockFilter.includes('A') ? 'Tòa A' : blockFilter.includes('B') ? 'Tòa B' : 'Tòa C') : undefined,
    block: blockFilter || undefined,
    floor: floorFilter ? parseInt(floorFilter, 10) : undefined,
    status: (statusFilter as ApartmentStatus) || undefined,
    page: viewMode === 'LIST' ? page : 1,
    limit: viewMode === 'LIST' ? 10 : 150, // Fetch full set for Floor Plan view
  });

  // Hierarchy query
  const { data: hierarchyResponse, refetch: refetchHierarchy } = useApartmentHierarchy();

  // History query for inspecting apartment
  const {
    data: historyResponse,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useApartmentHistory(inspectingItem?.id);

  const createMutation = useCreateApartment();
  const updateMutation = useUpdateApartment();
  const deleteMutation = useDeleteApartment();
  const createHistoryMutation = useCreateApartmentHistory();

  const apartments = listResponse?.data || [];
  const meta = listResponse?.meta || { page: 1, totalPages: 1, total: 0 };
  const historyList = historyResponse?.data || [];

  const hasActiveFilters = Boolean(search || blockFilter || floorFilter || statusFilter);

  const handleResetFilters = () => {
    setSearch('');
    setBlockFilter('');
    setFloorFilter('');
    setStatusFilter('');
    setPage(1);
    setSelectedRowIds([]);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      building: 'Tòa A (Sky)',
      floor: 1,
      bedrooms: 2,
      bathrooms: 2,
      area: 75,
      status: 'VACANT',
      note: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      building: item.building,
      floor: item.floor,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      area: item.area,
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
            if (inspectingItem && inspectingItem.id === editingItem.id) {
              setInspectingItem({ ...inspectingItem, ...formData });
            }
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          if (inspectingItem?.id === deletingId) {
            setInspectingItem(null);
          }
        },
      });
    }
  };

  const handleAddHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingItem) return;
    createHistoryMutation.mutate(
      {
        apartmentId: inspectingItem.id,
        data: {
          event: historyForm.event,
          title: historyForm.title,
          description: historyForm.description,
        },
      },
      {
        onSuccess: () => {
          setIsAddHistoryOpen(false);
          setHistoryForm({
            event: 'STATUS_CHANGE',
            title: '',
            description: '',
          });
          refetchHistory();
        },
      }
    );
  };

  // Active filter tags for FilterBar
  const activeTags = [];
  if (blockFilter) {
    activeTags.push({
      key: 'block',
      label: 'Khối / Tháp',
      valueLabel: blockFilter,
      onRemove: () => setBlockFilter(''),
    });
  }
  if (floorFilter) {
    activeTags.push({
      key: 'floor',
      label: 'Tầng',
      valueLabel: `Tầng ${floorFilter}`,
      onRemove: () => setFloorFilter(''),
    });
  }
  if (statusFilter) {
    activeTags.push({
      key: 'status',
      label: 'Trạng thái',
      valueLabel:
        statusFilter === 'OCCUPIED'
          ? 'Đang ở'
          : statusFilter === 'UNDER_MAINTENANCE'
          ? 'Đang sửa chữa'
          : 'Đang trống',
      onRemove: () => setStatusFilter(''),
    });
  }

  // Group apartments for Floor Plan View: Block -> Floor -> Apartments[]
  const floorPlanGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        blockName: string;
        blockCode: string;
        floors: Record<number, any[]>;
        stats: { total: number; occupied: number; vacant: number; maintenance: number };
      }
    > = {};

    apartments.forEach((apt: any) => {
      const bName = apt.building || 'Khối Chung Cư';
      const bCode = bName.includes('A')
        ? 'Block A'
        : bName.includes('B')
        ? 'Block B'
        : bName.includes('C')
        ? 'Block C'
        : bName;

      if (!groups[bCode]) {
        groups[bCode] = {
          blockName: bName,
          blockCode: bCode,
          floors: {},
          stats: { total: 0, occupied: 0, vacant: 0, maintenance: 0 },
        };
      }

      groups[bCode].stats.total += 1;
      if (apt.status === 'OCCUPIED') groups[bCode].stats.occupied += 1;
      else if (apt.status === 'UNDER_MAINTENANCE') groups[bCode].stats.maintenance += 1;
      else groups[bCode].stats.vacant += 1;

      const floorNum = apt.floor;
      if (!groups[bCode].floors[floorNum]) {
        groups[bCode].floors[floorNum] = [];
      }
      groups[bCode].floors[floorNum].push(apt);
    });

    return groups;
  }, [apartments]);

  // Table Columns for List View
  const columns: Column<any>[] = [
    {
      header: 'Mã Căn hộ',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md text-xs">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Khối & Tầng',
      accessorKey: 'building',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.building}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Tầng {row.floor}</span>
        </div>
      ),
    },
    {
      header: 'Chủ hộ / Cư dân',
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            {row.owner ? row.owner.fullName : <span className="text-slate-400 italic">Chưa có chủ hộ</span>}
          </p>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-400" />
            {row.residentsCount || 0} người ở
          </span>
        </div>
      ),
    },
    {
      header: 'Diện tích',
      accessorKey: 'area',
      sortable: true,
      cell: (row) => <span className="font-medium text-slate-700 dark:text-slate-300">{row.area} m²</span>,
    },
    {
      header: 'Trạng thái',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge type="apartment" status={row.status} />,
    },
    {
      header: 'Công nợ / Sự cố',
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {row.unpaidInvoicesCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900">
              <Receipt className="h-3 w-3 text-rose-600" />
              {formatCurrency(row.totalDebt)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Đã thanh toán
            </span>
          )}

          {row.openTicketsCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
              <Wrench className="h-3 w-3 text-amber-600" />
              {row.openTicketsCount} sự cố
            </span>
          )}
        </div>
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
            onClick={() => {
              setInspectingItem(row);
              setActiveDrawerTab('DETAILS');
            }}
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
            title="Xem chi tiết & Lịch sử"
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
      {/* Top Header with View Switcher */}
      <PageHeader
        title="Quản lý Bất động sản (Property Management)"
        description="Mô hình phân cấp Tòa nhà (Building) → Tháp (Block) → Tầng (Floor) → Căn hộ (Apartment) và lịch sử biến động."
      >
        <div className="flex items-center gap-2.5">
          {/* Switcher: [List View] & [Floor Plan View] */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('FLOOR_PLAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'FLOOR_PLAN'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Floor Plan View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List View
            </button>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" /> Thêm Căn hộ
          </Button>
        </div>
      </PageHeader>

      {/* Unified FilterBar */}
      <FilterBar
        activeTags={activeTags}
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
        totalCount={apartments.length}
        totalCountLabel="Căn hộ hiển thị"
      >
        {/* Search input in FilterBar for Floor Plan mode */}
        <div className="relative w-56">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Tìm mã căn, chủ hộ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs bg-white dark:bg-slate-900"
          />
        </div>

        {/* Filter Block */}
        <div className="w-40">
          <Select
            value={blockFilter}
            onChange={(e) => {
              setBlockFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả Block / Tòa</option>
            <option value="Block A">Block A (Sky Tower)</option>
            <option value="Block B">Block B (Ocean Tower)</option>
            <option value="Block C">Block C (Garden Tower)</option>
          </Select>
        </div>

        {/* Filter Floor */}
        <div className="w-36">
          <Select
            value={floorFilter}
            onChange={(e) => {
              setFloorFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả các tầng</option>
            {[1, 2, 3, 5, 6, 10, 12, 15, 20, 21].map((fl) => (
              <option key={fl} value={fl.toString()}>
                Tầng {fl.toString().padStart(2, '0')}
              </option>
            ))}
          </Select>
        </div>

        {/* Filter Status */}
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="OCCUPIED">Đang ở (Occupied)</option>
            <option value="VACANT">Đang trống (Vacant)</option>
            <option value="UNDER_MAINTENANCE">Đang sửa chữa (Maintenance)</option>
          </Select>
        </div>
      </FilterBar>

      {/* =====================================================================
          VIEW MODE 1: FLOOR PLAN VIEW (Hierarchical Block -> Floor -> Cards)
          ===================================================================== */}
      {viewMode === 'FLOOR_PLAN' && (
        <div className="space-y-8">
          {isListLoading ? (
            <div className="space-y-6 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 space-y-4">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : isListError ? (
            <ErrorState
              title="Không thể tải sơ đồ căn hộ"
              message={(listError as any)?.message}
              onRetry={() => refetchList()}
            />
          ) : Object.keys(floorPlanGroups).length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Không tìm thấy căn hộ phù hợp</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng điều chỉnh hoặc xóa bớt tiêu chí lọc</p>
              <Button size="sm" variant="outline" onClick={handleResetFilters} className="mt-3 text-xs">
                Đặt lại bộ lọc
              </Button>
            </div>
          ) : (
            Object.entries(floorPlanGroups).map(([bCode, bGroup]) => {
              const floorEntries = Object.entries(bGroup.floors).sort(
                ([f1], [f2]) => parseInt(f1) - parseInt(f2)
              );

              return (
                <Card
                  key={bCode}
                  className="border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden"
                >
                  {/* Block Header */}
                  <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                              {bGroup.blockName} ({bCode})
                            </CardTitle>
                            <Badge variant="outline" className="text-[11px] font-semibold bg-white/80 dark:bg-slate-800">
                              {floorEntries.length} Tầng hiển thị
                            </Badge>
                          </div>
                          <CardDescription className="text-xs mt-0.5">
                            Cấu trúc sơ đồ mặt bằng tầng và tình trạng vận hành căn hộ
                          </CardDescription>
                        </div>
                      </div>

                      {/* Block Quick Stats */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold border border-blue-200/60">
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                          {bGroup.stats.occupied} Đang ở
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold border border-slate-200">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          {bGroup.stats.vacant} Trống
                        </span>
                        {bGroup.stats.maintenance > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold border border-amber-200">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            {bGroup.stats.maintenance} Bảo dưỡng
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-6">
                    {floorEntries.map(([floorNum, aptList]) => (
                      <div key={floorNum} className="space-y-3">
                        {/* Floor Branch Line Header */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                            <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            Tầng {floorNum.toString().padStart(2, '0')}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">({aptList.length} Căn hộ)</span>
                          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        </div>

                        {/* Apartments Grid for this Floor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pl-2 sm:pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-3.5">
                          {aptList.map((apt: any) => {
                            const isOccupied = apt.status === 'OCCUPIED';
                            const isMaintenance = apt.status === 'UNDER_MAINTENANCE';
                            const hasDebt = apt.unpaidInvoicesCount > 0;
                            const hasTicket = apt.openTicketsCount > 0;

                            return (
                              <div
                                key={apt.id}
                                onClick={() => {
                                  setInspectingItem(apt);
                                  setActiveDrawerTab('DETAILS');
                                }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
                                  isOccupied
                                    ? 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-blue-500'
                                    : isMaintenance
                                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-500'
                                    : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800 hover:border-slate-400'
                                }`}
                              >
                                {/* Card Header: Code & Consistent Status Badge */}
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                  <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                    {apt.code}
                                  </span>
                                  <StatusBadge type="apartment" status={apt.status} />
                                </div>

                                {/* Owner Information */}
                                <div className="space-y-1 text-xs mb-3">
                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <span>Chủ hộ:</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={apt.owner?.fullName}>
                                      {apt.owner ? apt.owner.fullName : <span className="italic font-normal text-slate-400">Chưa có</span>}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <span>Cư dân:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                      <Users className="h-3 w-3 text-slate-400" />
                                      {apt.residentsCount || 0} người
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <span>Quy mô:</span>
                                    <span>
                                      {apt.bedrooms}PN • {apt.area}m²
                                    </span>
                                  </div>
                                </div>

                                {/* Indicators: Outstanding Debt & Maintenance Ticket */}
                                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                                  {/* Debt Badge */}
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400">Phí DV:</span>
                                    {hasDebt ? (
                                      <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Receipt className="h-3 w-3" />
                                        Nợ {formatCurrency(apt.totalDebt)}
                                      </span>
                                    ) : (
                                      <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Đã nộp đủ
                                      </span>
                                    )}
                                  </div>

                                  {/* Maintenance Issue Badge */}
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400">Kỹ thuật:</span>
                                    {hasTicket ? (
                                      <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Wrench className="h-3 w-3" />
                                        {apt.openTicketsCount} sự cố mở
                                      </span>
                                    ) : (
                                      <span className="font-normal text-slate-500">Bình thường</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW MODE 2: STANDARD ENTERPRISE LIST VIEW (DataTable)
          ===================================================================== */}
      {viewMode === 'LIST' && (
        <DataTable
          columns={columns}
          data={apartments}
          isLoading={isListLoading}
          isError={isListError}
          errorMessage={(listError as any)?.message}
          onRetry={() => refetchList()}
          searchPlaceholder="Tìm mã căn hộ (VD: A-1001)..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          page={page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          onPageChange={setPage}
          onRowClick={(row) => {
            setInspectingItem(row);
            setActiveDrawerTab('DETAILS');
          }}
          enableRowSelection
          selectedRowIds={selectedRowIds}
          onRowSelect={(id: string | number) => {
            setSelectedRowIds((prev) =>
              prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
          }}
          onSelectAll={() => {
            if (selectedRowIds.length === apartments.length) setSelectedRowIds([]);
            else setSelectedRowIds(apartments.map((a: any) => a.id));
          }}
        />
      )}

      {/* =====================================================================
          APARTMENT DETAIL DRAWER WITH HISTORY TIMELINE
          ===================================================================== */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                      Căn hộ {inspectingItem.code}
                    </h3>
                    <StatusBadge type="apartment" status={inspectingItem.status} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {inspectingItem.building} • Tầng {inspectingItem.floor}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setInspectingItem(null)}
                  className="rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Tab Navigation: Details vs History Timeline */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveDrawerTab('DETAILS')}
                className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
                  activeDrawerTab === 'DETAILS'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Thông tin Căn hộ
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('HISTORY')}
                className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeDrawerTab === 'HISTORY'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Lịch sử Biến động ({historyList.length})
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeDrawerTab === 'DETAILS' && (
                <div className="space-y-6">
                  {/* Basic Specifications */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 block mb-0.5">Diện tích sàn</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {inspectingItem.area} m²
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 block mb-0.5">Cấu trúc</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {inspectingItem.bedrooms} PN, {inspectingItem.bathrooms} PT
                      </span>
                    </div>
                  </div>

                  {/* Financial & Maintenance Status */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">
                      Tình trạng dịch vụ & tài chính
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Công nợ hiện tại:</span>
                      <span
                        className={`font-bold ${
                          inspectingItem.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                        }`}
                      >
                        {inspectingItem.totalDebt > 0
                          ? formatCurrency(inspectingItem.totalDebt)
                          : 'Đã hoàn tất thanh toán'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sự cố bảo trì đang mở:</span>
                      <span
                        className={`font-bold ${
                          inspectingItem.openTicketsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {inspectingItem.openTicketsCount > 0
                          ? `${inspectingItem.openTicketsCount} yêu cầu đang xử lý`
                          : 'Không có sự cố nào'}
                      </span>
                    </div>
                  </div>

                  {/* HOUSEHOLD Hierarchy Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                          HỘ GIA ĐÌNH (HOUSEHOLD)
                        </h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {inspectingItem.residents?.length || 0} thành viên
                      </Badge>
                    </div>

                    {(() => {
                      const allRes = inspectingItem.residents || [];
                      const owner = allRes.find((r: any) => r.relationshipToOwner === 'OWNER');
                      const family = allRes.filter((r: any) => r.relationshipToOwner === 'FAMILY' && r.id !== owner?.id);
                      const tenants = allRes.filter((r: any) => r.relationshipToOwner === 'TENANT');
                      const temporary = allRes.filter((r: any) => r.relationshipToOwner === 'TEMPORARY_RESIDENT');

                      if (allRes.length === 0) {
                        return (
                          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 italic">
                            Chưa có thông tin nhân khẩu / hộ gia đình đăng ký
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {/* 👤 Chủ hộ */}
                          {owner ? (
                            <div className="p-3 rounded-xl border-2 border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                                  <span className="text-base leading-none">👤</span>
                                  <span>Chủ hộ</span>
                                </div>
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px]">
                                  CHỦ SỞ HỮU
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {owner.fullName}
                                </span>
                                <span className="text-[11px] text-emerald-600 font-medium">
                                  {owner.status === 'RESIDING' ? 'Đang cư trú' : owner.status === 'TEMPORARY_ABSENT' ? 'Tạm vắng' : 'Đã dọn đi'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {owner.phone || 'Chưa có SĐT'}
                                </span>
                                {owner.identityCard && (
                                  <span className="font-mono text-slate-400">CCCD: {owner.identityCard}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                              <span>⚠️</span> Chưa xác lập chủ sở hữu chính thức
                            </div>
                          )}

                          {/* 👩👦 Thành viên gia đình */}
                          {family.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <span>👩‍👦</span> Thành viên gia đình ({family.length})
                              </span>
                              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                {family.map((m: any, idx: number) => (
                                  <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                          {idx % 2 === 0 ? '👩' : '👦'} {m.fullName}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px]">
                                          Thành viên
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" /> {m.phone || '—'}
                                        </span>
                                        {m.identityCard && <span className="font-mono">CCCD: {m.identityCard}</span>}
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-emerald-600">
                                      {m.status === 'RESIDING' ? 'Đang cư trú' : m.status === 'TEMPORARY_ABSENT' ? 'Tạm vắng' : 'Đã dọn đi'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 🏠 Khách thuê */}
                          {tenants.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <span>🏠</span> Khách thuê ({tenants.length})
                              </span>
                              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                {tenants.map((t: any) => (
                                  <div key={t.id} className="p-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                          🏠 {t.fullName}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                                          Khách thuê
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" /> {t.phone || '—'}
                                        </span>
                                        {t.identityCard && <span className="font-mono">CCCD: {t.identityCard}</span>}
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-purple-600">
                                      {t.status === 'RESIDING' ? 'Đang thuê' : t.status === 'TEMPORARY_ABSENT' ? 'Tạm vắng' : 'Hết hạn thuê'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ⏱️ Tạm trú */}
                          {temporary.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <span>⏱️</span> Nhân khẩu tạm trú ({temporary.length})
                              </span>
                              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                {temporary.map((tr: any) => (
                                  <div key={tr.id} className="p-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                          ⏱️ {tr.fullName}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                                          Tạm trú
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" /> {tr.phone || '—'}
                                        </span>
                                        {tr.identityCard && <span className="font-mono">CCCD: {tr.identityCard}</span>}
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-amber-600">
                                      {tr.status === 'RESIDING' ? 'Còn hạn' : 'Hết hạn'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Note */}
                  {inspectingItem.note && (
                    <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs">
                      <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">Ghi chú căn hộ:</span>
                      <p className="text-slate-700 dark:text-slate-300">{inspectingItem.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================================
                  TAB 2: HISTORY TIMELINE
                  =================================================================== */}
              {activeDrawerTab === 'HISTORY' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Dòng thời gian biến động căn hộ
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddHistoryOpen(true)}
                      className="text-xs h-7 gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Ghi nhận sự kiện
                    </Button>
                  </div>

                  {isHistoryLoading ? (
                    <div className="space-y-4 animate-pulse">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                      ))}
                    </div>
                  ) : historyList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <History className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold">Chưa có bản ghi lịch sử nào</p>
                      <p className="text-[11px]">Các sự kiện chuyển nhượng, đổi trạng thái sẽ được ghi nhận tại đây.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {historyList.map((item: any) => {
                        const isOwnerTransfer = item.event === 'OWNER_TRANSFER';
                        const isMoveIn = item.event === 'RESIDENT_MOVE_IN' || item.event === 'TENANT_MOVE_IN';
                        const isMoveOut = item.event === 'RESIDENT_MOVE_OUT' || item.event === 'TENANT_MOVE_OUT';

                        const dotBg = isOwnerTransfer
                          ? 'bg-blue-600'
                          : isMoveIn
                          ? 'bg-emerald-600'
                          : isMoveOut
                          ? 'bg-rose-600'
                          : 'bg-amber-500';

                        const eventBadgeLabel =
                          item.event === 'OWNER_TRANSFER'
                            ? 'Chuyển quyền sở hữu'
                            : item.event === 'RESIDENT_MOVE_IN'
                            ? 'Cư dân dọn vào'
                            : item.event === 'TENANT_MOVE_IN'
                            ? 'Khách thuê dọn vào'
                            : item.event === 'RESIDENT_MOVE_OUT'
                            ? 'Cư dân chuyển đi'
                            : item.event === 'TENANT_MOVE_OUT'
                            ? 'Khách thuê dọn đi'
                            : 'Thay đổi trạng thái';

                        return (
                          <div key={item.id} className="relative group">
                            {/* Timeline Node Dot */}
                            <div
                              className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${dotBg} shadow-xs`}
                            />

                            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <Badge variant="secondary" className="text-[10px] font-semibold">
                                  {eventBadgeLabel}
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatDateTime(item.createdAt)}
                                </span>
                              </div>

                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                                {item.title}
                              </h5>

                              {item.description && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {item.description}
                                </p>
                              )}

                              {item.performedBy && (
                                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                                  Người thực hiện: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.performedBy}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingItem(null)}
                className="text-xs"
              >
                Đóng
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleOpenEdit(inspectingItem);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" /> Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DIALOG: CREATE / EDIT APARTMENT
          ===================================================================== */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingItem ? `Chỉnh sửa Căn hộ: ${editingItem.code}` : 'Thêm Căn hộ mới'}
        description="Điền thông tin mã căn, cơ cấu tầng, số phòng và diện tích thực tế."
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mã căn hộ <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: A-1001, B-2001..."
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Khối / Tòa nhà <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
            >
              <option value="Tòa A (Sky)">Tòa A (Sky Tower)</option>
              <option value="Tòa B (Ocean)">Tòa B (Ocean Tower)</option>
              <option value="Tòa C (Garden)">Tòa C (Garden Tower)</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tầng số <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Diện tích (m²) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.1"
              min={10}
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Trạng thái</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ApartmentStatus })}
            >
              <option value="VACANT">Đang trống</option>
              <option value="OCCUPIED">Đang ở</option>
              <option value="UNDER_MAINTENANCE">Đang sửa chữa</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Số phòng ngủ</label>
            <Input
              type="number"
              min={1}
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Số phòng tắm</label>
            <Input
              type="number"
              min={1}
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ghi chú thêm</label>
          <Input
            placeholder="Nội thất bàn giao, hướng ban công..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
      </FormDialog>

      {/* =====================================================================
          DIALOG: ADD HISTORY EVENT
          ===================================================================== */}
      <FormDialog
        open={isAddHistoryOpen}
        onOpenChange={setIsAddHistoryOpen}
        title={`Ghi nhận sự kiện cho Căn hộ ${inspectingItem?.code}`}
        description="Ghi nhận dòng thời gian bàn giao, chuyển quyền sở hữu hoặc dọn vào/ra của cư dân."
        onSubmit={handleAddHistorySubmit}
        isLoading={createHistoryMutation.isPending}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Loại sự kiện <span className="text-rose-500">*</span>
          </label>
          <Select
            value={historyForm.event}
            onChange={(e) => setHistoryForm({ ...historyForm, event: e.target.value as ApartmentHistoryEvent })}
          >
            <option value="OWNER_TRANSFER">OWNER_TRANSFER (Chuyển nhượng quyền sở hữu)</option>
            <option value="TENANT_MOVE_IN">TENANT_MOVE_IN (Khách thuê dọn vào)</option>
            <option value="TENANT_MOVE_OUT">TENANT_MOVE_OUT (Khách thuê dọn đi)</option>
            <option value="RESIDENT_MOVE_IN">RESIDENT_MOVE_IN (Cư dân dọn vào)</option>
            <option value="RESIDENT_MOVE_OUT">RESIDENT_MOVE_OUT (Cư dân dọn đi)</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE (Thay đổi trạng thái căn hộ)</option>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tiêu đề sự kiện <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Bàn giao quyền sở hữu cho anh Nguyễn Văn A"
            value={historyForm.title}
            onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mô tả chi tiết
          </label>
          <Input
            placeholder="Nội dung biên bản, số hợp đồng hoặc tình trạng bàn giao..."
            value={historyForm.description}
            onChange={(e) => setHistoryForm({ ...historyForm, description: e.target.value })}
          />
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa căn hộ?"
        description="Thao tác này sẽ xóa vĩnh viễn thông tin căn hộ khỏi hệ thống. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
