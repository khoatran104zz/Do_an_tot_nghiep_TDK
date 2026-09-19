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
  const { data: areasRes, isLoading: isLoadingAreas } = useParkingAreas();
  const areas = areasRes?.data || [];

  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const activeAreaId = selectedAreaId || (areas.length > 0 ? areas[0].id : '');

  const { data: areaDetailRes, isLoading: isLoadingAreaDetail } = useParkingArea(activeAreaId);
  const activeArea = areaDetailRes?.data;

  const { data: occupancyRes } = useParkingOccupancy();
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

    // Auto-scroll and clear highlight after 6 seconds
    setTimeout(() => {
      setHighlightedSlotId(null);
    }, 6000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Bãi Đỗ Xe Thông Minh K-Home"
        description="Theo dõi chỗ trống thời gian thực, xem sơ đồ vị trí và quản lý thẻ đỗ xe cư dân"
      >
        <Button
          variant="outline"
          size="sm"
          asChild
          className="text-xs"
        >
          <Link href="/resident/vehicles">
            <Car className="w-3.5 h-3.5 mr-1.5" />
            <span>Phương tiện của tôi</span>
          </Link>
        </Button>
      </PageHeader>

      {/* Real-time Occupancy KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Tổng số chỗ đỗ
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-foreground font-mono">
              {occupancy?.summary?.total ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">vị trí</span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            🟢 Chỗ trống khả dụng
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {occupancy?.summary?.available ?? 0}
            </span>
            <span className="text-xs text-emerald-800 dark:text-emerald-400">chỗ trống</span>
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
            🔴 Đã có xe đỗ
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
              {occupancy?.summary?.occupied ?? 0}
            </span>
            <span className="text-xs text-rose-800 dark:text-rose-400">vị trí</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            🟡 Tỷ lệ lấp đầy
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
              {occupancy?.summary?.occupancyRate ?? 0}%
            </span>
            <span className="text-xs text-amber-800 dark:text-amber-400">công suất</span>
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
          <span>Sơ Đồ Bãi Xe Trực Quan</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSES')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'PASSES'
              ? 'bg-[#0F6B4F] text-white font-semibold shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Thẻ Đỗ Xe Của Tôi ({myPasses.length})</span>
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
                className={`text-xs font-semibold ${
                  activeAreaId === area.id
                    ? 'bg-[#0F6B4F] hover:bg-[#0d5941] text-white shadow-sm'
                    : 'text-foreground'
                }`}
              >
                <span>{area.name}</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {area.metrics?.available ?? 0} trống
                </span>
              </Button>
            ))}
          </div>

          {/* Sơ đồ trực quan */}
          <ParkingLotMap
            areaName={activeArea?.name || 'Khu vực bãi đỗ'}
            areaCode={activeArea?.code || 'B1'}
            floor={activeArea?.floor ?? -1}
            slots={currentSlots}
            selectedSlotId={inspectingSlot?.id}
            highlightedSlotId={highlightedSlotId}
            onSelectSlot={handleSelectSlot}
            isManager={false}
          />
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
                className="mt-6 bg-[#0F6B4F] hover:bg-[#0d5941] text-white font-semibold text-xs"
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
              className="bg-[#0F6B4F] hover:bg-[#0d5941] text-white text-xs font-semibold"
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
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
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
