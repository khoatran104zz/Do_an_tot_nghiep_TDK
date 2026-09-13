'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  Flame,
  Waves,
  Dumbbell,
  Trophy,
  Briefcase,
  Building,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFacilities, useMyBookings } from '@/hooks/use-facilities';
import { BookFacilityModal } from '@/components/facility/BookFacilityModal';
import { MyBookingsDrawer } from '@/components/facility/MyBookingsDrawer';
import { FacilityType } from '@prisma/client';
import { FACILITY_TYPE_LABELS } from '@/modules/facility/facility.constants';

const TYPE_ICONS: Record<FacilityType, any> = {
  SWIMMING_POOL: Waves,
  GYM: Dumbbell,
  BBQ_AREA: Flame,
  SPORTS_COURT: Trophy,
  MEETING_ROOM: Briefcase,
  COMMUNITY_ROOM: Building,
  OTHER: Sparkles,
};

export default function ResidentFacilitiesPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FacilityType | ''>('');

  const [bookingTargetFacility, setBookingTargetFacility] = useState<any | null>(null);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);

  // Fetch facilities list & resident's bookings count
  const { data: facilitiesData, isLoading } = useFacilities({
    search: search || undefined,
    type: selectedType || undefined,
    limit: 50,
  });
  const { data: myBookingsData } = useMyBookings();

  const facilities = facilitiesData?.data || [];
  const myBookings = myBookingsData?.data || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Tiện ích & Đặt chỗ Cư dân"
          description="Khám phá và đăng ký sử dụng hệ thống tiện ích đẳng cấp: Hồ bơi vô cực, Phòng Gym, Vườn nướng BBQ, Sân thể thao."
        />
        <Button
          variant="outline"
          onClick={() => setIsMyBookingsOpen(true)}
          className="gap-2 shrink-0 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/70"
        >
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>Lịch đặt của tôi</span>
          <Badge variant="default" className="ml-1 bg-blue-600 text-white text-[11px] px-1.5 py-0">
            {myBookings.length}
          </Badge>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo tên tiện ích, vị trí, tiện nghi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="h-3.5 w-3.5" />
              <span>Phân loại:</span>
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as FacilityType | '')}
              className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Tất cả tiện ích --</option>
              {Object.entries(FACILITY_TYPE_LABELS).map(([t, label]) => (
                <option key={t} value={t}>
                  {label}
                </option>
              ))}
            </select>

            {(search || selectedType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedType('');
                }}
                className="text-xs text-slate-500"
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Facility Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Đang tải danh mục tiện ích...
        </div>
      ) : facilities.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">Không tìm thấy tiện ích nào</h3>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng thử tìm kiếm với từ khóa khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((fac: any) => {
            const Icon = TYPE_ICONS[fac.type as FacilityType] || Sparkles;

            return (
              <Card
                key={fac.id}
                className="border-slate-200/90 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden group bg-white"
              >
                {/* Image or Banner */}
                {fac.images && fac.images.length > 0 ? (
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={fac.images[0]}
                      alt={fac.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-blue-600" />
                        {FACILITY_TYPE_LABELS[fac.type as FacilityType] || fac.type}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                        {fac.fee === 0
                          ? 'Miễn phí'
                          : `${Number(fac.fee).toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {FACILITY_TYPE_LABELS[fac.type as FacilityType] || fac.type}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {fac.fee === 0
                        ? 'Miễn phí'
                        : `${Number(fac.fee).toLocaleString('vi-VN')} đ/lượt`}
                    </span>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {fac.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {fac.description || 'Tiện ích hiện đại phục vụ nhu cầu thư giãn, rèn luyện của cư dân.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 text-xs text-slate-600 pb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{fac.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>
                      Giờ mở cửa: <strong className="text-slate-800">{fac.openTime} - {fac.closeTime}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>
                      Sức chứa:{' '}
                      <strong className="text-slate-800">
                        {fac.maxUsers === 1
                          ? '1 nhóm / gia đình (Độc quyền)'
                          : `Tối đa ${fac.maxUsers} người / slot`}
                      </strong>
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 bg-slate-50/50">
                  <Button
                    onClick={() => setBookingTargetFacility(fac)}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <span>Xem lịch & Đặt chỗ ngay</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      <BookFacilityModal
        open={!!bookingTargetFacility}
        onOpenChange={(open) => !open && setBookingTargetFacility(null)}
        facility={bookingTargetFacility}
      />

      {/* Resident My Bookings Drawer */}
      <MyBookingsDrawer
        open={isMyBookingsOpen}
        onOpenChange={setIsMyBookingsOpen}
      />
    </div>
  );
}
