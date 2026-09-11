'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Car,
  Bike,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  Edit,
  ArrowRight,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { FormDialog } from '@/components/shared/FormDialog';
import { DetailDrawer, DetailItem } from '@/components/shared/DetailDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useVehicles, useCreateVehicle, useUpdateVehicle } from '@/hooks/use-vehicles';
import { VehicleType, VehicleStatus } from '@prisma/client';
import { toast } from 'sonner';

export default function ResidentVehiclesPage() {
  const { data: session } = useSession();
  const user = session?.user;

  // Filter tab state: 'ALL' | 'CAR' | 'MOTORBIKE' | 'PENDING'
  const [activeTab, setActiveTab] = useState<'ALL' | 'CAR' | 'MOTORBIKE' | 'PENDING'>('ALL');

  // Search input
  const [search, setSearch] = useState('');

  // Dialog & Detail states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [inspectingVehicle, setInspectingVehicle] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Register / Edit
  const [formData, setFormData] = useState({
    licensePlate: '',
    type: 'MOTORBIKE' as VehicleType,
    brand: '',
    model: '',
    color: '',
    registrationDocumentUrl: '',
  });

  // Query vehicles: backend automatically scopes to current resident's apartment
  const { data: response, isLoading, isError, error, refetch } = useVehicles({
    search: search || undefined,
  });

  const vehicles = response?.data || [];

  // Mutations
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();

  // Metrics
  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v: any) => v.status === 'ACTIVE').length;
    const pending = vehicles.filter((v: any) => v.status === 'PENDING_APPROVAL').length;
    const cars = vehicles.filter((v: any) => v.type === 'CAR').length;
    const motorbikes = vehicles.filter((v: any) => v.type === 'MOTORBIKE').length;
    const activeCards = vehicles.filter((v: any) =>
      v.parkingCards?.some((c: any) => c.status === 'ACTIVE')
    ).length;

    return { total, active, pending, cars, motorbikes, activeCards };
  }, [vehicles]);

  // Filtered vehicles based on activeTab
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v: any) => {
      if (activeTab === 'CAR') return v.type === 'CAR';
      if (activeTab === 'MOTORBIKE') return v.type === 'MOTORBIKE';
      if (activeTab === 'PENDING') return v.status === 'PENDING_APPROVAL';
      return true;
    });
  }, [vehicles, activeTab]);

  // Open Registration Modal
  const handleOpenRegister = () => {
    setFormData({
      licensePlate: '',
      type: 'MOTORBIKE',
      brand: '',
      model: '',
      color: '',
      registrationDocumentUrl: '',
    });
    setIsEditing(false);
    setIsRegisterOpen(true);
  };

  // Open Edit Modal for Pending Vehicle
  const handleOpenEdit = (v: any) => {
    setFormData({
      licensePlate: v.licensePlate,
      type: v.type,
      brand: v.brand,
      model: v.model || '',
      color: v.color || '',
      registrationDocumentUrl: v.registrationDocumentUrl || '',
    });
    setIsEditing(true);
    setIsRegisterOpen(true);
  };

  // Submit registration form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licensePlate.trim()) {
      toast.error('Vui lòng nhập biển số xe hợp lệ');
      return;
    }

    if (isEditing && inspectingVehicle) {
      updateMutation.mutate(
        {
          id: inspectingVehicle.id,
          data: {
            brand: formData.brand.trim(),
            model: formData.model.trim() || null,
            color: formData.color.trim() || null,
            registrationDocumentUrl: formData.registrationDocumentUrl.trim() || null,
          },
        },
        {
          onSuccess: () => {
            setIsRegisterOpen(false);
            setInspectingVehicle(null);
            refetch();
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          licensePlate: formData.licensePlate.trim().toUpperCase(),
          type: formData.type,
          brand: formData.brand.trim(),
          model: formData.model.trim() || null,
          color: formData.color.trim() || null,
          registrationDocumentUrl: formData.registrationDocumentUrl.trim() || null,
        },
        {
          onSuccess: () => {
            setIsRegisterOpen(false);
            refetch();
          },
        }
      );
    }
  };

  // Render Approval Timeline Component
  const renderApprovalTimeline = (v: any) => {
    const isPending = v.status === 'PENDING_APPROVAL';
    const isApproved = v.status === 'ACTIVE';
    const isRejected = v.status === 'REJECTED';

    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-600" /> Tiến độ Xét duyệt Hồ sơ
          </span>
          <StatusBadge type="vehicleStatus" status={v.status} size="sm" />
        </div>

        {/* Step Indicator */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {/* Step 1: Submitted */}
          <div className="relative">
            <span className="absolute -left-6 top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                1. Đã gửi thông tin đăng ký
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hồ sơ được gửi thành công vào {formatDateTime(v.createdAt)}
              </p>
            </div>
          </div>

          {/* Step 2: Under Review */}
          <div className="relative">
            <span
              className={`absolute -left-6 top-0.5 h-3 w-3 rounded-full ${
                isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              } ring-4 ring-white dark:ring-slate-900`}
            />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                2. Ban Quản Lý thụ lý & đối soát cà vẹt
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isPending
                  ? 'Đang được cán bộ BQL kiểm tra tính hợp lệ của giấy tờ xe.'
                  : 'Đã hoàn tất quá trình đối soát hồ sơ.'}
              </p>
            </div>
          </div>

          {/* Step 3: Final Decision */}
          {isRejected ? (
            <div className="relative">
              <span className="absolute -left-6 top-0.5 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" /> 3. Hồ sơ bị từ chối phê duyệt
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-300">
                  <span className="font-semibold">Lý do từ chối:</span> {v.rejectionReason || 'Giấy tờ không hợp lệ hoặc vượt định mức đỗ xe.'}
                </p>
                <p className="text-[11px] text-rose-500 mt-1">
                  Vui lòng liên hệ Ban Quản Lý hoặc nộp lại hồ sơ chính xác.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <span
                className={`absolute -left-6 top-0.5 h-3 w-3 rounded-full ${
                  isApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                } ring-4 ring-white dark:ring-slate-900`}
              />
              <div>
                <p
                  className={`text-xs font-bold ${
                    isApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  3. Phê duyệt & Kích hoạt quyền gửi xe
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isApproved
                    ? 'Phương tiện đã được cấp quyền ra vào hầm và kích hoạt biểu phí trông giữ.'
                    : 'Chờ hoàn tất bước 2 để kích hoạt barie.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Mobile-Friendly Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-600/15">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold backdrop-blur-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Dịch vụ Quản lý Phương tiện Căn hộ
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Phương tiện & Thẻ giữ xe
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-md">
            Quản lý danh sách phương tiện đã đăng ký, theo dõi tiến trình phê duyệt cà vẹt và trạng thái thẻ từ RFID ra vào hầm.
          </p>
        </div>

        <div>
          <Button
            onClick={handleOpenRegister}
            className="w-full sm:w-auto bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm h-10 px-4 rounded-xl shadow-md gap-2"
          >
            <Plus className="h-4 w-4" /> Đăng ký phương tiện
          </Button>
        </div>
      </div>

      {/* Quick Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Total */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Tổng xe đăng ký</span>
            <Car className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-400">
            {stats.cars} ô tô • {stats.motorbikes} xe máy
          </span>
        </div>

        {/* 2. Active */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Đang hoạt động</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats.active}
          </div>
          <span className="text-[11px] text-slate-400">Được phép gửi hầm</span>
        </div>

        {/* 3. Pending */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Chờ phê duyệt</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.pending}
          </div>
          <span className="text-[11px] text-slate-400">Hồ sơ đang thụ lý</span>
        </div>

        {/* 4. Active Cards */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Thẻ RFID cấp</span>
            <KeyRound className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.activeCards}
          </div>
          <span className="text-[11px] text-slate-400">Thẻ từ mở barie</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CAR')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CAR'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Ô tô ({stats.cars})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOTORBIKE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'MOTORBIKE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Xe máy ({stats.motorbikes})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Chờ duyệt ({stats.pending})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Tìm theo biển số, hãng xe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <ErrorState
          title="Không thể tải danh sách phương tiện"
          message={(error as any)?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredVehicles.length === 0 && (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 text-center py-12 p-6 rounded-2xl">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Car className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {search ? 'Không tìm thấy phương tiện phù hợp' : 'Căn hộ chưa đăng ký phương tiện nào'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {search
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bấm tab Tất cả để xem toàn bộ danh sách xe.'
              : 'Đăng ký ngay ô tô hoặc xe máy để được Ban Quản Lý cấp phát thẻ từ RFID ra vào hầm giữ xe.'}
          </p>
          <Button
            onClick={handleOpenRegister}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 h-9 gap-1.5 rounded-xl"
          >
            <Plus className="h-4 w-4" /> Đăng ký xe mới
          </Button>
        </Card>
      )}

      {/* Card-Based Grid (Mobile-First) */}
      {!isLoading && !isError && filteredVehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVehicles.map((vehicle: any) => {
            const activeCard = vehicle.parkingCards?.find((c: any) => c.status === 'ACTIVE');
            const isCar = vehicle.type === 'CAR';
            const isPending = vehicle.status === 'PENDING_APPROVAL';

            return (
              <Card
                key={vehicle.id}
                onClick={() => setInspectingVehicle(vehicle)}
                className={`overflow-hidden rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group ${
                  isPending
                    ? 'border-amber-200 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/20 to-transparent'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isCar
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {isCar ? <Car className="h-6 w-6" /> : <Bike className="h-6 w-6" />}
                    </div>

                    <div>
                      {/* Embossed License Plate Badge */}
                      <div className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 rounded-lg tracking-wider w-fit shadow-2xs">
                        {vehicle.licensePlate}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                        {vehicle.brand} {vehicle.model ? `• ${vehicle.model}` : ''}
                      </span>
                    </div>
                  </div>

                  <StatusBadge type="vehicleStatus" status={vehicle.status} size="sm" />
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Loại xe</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {isCar ? 'Ô tô' : vehicle.type === 'MOTORBIKE' ? 'Xe máy' : 'Xe điện / Khác'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block">Màu sắc</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {vehicle.color || 'Chưa ghi nhận'}
                      </span>
                    </div>
                  </div>

                  {/* RFID Parking Card Status Badge */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Thẻ gửi xe RFID
                        </span>
                        {activeCard ? (
                          <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300">
                            {activeCard.cardCode}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa kích hoạt thẻ</span>
                        )}
                      </div>
                    </div>

                    <div>
                      {activeCard ? (
                        <StatusBadge type="parkingCardStatus" status={activeCard.status} size="sm" />
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">Chờ duyệt</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Đăng ký: {formatDate(vehicle.createdAt)}
                  </span>

                  <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Xem chi tiết & tiến độ <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      <DetailDrawer
        open={Boolean(inspectingVehicle)}
        onOpenChange={(open) => !open && setInspectingVehicle(null)}
        title={`Chi tiết: ${inspectingVehicle?.licensePlate || ''}`}
        description="Thông tin phương tiện, thẻ RFID và tiến trình xét duyệt của Ban Quản Lý"
        badge={inspectingVehicle && <StatusBadge type="vehicleStatus" status={inspectingVehicle.status} />}
        items={
          inspectingVehicle
            ? [
                { label: 'Biển số xe', value: inspectingVehicle.licensePlate, icon: Car },
                { label: 'Hãng xe', value: inspectingVehicle.brand },
                { label: 'Model xe', value: inspectingVehicle.model || 'Không xác định' },
                { label: 'Màu sơn', value: inspectingVehicle.color || 'Chưa ghi' },
                {
                  label: 'Thẻ gửi xe RFID',
                  value:
                    inspectingVehicle.parkingCards?.find((c: any) => c.status === 'ACTIVE')
                      ?.cardCode || 'Chưa cấp thẻ',
                  icon: KeyRound,
                },
                {
                  label: 'Hạn dùng thẻ',
                  value: inspectingVehicle.parkingCards?.[0]?.expiresAt
                    ? formatDate(inspectingVehicle.parkingCards[0].expiresAt)
                    : 'Vô thời hạn / Tự động gia hạn',
                  icon: Calendar,
                },
              ]
            : []
        }
        footerActions={
          inspectingVehicle && (
            <div className="flex items-center gap-2 w-full">
              {inspectingVehicle.status === 'PENDING_APPROVAL' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const v = inspectingVehicle;
                    setInspectingVehicle(null);
                    handleOpenEdit(v);
                  }}
                  className="w-full text-xs gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" /> Chỉnh sửa thông tin
                </Button>
              )}
            </div>
          )
        }
      >
        {/* Additional Detail content in Drawer */}
        {inspectingVehicle && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Approval Progress Timeline */}
            {renderApprovalTimeline(inspectingVehicle)}

            {/* Registration Document (Cà vẹt xe) */}
            {inspectingVehicle.registrationDocumentUrl && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" /> Cà vẹt & Giấy tờ đăng ký
                  </span>
                  <a
                    href={inspectingVehicle.registrationDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Xem ảnh gốc <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
                  <img
                    src={inspectingVehicle.registrationDocumentUrl}
                    alt="Giấy tờ xe"
                    className="rounded-lg object-contain w-full max-h-48"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {/* Registration / Edit Dialog */}
      <FormDialog
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        title={isEditing ? `Sửa hồ sơ: ${formData.licensePlate}` : 'Đăng ký Phương tiện Mới'}
        description="Điền thông tin phương tiện để gửi yêu cầu phê duyệt và nhận thẻ từ giữ xe RFID."
        icon={Car}
        onSubmit={handleSubmitForm}
        isLoading={createMutation.isPending || updateMutation.isPending}
        submitText={isEditing ? 'Lưu thay đổi' : 'Gửi đăng ký xét duyệt'}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Biển số xe <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="VD: 30A-12345"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                required
                disabled={isEditing}
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
                disabled={isEditing}
              >
                <option value="MOTORBIKE">Xe máy</option>
                <option value="CAR">Ô tô</option>
                <option value="ELECTRIC_BIKE">Xe đạp điện / Xe máy điện</option>
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
                placeholder="VD: Honda, Toyota, VinFast"
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
                placeholder="VD: Vision, Camry, VF8"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Màu sơn xe
            </label>
            <Input
              placeholder="VD: Trắng, Đen, Đỏ đô"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ảnh chụp Cà vẹt / Giấy đăng ký xe (Link URL)
            </label>
            <Input
              type="url"
              placeholder="https://example.com/cavet-xe.jpg"
              value={formData.registrationDocumentUrl}
              onChange={(e) => setFormData({ ...formData, registrationDocumentUrl: e.target.value })}
            />
            <span className="text-[11px] text-slate-400 block">
              Đính kèm link ảnh chụp rõ biển số và tên chủ sở hữu để BQL phê duyệt nhanh hơn.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <Info className="h-3.5 w-3.5" /> Quy trình sau khi gửi:
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400">
              Hồ sơ sẽ ở trạng thái <strong>Chờ duyệt (PENDING_APPROVAL)</strong>. Sau khi BQL đối soát hợp lệ, phương tiện sẽ được kích hoạt kèm mã thẻ RFID nhận tại phòng Ban Quản Lý.
            </p>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
