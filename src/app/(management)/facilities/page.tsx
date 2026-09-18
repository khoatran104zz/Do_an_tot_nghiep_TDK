'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Calendar as CalendarIcon,
  Waves,
  Dumbbell,
  Flame,
  Trophy,
  Briefcase,
  Building,
  Clock,
  Users,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Edit3,
  TrendingUp,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import {
  useFacilities,
  useFacilityStats,
  useSetFacilityStatus,
  useBookings,
  useCancelBooking,
} from '@/hooks/use-facilities';
import { useBuildingContext } from '@/context/BuildingContext';
import { CreateFacilityModal } from '@/components/facility/CreateFacilityModal';
import { FacilityType, FacilityStatus, BookingStatus } from '@prisma/client';
import {
  FACILITY_TYPE_LABELS,
  FACILITY_STATUS_BADGE,
  BOOKING_STATUS_BADGE,
} from '@/modules/facility/facility.constants';

export default function FacilitiesManagementPage() {
  const { selectedBuildingId } = useBuildingContext();
  const [activeTab, setActiveTab] = useState<'directory' | 'bookings'>('directory');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FacilityType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<FacilityStatus | ''>('');

  // Booking schedule filter
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingFacilityId, setBookingFacilityId] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<any | null>(null);

  // Cancel booking state
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Queries & Mutations
  const { data: statsData, isLoading: isStatsLoading } = useFacilityStats(
    selectedBuildingId || undefined
  );
  const { data: facilitiesData, isLoading: isFacilitiesLoading } = useFacilities({
    search: search || undefined,
    buildingId: selectedBuildingId || undefined,
    type: selectedType || undefined,
    status: selectedStatus || undefined,
    limit: 50,
  });

  const { data: bookingsData, isLoading: isBookingsLoading } = useBookings({
    date: bookingDate || undefined,
    facilityId: bookingFacilityId || undefined,
    buildingId: selectedBuildingId || undefined,
    limit: 100,
  });

  const setStatusMutation = useSetFacilityStatus();
  const cancelBookingMutation = useCancelBooking();

  const stats = statsData?.data || {
    totalFacilities: 0,
    activeFacilities: 0,
    todayBookingsCount: 0,
    totalBookingsCount: 0,
    mostBookedFacility: null,
    utilizationRate: 0,
    totalRevenue: 0,
  };

  const facilities = facilitiesData?.data || [];
  const bookings = bookingsData?.data || [];

  const handleToggleStatus = async (fac: any) => {
    const newStatus =
      fac.status === 'ACTIVE' ? FacilityStatus.BLOCKED : FacilityStatus.ACTIVE;
    await setStatusMutation.mutateAsync({ id: fac.id, status: newStatus });
  };

  const handleConfirmCancelBooking = async (id: string) => {
    await cancelBookingMutation.mutateAsync({
      id,
      data: { reason: cancelReason.trim() || 'BQL hủy do sự cố/bảo trì' },
    });
    setCancellingBookingId(null);
    setCancelReason('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản lý Tiện ích & Lịch đặt chỗ (Facilities & Booking)
            </h1>
            <Badge variant="outline" className="font-semibold text-blue-700 bg-blue-50 border-blue-200">
              Amenities Operations
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Giám sát công suất sử dụng, quản lý khung giờ, bảng giá và toàn bộ lịch đặt chỗ tiện ích cư dân.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingFacility(null);
            setIsCreateModalOpen(true);
          }}
          className="gap-2 bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm tiện ích mới</span>
        </Button>
      </div>

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Most Booked Facility */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tiện ích hot nhất</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {isStatsLoading
              ? '...'
              : stats.mostBookedFacility?.name || 'Chưa có dữ liệu'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats.mostBookedFacility
              ? `${stats.mostBookedFacility.bookingCount} lượt đặt thành công`
              : 'Ghi nhận theo tuần'}
          </p>
        </div>

        {/* Card 2: Bookings Count */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Lượt đặt hôm nay</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <CalendarIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">
            {isStatsLoading ? '...' : `${stats.todayBookingsCount} lượt`}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            Tổng tích lũy: {stats.totalBookingsCount} lượt
          </p>
        </div>

        {/* Card 3: Utilization Rate */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">Công suất sử dụng</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-800">
            {isStatsLoading ? '...' : `${stats.utilizationRate}%`}
          </div>
          <p className="text-[11px] text-indigo-600 mt-0.5">
            {stats.activeFacilities} / {stats.totalFacilities} tiện ích đang mở
          </p>
        </div>

        {/* Card 4: Revenue */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Doanh thu thu phí</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-800">
            {isStatsLoading
              ? '...'
              : `${Number(stats.totalRevenue).toLocaleString('vi-VN')} đ`}
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5">Phí tiện ích & cọc dịch vụ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs p-4">
        <Tabs
          items={[
            {
              id: 'directory',
              label: 'Danh mục & Cấu hình Tiện ích',
              icon: <Layers className="h-4 w-4" />,
              count: facilities.length,
            },
            {
              id: 'bookings',
              label: 'Lịch Đặt Chỗ Master Calendar',
              icon: <CalendarIcon className="h-4 w-4" />,
              count: bookings.length,
            },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          variant="underline"
        />

        <div className="mt-4">
          {/* TAB 1: DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên tiện ích, vị trí..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-slate-50/50 border-slate-200 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as FacilityType | '')}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">-- Tất cả phân loại --</option>
                    {Object.entries(FACILITY_TYPE_LABELS).map(([t, label]) => (
                      <option key={t} value={t}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as FacilityStatus | '')}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">-- Tất cả trạng thái --</option>
                    <option value="ACTIVE">Đang mở cửa</option>
                    <option value="MAINTENANCE">Đang bảo trì</option>
                    <option value="BLOCKED">Tạm khóa</option>
                    <option value="CLOSED">Đã đóng cửa</option>
                  </select>

                  {(search || selectedType || selectedStatus) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setSelectedType('');
                        setSelectedStatus('');
                      }}
                      className="text-xs text-slate-500"
                    >
                      Xóa lọc
                    </Button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                      <th className="py-3 px-4">Tên tiện ích</th>
                      <th className="py-3 px-4">Vị trí</th>
                      <th className="py-3 px-4">Giờ mở / Khung giờ</th>
                      <th className="py-3 px-4">Sức chứa / slot</th>
                      <th className="py-3 px-4">Phí dịch vụ</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {facilities.map((fac: any) => {
                      const statusBadge =
                        FACILITY_STATUS_BADGE[fac.status as FacilityStatus] || {
                          variant: 'secondary',
                          label: fac.status,
                        };

                      return (
                        <tr key={fac.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{fac.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {FACILITY_TYPE_LABELS[fac.type as FacilityType] || fac.type}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-800">
                            {fac.location}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">
                              {fac.openTime} - {fac.closeTime}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Slot: {fac.slotDuration} phút
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900">
                              {fac.maxUsers === 1
                                ? '1 nhóm (Độc quyền)'
                                : `${fac.maxUsers} người`}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-semibold text-emerald-700">
                            {fac.fee === 0
                              ? 'Miễn phí'
                              : `${Number(fac.fee).toLocaleString('vi-VN')} đ`}
                          </td>

                          <td className="py-3 px-4">
                            <Badge variant={statusBadge.variant} dot>
                              {statusBadge.label}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Block/Unblock Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(fac)}
                                disabled={setStatusMutation.isPending}
                                className={`h-8 text-xs ${
                                  fac.status === 'ACTIVE'
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={fac.status === 'ACTIVE' ? 'Khóa tiện ích' : 'Mở tiện ích'}
                              >
                                {fac.status === 'ACTIVE' ? (
                                  <>
                                    <Lock className="h-3.5 w-3.5 mr-1" /> Khóa
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-3.5 w-3.5 mr-1" /> Mở
                                  </>
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingFacility(fac);
                                  setIsCreateModalOpen(true);
                                }}
                                className="h-8 text-xs gap-1 border-slate-200"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Cấu hình
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER BOOKING SCHEDULE */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {/* Filter by date & facility */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    <span>Xem theo ngày:</span>
                  </div>
                  <Input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-44 h-9 text-xs bg-white"
                  />

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 ml-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span>Tiện ích:</span>
                  </div>
                  <select
                    value={bookingFacilityId}
                    onChange={(e) => setBookingFacilityId(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">-- Tất cả tiện ích --</option>
                    {facilities.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs text-slate-500">
                  Tổng cộng <strong>{bookings.length}</strong> lượt đặt trong ngày
                </span>
              </div>

              {/* Bookings List */}
              {isBookingsLoading ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  Đang tải lịch đặt chỗ...
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Chưa có lượt đặt chỗ nào trong ngày {new Date(bookingDate).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Các khung giờ tiện ích hiện đang trống và sẵn sàng phục vụ.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                        <th className="py-3 px-4">Mã đặt</th>
                        <th className="py-3 px-4">Tiện ích</th>
                        <th className="py-3 px-4">Cư dân & Căn hộ</th>
                        <th className="py-3 px-4">Khung giờ đặt</th>
                        <th className="py-3 px-4">Số người</th>
                        <th className="py-3 px-4">Phí dịch vụ</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {bookings.map((b: any) => {
                        const statusBadge =
                          BOOKING_STATUS_BADGE[b.status as BookingStatus] || {
                            variant: 'secondary',
                            label: b.status,
                          };

                        const canCancel =
                          b.status === 'CONFIRMED' || b.status === 'PENDING';

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                              {b.bookingCode}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">
                                {b.facility?.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {FACILITY_TYPE_LABELS[b.facility?.type as FacilityType] ||
                                  b.facility?.type}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-900">
                                {b.user?.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {b.apartment ? `Căn ${b.apartment.code}` : 'Khách vãng lai'}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">
                                {b.startTime} - {b.endTime}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(b.bookingDate).toLocaleDateString('vi-VN')}
                              </div>
                            </td>

                            <td className="py-3 px-4 font-medium text-slate-800">
                              {b.numberOfUsers} người
                            </td>

                            <td className="py-3 px-4 font-semibold text-emerald-700">
                              {b.totalFee === 0
                                ? 'Miễn phí'
                                : `${Number(b.totalFee).toLocaleString('vi-VN')} đ`}
                            </td>

                            <td className="py-3 px-4">
                              <Badge variant={statusBadge.variant} dot>
                                {statusBadge.label}
                              </Badge>
                            </td>

                            <td className="py-3 px-4 text-right">
                              {canCancel && (
                                <>
                                  {cancellingBookingId === b.id ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <input
                                        type="text"
                                        placeholder="Lý do hủy..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="h-7 px-2 text-xs rounded border border-slate-200 w-32"
                                      />
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleConfirmCancelBooking(b.id)}
                                        disabled={cancelBookingMutation.isPending}
                                        className="h-7 text-xs"
                                      >
                                        Hủy
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setCancellingBookingId(null)}
                                        className="h-7 text-xs text-slate-500"
                                      >
                                        Đóng
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setCancellingBookingId(b.id)}
                                      className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-1" />
                                      Hủy lịch
                                    </Button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal create / edit facility */}
      <CreateFacilityModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        facilityToEdit={editingFacility}
      />
    </div>
  );
}
