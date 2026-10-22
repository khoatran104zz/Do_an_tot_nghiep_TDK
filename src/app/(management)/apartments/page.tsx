'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  Receipt,
  Wrench,
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
  FolderTree,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useApartments,
  useApartmentHierarchy,
  useApartmentHistory,
  useCreateApartment,
  useUpdateApartment,
  useDeleteApartment,
  useCreateApartmentHistory,
  useBuildings,
  useCreateBuilding,
  useUpdateBuilding,
  useDeleteBuilding,
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
  useCreateFloor,
  useUpdateFloor,
  useDeleteFloor,
  useBootstrapHierarchy,
} from '@/hooks/use-apartments';
import { ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PropertyTree, SelectedNode } from '@/components/property/PropertyTree';
import { BuildingDetailCard } from '@/components/property/BuildingDetailCard';
import { BlockDetailCard } from '@/components/property/BlockDetailCard';
import { FloorDetailCard } from '@/components/property/FloorDetailCard';
import { ApartmentDetailCard } from '@/components/property/ApartmentDetailCard';
import { PropertyKPIOverview } from '@/components/property/PropertyKPIOverview';
import { InteractiveFloorPlan } from '@/components/property/InteractiveFloorPlan';
import {
  BuildingFormModal,
  BlockFormModal,
  FloorFormModal,
  ApartmentFormModal,
} from '@/components/property/PropertyModals';
import { useBuildingContext } from '@/context/BuildingContext';

