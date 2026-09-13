import { FacilityType, FacilityStatus, BookingStatus } from '@prisma/client';

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  GYM: 'Phòng Gym & Fitness',
  SWIMMING_POOL: 'Hồ bơi vô cực',
  BBQ_AREA: 'Khu nướng BBQ',
  COMMUNITY_ROOM: 'Phòng sinh hoạt cộng đồng',
  SPORTS_COURT: 'Sân thể thao',
  MEETING_ROOM: 'Phòng họp & Co-working',
  OTHER: 'Khác',
};

export const FACILITY_STATUS_LABELS: Record<FacilityStatus, string> = {
  ACTIVE: 'Đang mở cửa',
  MAINTENANCE: 'Đang bảo trì',
  BLOCKED: 'Tạm khóa',
  CLOSED: 'Đã đóng cửa',
};

export const FACILITY_STATUS_BADGE: Record<
  FacilityStatus,
  { variant: 'success' | 'warning' | 'destructive' | 'secondary'; label: string }
> = {
  ACTIVE: { variant: 'success', label: 'Đang mở cửa' },
  MAINTENANCE: { variant: 'warning', label: 'Đang bảo trì' },
  BLOCKED: { variant: 'destructive', label: 'Tạm khóa' },
  CLOSED: { variant: 'secondary', label: 'Đã đóng cửa' },
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Đã hoàn tất',
};

export const BOOKING_STATUS_BADGE: Record<
  BookingStatus,
  { variant: 'info' | 'success' | 'destructive' | 'secondary'; label: string }
> = {
  PENDING: { variant: 'info', label: 'Chờ xác nhận' },
  CONFIRMED: { variant: 'success', label: 'Đã xác nhận' },
  CANCELLED: { variant: 'destructive', label: 'Đã hủy' },
  COMPLETED: { variant: 'secondary', label: 'Đã hoàn tất' },
};
