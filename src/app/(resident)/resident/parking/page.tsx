'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Car,
  Bike,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Compass,
  QrCode,
  FileClock,
  RotateCcw,
  Loader2,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ParkingLotMap } from '@/components/parking/ParkingLotMap';
import { ParkingSlotDrawer } from '@/components/parking/ParkingSlotDrawer';
import { ParkingRequestModal } from '@/components/parking/ParkingRequestModal';
import { ParkingPassCard } from '@/components/parking/ParkingPassCard';
import {
  useParkingAreas,
  useParkingArea,
  useParkingOccupancy,
  useParkingRequests,
  useMyParkingAssignments,
} from '@/hooks/use-parking';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function ResidentParkingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'MAP' | 'PASSES' | 'REQUESTS'>('MAP');

  // Queries
  const {
    data: areasRes,
    isLoading: isLoadingAreas,
    isError: isAreasError,
    refetch: refetchAreas,
  } = useParkingAreas();
  const areas = areasRes?.data || [];

  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const activeAreaId = selectedAreaId || (areas.length > 0 ? areas[0].id : '');

  const {
    data: areaDetailRes,
    isLoading: isLoadingAreaDetail,
    isError: isAreaDetailError,
    refetch: refetchAreaDetail,
  } = useParkingArea(activeAreaId);
  const activeArea = areaDetailRes?.data;

  const { data: occupancyRes, isLoading: isLoadingOccupancy } = useParkingOccupancy();
  const occupancy = occupancyRes?.data;

  const { data: requestsRes, refetch: refetchRequests } = useParkingRequests();
  const requests = requestsRes?.data || [];

  const { data: passesRes, refetch: refetchPasses } = useMyParkingAssignments();
  const myPasses = passesRes?.data || [];

  // Slot inspection & request modal states
  const [inspectingSlot, setInspectingSlot] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [requestModalSlot, setRequestModalSlot] = useState<any | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null);

  // Flatten slots from zones
  const currentSlots = useMemo(() => {
    if (!activeArea?.zones) return [];
    return activeArea.zones.flatMap((z: any) => z.slots || []);
  }, [activeArea]);

  const handleSelectSlot = (slot: any) => {
    setInspectingSlot(slot);
    setIsDrawerOpen(true);
  };

  const handleOpenRegister = (slot: any) => {
    setRequestModalSlot(slot);
    setIsRequestModalOpen(true);
  };

  const handleFocusOnMap = (slotId: string, areaId: string) => {
    setSelectedAreaId(areaId);
    setActiveTab('MAP');
    setHighlightedSlotId(slotId);

    setTimeout(() => {
      setHighlightedSlotId(null);
    }, 6000);
  };

  const isFullOccupied = occupancy?.summary ? occupancy.summary.available === 0 && occupancy.summary.total > 0 : false;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Bãi Đỗ Xe Thông Minh K-Home"
        description="Theo dõi chỗ trống thời gian thực, xem sơ đồ vị trí và quản lý thẻ đỗ xe cư dân"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/resident/vehicles"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 h-8 text-xs font-medium hover:bg-[#E8F5ED] dark:hover:bg-emerald-950/30 hover:text-[#0F6B4F] dark:hover:text-emerald-400 shadow-2xs transition-all"
          >
            <Car className="w-3.5 h-3.5 mr-1.5" />
            <span>Phương tiện của tôi</span>
          </Link>
        </div>
      </PageHeader>

      {/* Section 13: Resident Car Parking UI Overview Widget */}
      <div className="bg-gradient-to-r from-[#0F6B4F] to-[#12805e] rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>K-Home Smart Parking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            🟢 {occupancy?.summary?.available ?? 0} chỗ đỗ khả dụng
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            Hệ thống nhận diện vị trí đỗ thời gian thực qua camera ANPR và cảm biến thông minh. Cư dân có thể dễ dàng kiểm tra chỗ trống và đăng ký thẻ đỗ trực tiếp.
          </p>

          {/* Breakdown per floor/area */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {areas.map((area: any) => (
              <div
                key={area.id}
                onClick={() => {
                  setSelectedAreaId(area.id);
                  setActiveTab('MAP');
                }}
                className={`cursor-pointer px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  activeAreaId === area.id
                    ? 'bg-white text-[#0F6B4F] font-bold shadow-md border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <span className="font-bold mr-1.5">{area.code}:</span>
                <span>{area.metrics?.available ?? 0} chỗ trống</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 13 Quick Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <Button
            onClick={() => setActiveTab('MAP')}
            className="bg-white hover:bg-emerald-50 text-[#0F6B4F] font-bold text-xs h-10 shadow-sm"
          >
            <Compass className="w-4 h-4 mr-2 text-[#0F6B4F]" />
            <span>Xem sơ đồ bãi đỗ</span>
          </Button>

          <Button
            onClick={() => {
              setRequestModalSlot(null);
              setIsRequestModalOpen(true);
            }}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-10 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Đăng ký chỗ đỗ</span>
          </Button>

          <Button
            onClick={() => setActiveTab('PASSES')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-10 font-semibold"
          >
            <QrCode className="w-4 h-4 mr-2" />
            <span>Thẻ xe của tôi ({myPasses.length})</span>
          </Button>
        </div>
      </div>

      {/* Section 17: Empty State (Bãi đỗ đã đầy) */}
      {isFullOccupied && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">
                Bãi đỗ xe ô tô hiện đã hết chỗ trống (Full Occupancy)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hiện tại tất cả vị trí đỗ ô tô đã được cấp phát hết. Bạn có thể gửi yêu cầu để tham gia danh sách chờ ưu tiên khi có vị trí mới giải phóng.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0"
            onClick={() => {
              setRequestModalSlot(null);
              setIsRequestModalOpen(true);
            }}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            <span>Tham gia danh sách chờ (Waitlist)</span>
          </Button>
        </div>
      )}

      {/* Error state fallback */}
      {(isAreasError || isAreaDetailError) && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">Không thể tải dữ liệu bãi đỗ xe</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Hệ thống máy chủ chưa phản hồi kịp hoặc kết nối mạng bị gián đoạn. Vui lòng thử tải lại dữ liệu.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchAreas();
              refetchAreaDetail();
            }}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('MAP')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'MAP'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Sơ Đồ Bãi Xe Trực Quan</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSES')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PASSES'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Thẻ Đỗ Xe Của Tôi ({myPasses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'REQUESTS'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <FileClock className="w-4 h-4" />
          <span>Yêu Cầu Đăng Ký ({requests.length})</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE PARKING MAP */}
      {activeTab === 'MAP' && (
        <div className="space-y-4">
          {/* Parking Area Selector Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-card border border-border p-2 rounded-xl">
            <span className="text-xs font-semibold text-muted-foreground px-2">
              Khu vực bãi đỗ:
            </span>
            {areas.map((area: any) => (
              <Button
                key={area.id}
                variant={activeAreaId === area.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedAreaId(area.id)}
                className={`text-xs font-semibold cursor-pointer ${
                  activeAreaId === area.id
                    ? 'bg-[#0F6B4F] hover:bg-[#0c5942] text-white shadow-xs'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{area.name}</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {area.metrics?.available ?? 0} trống
                </span>
              </Button>
            ))}
          </div>

          {/* Loading Skeletons */}
          {isLoadingAreaDetail ? (
            <div className="h-[520px] rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center gap-3 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-[#0F6B4F]" />
              <span className="text-xs font-medium text-muted-foreground">
                Đang tải sơ đồ bãi đỗ {activeArea?.name || ''}...
              </span>
            </div>
          ) : (
            <ParkingLotMap
              areaName={activeArea?.name || 'Khu vực bãi đỗ'}
              areaCode={activeArea?.code || 'B1'}
              floor={activeArea?.floor ?? -1}
              slots={currentSlots}
              zones={activeArea?.zones || []}
              selectedSlotId={inspectingSlot?.id}
              highlightedSlotId={highlightedSlotId}
              onSelectSlot={handleSelectSlot}
              isManager={false}
            />
          )}
        </div>
      )}

      {/* TAB 2: MY PARKING PASSES (QR CODES) */}
      {activeTab === 'PASSES' && (
        <div className="space-y-4">
          {myPasses.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border p-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Car className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Bạn chưa có chỗ đỗ xe được cấp
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Hãy chuyển sang tab "Sơ đồ bãi xe", tìm kiếm vị trí còn trống phù hợp và gửi đơn đăng ký để được cấp phát thẻ đỗ xe.
              </p>
              <Button
                className="mt-6 bg-[#0F6B4F] hover:bg-[#0c5942] text-white font-semibold text-xs cursor-pointer"
                onClick={() => setActiveTab('MAP')}
              >
                <Compass className="w-4 h-4 mr-1.5" />
                <span>Mở sơ đồ xem chỗ trống</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myPasses.map((pass: any) => (
                <ParkingPassCard
                  key={pass.id}
                  assignment={pass}
                  onViewOnMap={handleFocusOnMap}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTRATION REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              Lịch sử đơn đăng ký chỗ đỗ
            </h3>
            <Button
              size="sm"
              className="bg-[#0F6B4F] hover:bg-[#0c5942] text-white text-xs font-semibold cursor-pointer"
              onClick={() => setActiveTab('MAP')}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Đăng ký thêm chỗ mới</span>
            </Button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border p-6 text-xs text-muted-foreground">
              Chưa có đơn đăng ký chỗ đỗ nào được gửi.
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
              <div className="divide-y divide-border">
                {requests.map((req: any) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                            ? 'Bị từ chối'
                            : 'Đang chờ duyệt'}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                        <span>Xe: <strong>{req.vehicle?.licensePlate}</strong> ({req.vehicle?.brand} {req.vehicle?.model})</span>
                        {req.slot && (
                          <span>Vị trí đăng ký: <strong className="text-primary">{req.slot.code}</strong></span>
                        )}
                        <span>Ngày gửi: {formatDate(req.createdAt)}</span>
                      </div>

                      {req.rejectionReason && (
                        <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded-md mt-2">
                          Lý do từ chối: {req.rejectionReason}
                        </div>
                      )}
                    </div>

                    {req.status === 'APPROVED' && req.assignment && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-[#0F6B4F]/40 text-[#0F6B4F]"
                        onClick={() => setActiveTab('PASSES')}
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" />
                        <span>Xem thẻ QR</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Side Drawer for Slot details */}
      <ParkingSlotDrawer
        slot={inspectingSlot}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRegisterRequest={handleOpenRegister}
        isManager={false}
      />

      {/* Register Request Modal */}
      <ParkingRequestModal
        slot={requestModalSlot}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => {
          refetchRequests();
          setActiveTab('REQUESTS');
        }}
      />
    </div>
  );
}