export default function ApartmentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER';
  const isAdmin = userRole === 'ADMIN';

  const { selectedBuildingId } = useBuildingContext();

  // View mode switcher: 'TREE' | 'FLOOR_PLAN' | 'LIST'
  const [viewMode, setViewMode] = useState<'TREE' | 'FLOOR_PLAN' | 'LIST'>('TREE');

  // Collapsible Left Explorer Panel in Tree mode
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);

  // Property Tree Selected Node State
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  // Hierarchy CRUD Modals State
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [targetBuildingIdForBlock, setTargetBuildingIdForBlock] = useState<string>('');
  const [editingBlock, setEditingBlock] = useState<any>(null);

  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [targetBlockIdForFloor, setTargetBlockIdForFloor] = useState<string>('');
  const [suggestedFloorNum, setSuggestedFloorNum] = useState<number>(1);
  const [editingFloor, setEditingFloor] = useState<any>(null);

  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [defaultFloorIdForApt, setDefaultFloorIdForApt] = useState<string>('');

  // Filters for List view
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
    building: 'Tòa A',
    buildingId: '',
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
  const {
    data: listResponse,
    isLoading: isListLoading,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useApartments({
    search: search || undefined,
    buildingId: selectedBuildingId || undefined,
    building: blockFilter ? (blockFilter.includes('A') ? 'Tòa A' : blockFilter.includes('B') ? 'Tòa B' : 'Tòa C') : undefined,
    block: blockFilter || undefined,
    floor: floorFilter ? parseInt(floorFilter, 10) : undefined,
    status: (statusFilter as ApartmentStatus) || undefined,
    page: viewMode === 'LIST' ? page : 1,
    limit: viewMode === 'LIST' ? 10 : 300,
  });

  // Hierarchy query
  const {
    data: hierarchyResponse,
    isLoading: isHierarchyLoading,
    refetch: refetchHierarchy,
  } = useApartmentHierarchy(selectedBuildingId || undefined);

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

  // Building/Block/Floor mutations
  const createBuildingMutation = useCreateBuilding();
  const updateBuildingMutation = useUpdateBuilding();
  const deleteBuildingMutation = useDeleteBuilding();

  const createBlockMutation = useCreateBlock();
  const updateBlockMutation = useUpdateBlock();
  const deleteBlockMutation = useDeleteBlock();

  const createFloorMutation = useCreateFloor();
  const updateFloorMutation = useUpdateFloor();
  const deleteFloorMutation = useDeleteFloor();

  const bootstrapMutation = useBootstrapHierarchy();

  const apartments = listResponse?.data || [];
  const hierarchyList = hierarchyResponse?.data || [];

  // Dynamically extract all available floor numbers
  const allFloorNumbers = useMemo(() => {
    const nums = new Set<number>();
    hierarchyList.forEach((b: any) => {
      (b.blocks || []).forEach((blk: any) => {
        (blk.floors || []).forEach((flr: any) => {
          if (flr.floorNumber) nums.add(flr.floorNumber);
        });
      });
    });
    const sorted = Array.from(nums).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : Array.from({ length: 25 }, (_, i) => i + 1);
  }, [hierarchyList]);

  // Aggregate KPI Data from Real Hierarchy
  const kpiData = useMemo(() => {
    const totalBuildings = hierarchyList.length;
    let totalBlocks = 0;
    let totalFloors = 0;
    let totalApartments = 0;
    let occupiedCount = 0;
    let vacantCount = 0;
    let maintenanceCount = 0;
    let totalDebt = 0;
    let openTickets = 0;

    hierarchyList.forEach((b: any) => {
      (b.blocks || []).forEach((blk: any) => {
        totalBlocks++;
        (blk.floors || []).forEach((flr: any) => {
          totalFloors++;
          (flr.apartments || []).forEach((apt: any) => {
            totalApartments++;
            if (apt.status === 'OCCUPIED') occupiedCount++;
            else if (apt.status === 'UNDER_MAINTENANCE') maintenanceCount++;
            else vacantCount++;

            if (apt.invoices) {
              apt.invoices.forEach((inv: any) => {
                if (inv.status === 'UNPAID' || inv.status === 'OVERDUE') {
                  totalDebt += Number(inv.totalAmount) || 0;
                }
              });
            }

            if (apt.feedbacks) {
              openTickets += apt.feedbacks.filter(
                (f: any) =>
                  f.status === 'NEW' ||
                  f.status === 'ASSIGNED' ||
                  f.status === 'PROCESSING' ||
                  f.status === 'OPEN' ||
                  f.status === 'IN_PROGRESS'
              ).length;
            }
          });
        });
      });
    });

    const occupancyRate =
      totalApartments > 0 ? Math.round((occupiedCount / totalApartments) * 100) : 0;

    return {
      totalBuildings,
      totalBlocks,
      totalFloors,
      totalApartments,
      occupiedCount,
      vacantCount,
      maintenanceCount,
      occupancyRate,
      totalDebt,
      openTickets,
    };
  }, [hierarchyList]);

  // Default select first building once hierarchy loads if none selected
  React.useEffect(() => {
    if (!selectedNode && hierarchyList.length > 0) {
      const firstBuilding = hierarchyList[0];
      setSelectedNode({
        type: 'BUILDING',
        id: firstBuilding.id,
        data: firstBuilding,
        parentPath: {
          buildingName: firstBuilding.name,
          buildingId: firstBuilding.id,
        },
      });
    }
  }, [hierarchyList, selectedNode]);

  // Keep selected node in sync with updated hierarchy data
  const currentSelectedData = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.type === 'BUILDING') {
      return hierarchyList.find((b: any) => b.id === selectedNode.id) || selectedNode.data;
    }
    if (selectedNode.type === 'BLOCK') {
      for (const b of hierarchyList) {
        const blk = (b.blocks || []).find((x: any) => x.id === selectedNode.id);
        if (blk) return blk;
      }
      return selectedNode.data;
    }
    if (selectedNode.type === 'FLOOR') {
      for (const b of hierarchyList) {
        for (const blk of b.blocks || []) {
          const flr = (blk.floors || []).find((f: any) => f.id === selectedNode.id);
          if (flr) return flr;
        }
      }
      return selectedNode.data;
    }
    if (selectedNode.type === 'APARTMENT') {
      for (const b of hierarchyList) {
        for (const blk of b.blocks || []) {
          for (const flr of blk.floors || []) {
            const apt = (flr.apartments || []).find((a: any) => a.id === selectedNode.id);
            if (apt) return apt;
          }
        }
      }
      return selectedNode.data;
    }
    return selectedNode.data;
  }, [hierarchyList, selectedNode]);

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
      building: 'Tòa A',
      buildingId: selectedBuildingId || hierarchyList[0]?.id || '',
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
      building: item.building || 'Tòa A',
      buildingId: item.buildingId || selectedBuildingId || hierarchyList[0]?.id || '',
      floor: item.floor || 1,
      bedrooms: item.bedrooms || 2,
      bathrooms: item.bathrooms || 2,
      area: item.area || 75,
      status: item.status || 'VACANT',
      note: item.note || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      buildingId: formData.buildingId || selectedBuildingId || hierarchyList[0]?.id || '',
    };
    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, data: payload },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            if (inspectingItem && inspectingItem.id === editingItem.id) {
              setInspectingItem({ ...inspectingItem, ...payload });
            }
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
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
          if (selectedNode?.type === 'APARTMENT' && selectedNode.id === deletingId) {
            setSelectedNode(null);
          }
        },
      });
    }
  };

  const handleAddHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const aptId = inspectingItem?.id || (selectedNode?.type === 'APARTMENT' ? selectedNode.id : null);
    if (!aptId) return;

    createHistoryMutation.mutate(
      {
        apartmentId: aptId,
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

  // Active filter tags for FilterBar in List View
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

  // Table Columns for List View
  const columns: Column<any>[] = [
    {
      header: 'Mã Căn hộ',
      accessorKey: 'code',
      sortable: true,
      cell: (row) => (
        <span className="font-mono font-black text-[#0F6B4F] dark:text-emerald-400 bg-[#E8F5ED] dark:bg-[#0F6B4F]/20 px-2.5 py-1 rounded-lg text-xs">
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
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.building}</span>
          <span className="text-xs text-slate-500 block">Tầng {row.floor}</span>
        </div>
      ),
    },
    {
      header: 'Chủ hộ / Cư dân',
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {row.owner ? row.owner.fullName : <span className="text-slate-400 italic font-normal">Chưa có chủ hộ</span>}
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
      cell: (row) => (
        <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
          {row.area} m²
        </span>
      ),
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900">
              <Receipt className="h-3 w-3 text-rose-600" />
              {formatCurrency(row.totalDebt)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Đã thu đủ
            </span>
          )}

          {row.openTicketsCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900">
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
          <Link
            href={`/apartments/${row.id}`}
            className="p-1.5 text-slate-500 hover:text-[#0F6B4F] hover:bg-[#E8F5ED] rounded-lg inline-flex items-center transition-colors"
            title="Trang quản lý chi tiết (360°)"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setInspectingItem(row);
              setActiveDrawerTab('DETAILS');
            }}
            className="text-slate-500 hover:text-[#0F6B4F] hover:bg-[#E8F5ED]"
            title="Xem nhanh & Lịch sử"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleOpenEdit(row)}
                className="text-slate-500 hover:text-[#0F6B4F] hover:bg-[#E8F5ED]"
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeletingId(row.id)}
                className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                title="Xóa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-[#0F6B4F] transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-400">Bất động sản & Cư dân</span>
        <span>/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          Quản lý Bất động sản
        </span>
      </div>

      {/* 2. Top Header with Smart View Switcher */}
      <PageHeader
        title="Quản lý Bất động sản"
        description="Quản lý tập trung cấu trúc tòa nhà, khối tháp, tầng và căn hộ trên toàn hệ thống."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Switcher: [Cấu trúc cây] & [Sơ đồ mặt bằng] & [Danh sách căn hộ] */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('TREE')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'TREE'
                  ? 'bg-white dark:bg-slate-700 text-[#0F6B4F] dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <FolderTree className="h-3.5 w-3.5" />
              Cấu trúc cây
            </button>
            <button
              type="button"
              onClick={() => setViewMode('FLOOR_PLAN')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'FLOOR_PLAN'
                  ? 'bg-white dark:bg-slate-700 text-[#0F6B4F] dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Sơ đồ mặt bằng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'LIST'
                  ? 'bg-white dark:bg-slate-700 text-[#0F6B4F] dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <List className="h-3.5 w-3.5" />
              Danh sách căn hộ
            </button>
          </div>

          {/* Sync Hierarchy Action */}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await bootstrapMutation.mutateAsync();
                  toast.success(res.message || 'Đồng bộ cấu trúc thành công');
                } catch (err: any) {
                  toast.error(err.message || 'Lỗi đồng bộ cấu trúc');
                }
              }}
              disabled={bootstrapMutation.isPending}
              className="text-xs gap-1.5 h-9 font-semibold"
              title="Tự động đồng bộ cấu trúc phân cấp từ dữ liệu hiện có"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', bootstrapMutation.isPending && 'animate-spin')}
              />
              Đồng bộ Cấu trúc
            </Button>
          )}

          {/* Create Apartment CTA */}
          {canManage && (
            <Button
              onClick={handleOpenCreate}
              className="bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white font-bold shadow-md shadow-[#0F6B4F]/20 text-xs gap-1.5 h-9"
            >
              <Plus className="h-4 w-4" /> Thêm Căn hộ
            </Button>
          )}
        </div>
      </PageHeader>

      {/* 3. Real Data KPI Overview Bar */}
      <PropertyKPIOverview data={kpiData} isLoading={isHierarchyLoading} />

      {/* 4. VIEW MODE 0: PROPERTY EXPLORER & DETAIL WORKSPACE */}
      {viewMode === 'TREE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Property Explorer Tree */}
          <div
            className={cn(
              'transition-all duration-300',
              isTreeCollapsed ? 'lg:col-span-1' : 'lg:col-span-4'
            )}
          >
            {isTreeCollapsed ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 text-center space-y-4 shadow-2xs">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsTreeCollapsed(false)}
                  title="Mở rộng panel sơ đồ"
                  className="mx-auto"
                >
                  <ChevronsRight className="h-4 w-4 text-[#0F6B4F]" />
                </Button>
                <div className="space-y-3 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider writing-mode-vertical">
                  <span>Sơ đồ phân cấp</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-end px-1">
                  <button
                    type="button"
                    onClick={() => setIsTreeCollapsed(true)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 font-medium transition-colors"
                    title="Thu gọn panel sơ đồ"
                  >
                    <ChevronsLeft className="h-3 w-3" /> Thu gọn
                  </button>
                </div>
                <PropertyTree
                  buildings={hierarchyList}
                  isLoading={isHierarchyLoading}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  onAddBuilding={() => {
                    setEditingBuilding(null);
                    setIsBuildingModalOpen(true);
                  }}
                  onAddBlock={(buildingId: string) => {
                    setTargetBuildingIdForBlock(buildingId);
                    setEditingBlock(null);
                    setIsBlockModalOpen(true);
                  }}
                  onAddFloor={(blockId: string) => {
                    setTargetBlockIdForFloor(blockId);
                    setSuggestedFloorNum(1);
                    setEditingFloor(null);
                    setIsFloorModalOpen(true);
                  }}
                  onAddApartment={(floorId: string) => {
                    setDefaultFloorIdForApt(floorId);
                    setIsAptModalOpen(true);
                  }}
                  canManage={canManage}
                />
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Detail Workspace */}
          <div
            className={cn(
              'transition-all duration-300',
              isTreeCollapsed ? 'lg:col-span-11' : 'lg:col-span-8'
            )}
          >
            {/* When Building is Selected */}
            {selectedNode?.type === 'BUILDING' && currentSelectedData && (
              <BuildingDetailCard
                building={currentSelectedData}
                onEdit={() => {
                  setEditingBuilding(currentSelectedData);
                  setIsBuildingModalOpen(true);
                }}
                onDelete={async () => {
                  if (confirm(`Bạn có chắc chắn muốn xóa tòa "${currentSelectedData.name}"?`)) {
                    try {
                      await deleteBuildingMutation.mutateAsync(currentSelectedData.id);
                      toast.success('Đã xóa tòa nhà thành công');
                      setSelectedNode(null);
                    } catch (e: any) {
                      toast.error(e.message || 'Lỗi khi xóa tòa nhà');
                    }
                  }
                }}
                onAddBlock={() => {
                  setTargetBuildingIdForBlock(currentSelectedData.id);
                  setEditingBlock(null);
                  setIsBlockModalOpen(true);
                }}
                onSelectBlock={(block) => {
                  setSelectedNode({
                    type: 'BLOCK',
                    id: block.id,
                    data: block,
                    parentPath: {
                      buildingName: currentSelectedData.name,
                      buildingId: currentSelectedData.id,
                      blockName: block.name,
                      blockId: block.id,
                    },
                  });
                }}
                canManage={canManage}
              />
            )}

            {/* When Block is Selected */}
            {selectedNode?.type === 'BLOCK' && currentSelectedData && (
              <BlockDetailCard
                block={currentSelectedData}
                buildingName={selectedNode.parentPath?.buildingName}
                onEdit={() => {
                  setEditingBlock(currentSelectedData);
                  setTargetBuildingIdForBlock(currentSelectedData.buildingId);
                  setIsBlockModalOpen(true);
                }}
                onDelete={async () => {
                  if (confirm(`Bạn có chắc chắn muốn xóa Block "${currentSelectedData.name}"?`)) {
                    try {
                      await deleteBlockMutation.mutateAsync(currentSelectedData.id);
                      toast.success('Đã xóa Block thành công');
                      setSelectedNode(null);
                    } catch (e: any) {
                      toast.error(e.message || 'Lỗi khi xóa Block');
                    }
                  }
                }}
                onAddFloor={() => {
                  setTargetBlockIdForFloor(currentSelectedData.id);
                  const highestFloor = (currentSelectedData.floors || []).reduce(
                    (max: number, f: any) => Math.max(max, f.floorNumber),
                    0
                  );
                  setSuggestedFloorNum(highestFloor + 1);
                  setEditingFloor(null);
                  setIsFloorModalOpen(true);
                }}
                onSelectFloor={(floor) => {
                  setSelectedNode({
                    type: 'FLOOR',
                    id: floor.id,
                    data: floor,
                    parentPath: {
                      buildingName: selectedNode.parentPath?.buildingName,
                      buildingId: selectedNode.parentPath?.buildingId,
                      blockName: currentSelectedData.name,
                      blockId: currentSelectedData.id,
                      floorName: floor.name || `Tầng ${floor.floorNumber}`,
                      floorId: floor.id,
                    },
                  });
                }}
                onNavigateBuilding={() => {
                  const bId = selectedNode.parentPath?.buildingId;
                  const b = hierarchyList.find((x: any) => x.id === bId);
                  if (b) {
                    setSelectedNode({
                      type: 'BUILDING',
                      id: b.id,
                      data: b,
                      parentPath: { buildingName: b.name, buildingId: b.id },
                    });
                  }
                }}
                canManage={canManage}
              />
            )}

            {/* When Floor is Selected */}
            {selectedNode?.type === 'FLOOR' && currentSelectedData && (
              <FloorDetailCard
                floor={currentSelectedData}
                blockName={selectedNode.parentPath?.blockName}
                buildingName={selectedNode.parentPath?.buildingName}
                onEdit={() => {
                  setEditingFloor(currentSelectedData);
                  setTargetBlockIdForFloor(currentSelectedData.blockId);
                  setIsFloorModalOpen(true);
                }}
                onDelete={async () => {
                  if (confirm(`Bạn có chắc chắn muốn xóa Tầng ${currentSelectedData.floorNumber}?`)) {
                    try {
                      await deleteFloorMutation.mutateAsync(currentSelectedData.id);
                      toast.success('Đã xóa tầng thành công');
                      setSelectedNode(null);
                    } catch (e: any) {
                      toast.error(e.message || 'Lỗi khi xóa tầng');
                    }
                  }
                }}
                onAddApartment={() => {
                  setDefaultFloorIdForApt(currentSelectedData.id);
                  setIsAptModalOpen(true);
                }}
                onSelectApartment={(apt) => {
                  setSelectedNode({
                    type: 'APARTMENT',
                    id: apt.id,
                    data: apt,
                    parentPath: {
                      buildingName: selectedNode.parentPath?.buildingName,
                      buildingId: selectedNode.parentPath?.buildingId,
                      blockName: selectedNode.parentPath?.blockName,
                      blockId: selectedNode.parentPath?.blockId,
                      floorName: currentSelectedData.name,
                      floorId: currentSelectedData.id,
                    },
                  });
                }}
                onNavigateBuilding={() => {
                  const bId = selectedNode.parentPath?.buildingId;
                  const b = hierarchyList.find((x: any) => x.id === bId);
                  if (b) {
                    setSelectedNode({
                      type: 'BUILDING',
                      id: b.id,
                      data: b,
                      parentPath: { buildingName: b.name, buildingId: b.id },
                    });
                  }
                }}
                onNavigateBlock={() => {
                  const blkId = selectedNode.parentPath?.blockId;
                  for (const b of hierarchyList) {
                    const blk = (b.blocks || []).find((x: any) => x.id === blkId);
                    if (blk) {
                      setSelectedNode({
                        type: 'BLOCK',
                        id: blk.id,
                        data: blk,
                        parentPath: {
                          buildingName: b.name,
                          buildingId: b.id,
                          blockName: blk.name,
                          blockId: blk.id,
                        },
                      });
                      break;
                    }
                  }
                }}
                canManage={canManage}
              />
            )}

            {/* When Apartment is Selected */}
            {selectedNode?.type === 'APARTMENT' && currentSelectedData && (
              <ApartmentDetailCard
                apartment={currentSelectedData}
                buildingName={selectedNode.parentPath?.buildingName}
                blockName={selectedNode.parentPath?.blockName}
                floorName={selectedNode.parentPath?.floorName}
                parentPath={selectedNode.parentPath}
                onEdit={() => handleOpenEdit(currentSelectedData)}
                onDelete={() => setDeletingId(currentSelectedData.id)}
                onAddHistory={() => {
                  setInspectingItem(currentSelectedData);
                  setIsAddHistoryOpen(true);
                }}
                onNavigateBuilding={() => {
                  const bId = selectedNode.parentPath?.buildingId;
                  const b = hierarchyList.find((x: any) => x.id === bId);
                  if (b) {
                    setSelectedNode({
                      type: 'BUILDING',
                      id: b.id,
                      data: b,
                      parentPath: { buildingName: b.name, buildingId: b.id },
                    });
                  }
                }}
                onNavigateBlock={() => {
                  const blkId = selectedNode.parentPath?.blockId;
                  for (const b of hierarchyList) {
                    const blk = (b.blocks || []).find((x: any) => x.id === blkId);
                    if (blk) {
                      setSelectedNode({
                        type: 'BLOCK',
                        id: blk.id,
                        data: blk,
                        parentPath: {
                          buildingName: b.name,
                          buildingId: b.id,
                          blockName: blk.name,
                          blockId: blk.id,
                        },
                      });
                      break;
                    }
                  }
                }}
                onNavigateFloor={() => {
                  const flrId = selectedNode.parentPath?.floorId;
                  for (const b of hierarchyList) {
                    for (const blk of b.blocks || []) {
                      const flr = (blk.floors || []).find((f: any) => f.id === flrId);
                      if (flr) {
                        setSelectedNode({
                          type: 'FLOOR',
                          id: flr.id,
                          data: flr,
                          parentPath: {
                            buildingName: b.name,
                            buildingId: b.id,
                            blockName: blk.name,
                            blockId: blk.id,
                            floorName: flr.name,
                            floorId: flr.id,
                          },
                        });
                        break;
                      }
                    }
                  }
                }}
                canManage={canManage}
              />
            )}

            {/* When Nothing Selected */}
            {!selectedNode && (
              <Card className="p-12 text-center rounded-2xl border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
                <FolderTree className="h-12 w-12 mx-auto text-[#0F6B4F]/40 mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Chọn một thực thể trong cây phân cấp
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Chọn Tòa nhà, Block, Tầng hoặc Căn hộ ở cây bên trái để xem đầy đủ hồ sơ vận hành 360° và thực hiện thao tác quản lý.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 5. VIEW MODE 1: INTERACTIVE FLOOR PLAN VIEW */}
      {viewMode === 'FLOOR_PLAN' && (
        <InteractiveFloorPlan
          apartments={apartments}
          hierarchy={hierarchyList}
          isLoading={isListLoading}
          onInspectApartment={(apt) => {
            setInspectingItem(apt);
            setActiveDrawerTab('DETAILS');
          }}
          onSelectApartment={(apt) => {
            setSelectedNode({
              type: 'APARTMENT',
              id: apt.id,
              data: apt,
            });
          }}
        />
      )}

      {/* 6. VIEW MODE 2: ENTERPRISE DATA TABLE LIST VIEW */}
      {viewMode === 'LIST' && (
        <div className="space-y-4">
          <FilterBar
            activeTags={activeTags}
            hasActiveFilters={hasActiveFilters}
            onReset={handleResetFilters}
            totalCount={apartments.length}
            totalCountLabel="Căn hộ hiển thị"
          >
            {/* Search */}
            <div className="relative w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Tìm mã căn, chủ hộ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8.5 h-9 text-xs bg-white dark:bg-slate-900 rounded-xl"
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
                className="rounded-xl"
              >
                <option value="">Tất cả Block / Tòa</option>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
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
                className="rounded-xl"
              >
                <option value="">Tất cả các tầng</option>
                {allFloorNumbers.map((fl) => (
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
                className="rounded-xl"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="OCCUPIED">Đang ở</option>
                <option value="VACANT">Đang trống</option>
                <option value="UNDER_MAINTENANCE">Đang sửa chữa</option>
              </Select>
            </div>
          </FilterBar>

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
        </div>
      )}

      {/* 7. QUICK INSPECT DRAWER WITH TIMELINE */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#E8F5ED] text-[#0F6B4F]">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                      Căn hộ {inspectingItem.code}
                    </h3>
                    <StatusBadge type="apartment" status={inspectingItem.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {inspectingItem.building} • Tầng {inspectingItem.floor}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/apartments/${inspectingItem.id}`)}
                  className="text-xs gap-1.5 h-8 font-semibold"
                  title="Mở toàn màn hình trang chi tiết 360°"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#0F6B4F]" />
                  Chi tiết 360°
                </Button>
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

            {/* Tab Navigation: Details vs History */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveDrawerTab('DETAILS')}
                className={cn(
                  'py-3 px-3 border-b-2 transition-all cursor-pointer',
                  activeDrawerTab === 'DETAILS'
                    ? 'border-[#0F6B4F] text-[#0F6B4F] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Thông tin Căn hộ
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawerTab('HISTORY')}
                className={cn(
                  'py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer',
                  activeDrawerTab === 'HISTORY'
                    ? 'border-[#0F6B4F] text-[#0F6B4F] font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <History className="h-3.5 w-3.5" />
                Lịch sử Biến động ({historyList.length})
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeDrawerTab === 'DETAILS' && (
                <div className="space-y-6">
                  {/* Specifications */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60">
                      <span className="text-slate-500 block mb-0.5">Diện tích sàn</span>
                      <span className="font-black text-base text-slate-900 dark:text-slate-100 font-mono">
                        {inspectingItem.area} m²
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60">
                      <span className="text-slate-500 block mb-0.5">Cấu trúc phòng</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {inspectingItem.bedrooms} PN &bull; {inspectingItem.bathrooms} PT
                      </span>
                    </div>
                  </div>

                  {/* Financial & Maintenance */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 space-y-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">
                      Tình trạng dịch vụ & tài chính
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Công nợ hiện tại:</span>
                      <span
                        className={cn(
                          'font-bold',
                          inspectingItem.totalDebt > 0 ? 'text-rose-600 font-mono' : 'text-emerald-600'
                        )}
                      >
                        {inspectingItem.totalDebt > 0
                          ? formatCurrency(inspectingItem.totalDebt)
                          : 'Đã hoàn tất thanh toán'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sự cố kỹ thuật:</span>
                      <span
                        className={cn(
                          'font-bold',
                          inspectingItem.openTicketsCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                        )}
                      >
                        {inspectingItem.openTicketsCount > 0
                          ? `${inspectingItem.openTicketsCount} phản ánh đang xử lý`
                          : 'Hoạt động bình thường'}
                      </span>
                    </div>
                  </div>

                  {/* Residents breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#0F6B4F]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                          Hộ gia đình
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
                          <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 italic">
                            Chưa có thông tin nhân khẩu đăng ký
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {owner && (
                            <div className="p-3 rounded-xl border-2 border-[#0F6B4F]/20 bg-[#E8F5ED]/40 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#0F6B4F] flex items-center gap-1.5">
                                  <span>👤</span> Chủ sở hữu (Chủ hộ)
                                </span>
                                <Badge className="bg-[#0F6B4F] text-white text-[10px]">CHỦ HỘ</Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {owner.fullName}
                                </span>
                                <span className="text-[11px] text-emerald-600 font-medium">
                                  {owner.status === 'RESIDING' ? 'Đang cư trú' : 'Tạm vắng'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {owner.phone || 'Chưa có SĐT'}
                              </div>
                            </div>
                          )}

                          {family.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                👩‍👦 Thành viên gia đình ({family.length})
                              </span>
                              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                {family.map((m: any) => (
                                  <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="font-semibold text-slate-900">{m.fullName}</span>
                                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {m.phone || '—'}
                                      </div>
                                    </div>
                                    <span className="text-[11px] text-emerald-600 font-medium">
                                      {m.status === 'RESIDING' ? 'Đang cư trú' : 'Tạm vắng'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {tenants.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                🏠 Khách thuê ({tenants.length})
                              </span>
                              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                {tenants.map((t: any) => (
                                  <div key={t.id} className="p-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="font-semibold text-slate-900">🏠 {t.fullName}</span>
                                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {t.phone || '—'}
                                      </div>
                                    </div>
                                    <span className="text-[11px] text-purple-600 font-medium">
                                      {t.status === 'RESIDING' ? 'Đang thuê' : 'Hết hạn'}
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
                    <div className="p-3.5 rounded-xl bg-[#E8F5ED]/40 border border-[#0F6B4F]/20 text-xs">
                      <span className="font-bold text-[#0F6B4F] block mb-1">Ghi chú:</span>
                      <p className="text-slate-700">{inspectingItem.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* History Timeline Tab */}
              {activeDrawerTab === 'HISTORY' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Dòng thời gian biến động căn hộ
                    </span>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddHistoryOpen(true)}
                        className="text-xs h-7 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Ghi nhận sự kiện
                      </Button>
                    )}
                  </div>

                  {isHistoryLoading ? (
                    <div className="space-y-4 animate-pulse">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 bg-slate-100 rounded-xl" />
                      ))}
                    </div>
                  ) : historyList.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <History className="h-8 w-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">Chưa có bản ghi lịch sử nào</p>
                      <p className="text-[11px]">Các sự kiện chuyển nhượng, đổi trạng thái sẽ được lưu tại đây.</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {historyList.map((item: any) => {
                        const isOwnerTransfer = item.event === 'OWNER_TRANSFER';
                        const isMoveIn = item.event === 'RESIDENT_MOVE_IN' || item.event === 'TENANT_MOVE_IN';
                        const isMoveOut = item.event === 'RESIDENT_MOVE_OUT' || item.event === 'TENANT_MOVE_OUT';

                        const dotBg = isOwnerTransfer
                          ? 'bg-[#0F6B4F]'
                          : isMoveIn
                          ? 'bg-emerald-600'
                          : isMoveOut
                          ? 'bg-rose-600'
                          : 'bg-amber-500';

                        const eventBadgeLabel =
                          item.event === 'OWNER_TRANSFER'
                            ? 'Chuyển nhượng'
                            : item.event === 'RESIDENT_MOVE_IN'
                            ? 'Cư dân dọn vào'
                            : item.event === 'TENANT_MOVE_IN'
                            ? 'Khách thuê dọn vào'
                            : item.event === 'RESIDENT_MOVE_OUT'
                            ? 'Cư dân dọn đi'
                            : item.event === 'TENANT_MOVE_OUT'
                            ? 'Khách thuê dọn đi'
                            : 'Đổi trạng thái';

                        return (
                          <div key={item.id} className="relative group">
                            <div
                              className={cn(
                                'absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs',
                                dotBg
                              )}
                            />

                            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <Badge variant="secondary" className="text-[10px] font-semibold">
                                  {eventBadgeLabel}
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatDateTime(item.createdAt)}
                                </span>
                              </div>

                              <h5 className="text-xs font-bold text-slate-900 mt-1">{item.title}</h5>

                              {item.description && (
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                  {item.description}
                                </p>
                              )}

                              {item.performedBy && (
                                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                  Người thực hiện: <span className="font-semibold text-slate-600">{item.performedBy}</span>
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
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setInspectingItem(null)} className="text-xs">
                Đóng
              </Button>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(inspectingItem)}
                  className="text-xs gap-1.5 font-semibold"
                >
                  <Edit className="h-3.5 w-3.5" /> Chỉnh sửa
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: CREATE / EDIT APARTMENT */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingItem ? `Chỉnh sửa Căn hộ: ${editingItem.code}` : 'Thêm Căn hộ mới'}
        description="Điền thông tin mã căn, cơ cấu tầng, số phòng và diện tích thực tế."
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Mã căn hộ <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: A-1001, B-2001..."
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="rounded-xl font-mono uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Khối / Tòa nhà <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="rounded-xl"
            >
              <option value="Tòa A">Tòa A</option>
              <option value="Tòa B">Tòa B</option>
              <option value="Tòa C">Tòa C</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Tầng số <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
              required
              className="rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Diện tích (m²) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.1"
              min={10}
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
              required
              className="rounded-xl font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Trạng thái</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ApartmentStatus })}
              className="rounded-xl"
            >
              <option value="VACANT">Đang trống</option>
              <option value="OCCUPIED">Đang ở</option>
              <option value="UNDER_MAINTENANCE">Đang sửa chữa</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Số phòng ngủ</label>
            <Input
              type="number"
              min={1}
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
              className="rounded-xl font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Số phòng tắm</label>
            <Input
              type="number"
              min={1}
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
              className="rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Ghi chú thêm</label>
          <Input
            placeholder="Nội thất bàn giao, ban công..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </FormDialog>

      {/* 9. MODAL: ADD HISTORY EVENT */}
      <FormDialog
        open={isAddHistoryOpen}
        onOpenChange={setIsAddHistoryOpen}
        title={`Ghi nhận sự kiện cho Căn hộ ${inspectingItem?.code || selectedNode?.data?.code || ''}`}
        description="Ghi nhận dòng thời gian bàn giao, chuyển quyền sở hữu hoặc dọn vào/ra của cư dân."
        onSubmit={handleAddHistorySubmit}
        isLoading={createHistoryMutation.isPending}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Loại sự kiện <span className="text-rose-500">*</span>
          </label>
          <Select
            value={historyForm.event}
            onChange={(e) => setHistoryForm({ ...historyForm, event: e.target.value as ApartmentHistoryEvent })}
            className="rounded-xl"
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
          <label className="text-xs font-semibold text-slate-700">
            Tiêu đề sự kiện <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="VD: Bàn giao quyền sở hữu cho anh Nguyễn Văn A"
            value={historyForm.title}
            onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Mô tả chi tiết</label>
          <Input
            placeholder="Nội dung biên bản, số hợp đồng hoặc tình trạng bàn giao..."
            value={historyForm.description}
            onChange={(e) => setHistoryForm({ ...historyForm, description: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </FormDialog>

      {/* 10. DELETE CONFIRMATION */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa căn hộ?"
        description="Thao tác này sẽ xóa vĩnh viễn thông tin căn hộ khỏi hệ thống. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />

      {/* 11. HIERARCHY CRUD MODALS */}
      <BuildingFormModal
        open={isBuildingModalOpen}
        onOpenChange={setIsBuildingModalOpen}
        initialData={editingBuilding}
        onSubmit={async (data) => {
          if (editingBuilding) {
            await updateBuildingMutation.mutateAsync({ id: editingBuilding.id, ...data });
            toast.success('Đã cập nhật thông tin tòa nhà');
          } else {
            await createBuildingMutation.mutateAsync(data);
            toast.success('Đã thêm tòa nhà mới');
          }
        }}
      />

      <BlockFormModal
        open={isBlockModalOpen}
        onOpenChange={setIsBlockModalOpen}
        buildingId={targetBuildingIdForBlock}
        initialData={editingBlock}
        onSubmit={async (data) => {
          if (editingBlock) {
            await updateBlockMutation.mutateAsync({ id: editingBlock.id, ...data });
            toast.success('Đã cập nhật thông tin Block');
          } else {
            await createBlockMutation.mutateAsync(data);
            toast.success('Đã thêm Block mới');
          }
        }}
      />

      <FloorFormModal
        open={isFloorModalOpen}
        onOpenChange={setIsFloorModalOpen}
        blockId={targetBlockIdForFloor}
        suggestedFloorNumber={suggestedFloorNum}
        initialData={editingFloor}
        onSubmit={async (data) => {
          if (editingFloor) {
            await updateFloorMutation.mutateAsync({ id: editingFloor.id, ...data });
            toast.success('Đã cập nhật thông tin Tầng');
          } else {
            await createFloorMutation.mutateAsync(data);
            toast.success('Đã thêm Tầng mới');
          }
        }}
      />

      <ApartmentFormModal
        open={isAptModalOpen}
        onOpenChange={setIsAptModalOpen}
        hierarchy={hierarchyList}
        defaultFloorId={defaultFloorIdForApt}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
          toast.success('Đã thêm căn hộ thành công');
        }}
      />
    </div>
  );
}
