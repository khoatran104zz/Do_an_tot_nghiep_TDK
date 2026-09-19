'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Car,
  Compass,
  FileClock,
  BarChart3,
  ListFilter,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Plus,
  Layers,
  Wrench,
  Lock,
  Search,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ParkingLotMap } from '@/components/parking/ParkingLotMap';
import { ParkingSlotDrawer } from '@/components/parking/ParkingSlotDrawer';
import { ParkingAnalyticsChart } from '@/components/parking/ParkingAnalyticsChart';
import {
  useParkingAreas,
  useParkingArea,
  useParkingSlots,
  useParkingOccupancy,
  useParkingRequests,
  useReviewParkingRequest,
  useUpdateSlotStatus,
  useReleaseSlot,
} from '@/hooks/use-parking';
import { useBuildingContext } from '@/context/BuildingContext';
import { formatDate } from '@/lib/utils';
import { ParkingSlotStatus } from '@prisma/client';
import { toast } from 'sonner';

export default function ManagementParkingPage() {
  const { data: session } = useSession();
  const { selectedBuildingId } = useBuildingContext();
  const [activeTab, setActiveTab] = useState<'MAP' | 'REQUESTS' | 'LIST' | 'ANALYTICS'>('MAP');

  // Queries
  const { data: areasRes } = useParkingAreas({ buildingId: selectedBuildingId || undefined });
  const areas = areasRes?.data || [];

  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const activeAreaId = selectedAreaId || (areas.length > 0 ? areas[0].id : '');

  const { data: areaDetailRes } = useParkingArea(activeAreaId);
  const activeArea = areaDetailRes?.data;

  const { data: occupancyRes } = useParkingOccupancy(selectedBuildingId || undefined);
  const occupancy = occupancyRes?.data;

  const { data: requestsRes, refetch: refetchRequests } = useParkingRequests({
    buildingId: selectedBuildingId || undefined,
  });
  const requests = requestsRes?.data || [];

  // Slot Filter for List View
  const [slotSearch, setSlotSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: slotsRes } = useParkingSlots({
    buildingId: selectedBuildingId || undefined,
    areaId: activeAreaId || undefined,
    status: (statusFilter as any) || undefined,
    search: slotSearch || undefined,
  });
  const slotsList = slotsRes?.data || [];

  // Mutations
  const reviewMutation = useReviewParkingRequest();
  const updateStatusMutation = useUpdateSlotStatus();
  const releaseMutation = useReleaseSlot();

  // Drawer and Modal States
  const [inspectingSlot, setInspectingSlot] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Approval Modal States
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState<boolean>(false);
  const [isRejectOpen, setIsRejectOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [approvedSlotId, setApprovedSlotId] = useState<string>('');

  // Flatten slots for map
  const currentSlots = useMemo(() => {
    if (!activeArea?.zones) return [];
    return activeArea.zones.flatMap((z: any) => z.slots || []);
  }, [activeArea]);

  // Available slots for assignment picker
  const availableSlots = useMemo(() => {
    return currentSlots.filter((s: any) => s.status === 'AVAILABLE');
  }, [currentSlots]);

  const handleSelectSlot = (slot: any) => {
    setInspectingSlot(slot);
    setIsDrawerOpen(true);
  };

  const handleStatusChange = async (slotId: string, status: ParkingSlotStatus) => {
    await updateStatusMutation.mutateAsync({ id: slotId, status });
    setIsDrawerOpen(false);
  };

  const handleReleaseSlot = async (slotId: string) => {
    await releaseMutation.mutateAsync(slotId);
    setIsDrawerOpen(false);
  };

  const handleOpenApprove = (req: any) => {
    setSelectedRequestForReview(req);
    setApprovedSlotId(req.slotId || (availableSlots[0]?.id || ''));
    setIsApproveOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequestForReview) return;
    if (!approvedSlotId) {
      toast.error('Vui lòng chọn vị trí đỗ cần cấp phát');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: selectedRequestForReview.id,
        data: {
          action: 'APPROVE',
          slotId: approvedSlotId,
        },
      });
      setIsApproveOpen(false);
      setSelectedRequestForReview(null);
      refetchRequests();
    } catch (err) {
      // Handled in hook
    }
  };

  const handleOpenReject = (req: any) => {
    setSelectedRequestForReview(req);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequestForReview) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: selectedRequestForReview.id,
        data: {
          action: 'REJECT',
          rejectionReason: rejectReason.trim(),
        },
      });
      setIsRejectOpen(false);
      setSelectedRequestForReview(null);
      refetchRequests();
    } catch (err) {
      // Handled in hook
    }
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Quản Lý Vận Hành Bãi Đỗ Xe Thông Minh"
        description="Giám sát công suất bãi đỗ thời gian thực, điều phối ô đỗ xe và duyệt yêu cầu cư dân"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Tổng sức chứa
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-foreground font-mono">
              {occupancy?.summary?.total ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">chỗ</span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            🟢 Chỗ trống
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {occupancy?.summary?.available ?? 0}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300">khả dụng</span>
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
            🔴 Đang đỗ
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
              {occupancy?.summary?.occupied ?? 0}
            </span>
            <span className="text-xs text-rose-700 dark:text-rose-300">xe</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            🟡 Chờ duyệt
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
              {pendingRequests.length}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300">đơn chờ</span>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
            ⚡ Công suất
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-primary font-mono">
              {occupancy?.summary?.occupancyRate ?? 0}%
            </span>
            <span className="text-xs text-muted-foreground">lấp đầy</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('MAP')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'MAP'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Sơ Đồ Vận Hành</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'REQUESTS'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <FileClock className="w-4 h-4" />
          <span>Duyệt Đăng Ký ({pendingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LIST')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'LIST'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Danh Sách Chỗ Đỗ</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'ANALYTICS'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Báo Cáo & Phân Tích</span>
        </button>
      </div>

      {/* TAB 1: MANAGER PARKING MAP */}
      {activeTab === 'MAP' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-card border border-border p-2 rounded-xl">
            <span className="text-xs font-semibold text-muted-foreground px-2">
              Khu vực vận hành:
            </span>
            {areas.map((area: any) => (
              <Button
                key={area.id}
                variant={activeAreaId === area.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedAreaId(area.id)}
                className={`text-xs font-semibold ${
                  activeAreaId === area.id
                    ? 'bg-[#0F6B4F] hover:bg-[#0d5941] text-white shadow-sm'
                    : 'text-foreground'
                }`}
              >
                <span>{area.name}</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {area.metrics?.available ?? 0} trống / {area.metrics?.total ?? 0}
                </span>
              </Button>
            ))}
          </div>

          <ParkingLotMap
            areaName={activeArea?.name || 'Khu vực bãi đỗ'}
            areaCode={activeArea?.code || 'B1'}
            floor={activeArea?.floor ?? -1}
            slots={currentSlots}
            selectedSlotId={inspectingSlot?.id}
            onSelectSlot={handleSelectSlot}
            isManager={true}
          />
        </div>
      )}

      {/* TAB 2: REGISTRATION REQUESTS APPROVAL */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Danh sách yêu cầu xin cấp chỗ đỗ xe
              </h3>
              <p className="text-xs text-muted-foreground">
                Xem xét hồ sơ cư dân, phương tiện và phân bổ vị trí đỗ phù hợp
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border p-6 text-xs text-muted-foreground">
              Không có yêu cầu đăng ký chỗ đỗ nào.
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="divide-y divide-border">
                {requests.map((req: any) => (
                  <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {req.requestCode}
                        </span>
                        <Badge
                          variant={
                            req.status === 'APPROVED'
                              ? 'default'
                              : req.status === 'REJECTED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {req.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : req.status === 'REJECTED'
                            ? 'Đã từ chối'
                            : 'Chờ phê duyệt'}
                        </Badge>
                      </div>

                      <div className="text-xs text-foreground font-medium flex flex-wrap items-center gap-4 pt-0.5">
                        <span>Cư dân: <strong>{req.resident?.fullName}</strong> ({req.resident?.phone})</span>
                        <span>Căn hộ: <strong className="text-primary">{req.apartment?.code}</strong></span>
                        <span>Biển số xe: <strong className="font-mono">{req.vehicle?.licensePlate}</strong> ({req.vehicle?.brand} {req.vehicle?.model})</span>
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                        <span>Chỗ đề xuất: <strong>{req.slot?.code || 'Chưa chỉ định (BQL chọn)'}</strong></span>
                        <span>Ngày yêu cầu: {formatDate(req.createdAt)}</span>
                        {req.notes && <span className="italic">Ghi chú: "{req.notes}"</span>}
                      </div>

                      {req.rejectionReason && (
                        <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded-md mt-1">
                          Lý do từ chối: {req.rejectionReason}
                        </div>
                      )}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          onClick={() => handleOpenApprove(req)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Phê duyệt</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-rose-500/50 text-rose-600 hover:bg-rose-50"
                          onClick={() => handleOpenReject(req)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Từ chối</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATA LIST VIEW */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm mã chỗ (VD: B1-A01)..."
                value={slotSearch}
                onChange={(e) => setSlotSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-background border border-border rounded-md text-foreground"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="AVAILABLE">Trống (Available)</option>
                <option value="OCCUPIED">Đang đỗ (Occupied)</option>
                <option value="RESERVED">Đã đặt (Reserved)</option>
                <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
                <option value="BLOCKED">Tạm khóa (Blocked)</option>
              </select>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">Mã ô đỗ</th>
                  <th className="p-3">Khu vực / Tầng</th>
                  <th className="p-3">Phân khu</th>
                  <th className="p-3">Loại xe</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Xe đang sử dụng</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slotsList.map((slot: any) => (
                  <tr key={slot.id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono font-bold text-foreground">
                      {slot.code}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {slot.area?.name} (Tầng {slot.floor})
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-muted font-medium">
                        {slot.zone?.name}
                      </span>
                    </td>
                    <td className="p-3">
                      {slot.type === 'CAR' ? 'Ô tô' : slot.type === 'MOTORBIKE' ? 'Xe máy' : slot.type}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          slot.status === 'AVAILABLE'
                            ? 'default'
                            : slot.status === 'OCCUPIED'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {slot.status}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      {slot.assignments?.[0]?.vehicle?.licensePlate || '-'}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => handleSelectSlot(slot)}
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & REPORTS */}
      {activeTab === 'ANALYTICS' && (
        <ParkingAnalyticsChart
          areas={occupancy?.areas || []}
          byVehicleType={occupancy?.byVehicleType || {}}
        />
      )}

      {/* Slot Inspection Drawer */}
      <ParkingSlotDrawer
        slot={inspectingSlot}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusChange={handleStatusChange}
        onReleaseSlot={handleReleaseSlot}
        isManager={true}
      />

      {/* Modal Approve Request */}
      <FormDialog
        open={isApproveOpen}
        onOpenChange={(open) => !open && setIsApproveOpen(false)}
        title="Phê duyệt cấp phát chỗ đỗ"
        description={`Cấp phát chỗ đỗ cho xe ${selectedRequestForReview?.vehicle?.licensePlate} (Căn hộ ${selectedRequestForReview?.apartment?.code})`}
        submitText="Xác nhận cấp chỗ"
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirmApprove();
        }}
        isLoading={reviewMutation.isPending}
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Chọn vị trí đỗ cấp phát *</label>
            <select
              value={approvedSlotId}
              onChange={(e) => setApprovedSlotId(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableSlots.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.zone?.name} ({s.type === 'CAR' ? 'Ô tô' : 'Xe máy'})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Hệ thống sẽ tạo thẻ đỗ xe điện tử kèm mã QR an toàn cho cư dân và cập nhật trạng thái ô đỗ thành ĐÃ ĐỖ (OCCUPIED).
          </p>
        </div>
      </FormDialog>

      {/* Modal Reject Request */}
      <FormDialog
        open={isRejectOpen}
        onOpenChange={(open) => !open && setIsRejectOpen(false)}
        title="Từ chối yêu cầu đăng ký chỗ đỗ"
        description={`Gửi lý do từ chối cho xe ${selectedRequestForReview?.vehicle?.licensePlate}`}
        submitText="Xác nhận từ chối"
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirmReject();
        }}
        isLoading={reviewMutation.isPending}
      >
        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Lý do từ chối *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Khu vực hiện đã hết chỗ đỗ cho loại xe này, hồ sơ xe chưa đầy đủ..."
              rows={3}
              className="w-full p-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
