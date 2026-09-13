import { FacilityType, FacilityStatus, BookingStatus } from '@prisma/client';

export interface FacilityFilter {
  search?: string;
  type?: FacilityType;
  status?: FacilityStatus;
  buildingId?: string;
  page?: number;
  limit?: number;
}

export interface CreateFacilityDto {
  name: string;
  type: FacilityType;
  description?: string | null;
  location: string;
  buildingId?: string | null;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  slotDuration?: number; // minutes
  maxUsers?: number;
  fee?: number;
  status?: FacilityStatus;
  images?: string[];
  rules?: string | null;
}

export interface UpdateFacilityDto extends Partial<CreateFacilityDto> {}

export interface BookingFilter {
  facilityId?: string;
  userId?: string;
  apartmentId?: string;
  status?: BookingStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  date?: string | Date;
  page?: number;
  limit?: number;
}

export interface CreateBookingDto {
  facilityId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  numberOfUsers?: number;
  notes?: string;
}

export interface CancelBookingDto {
  reason?: string;
}

export interface TimeSlotInfo {
  startTime: string;
  endTime: string;
  bookedUsers: number;
  maxUsers: number;
  isAvailable: boolean;
  isPast: boolean;
}

export interface FacilityDashboardStats {
  totalFacilities: number;
  activeFacilities: number;
  todayBookingsCount: number;
  totalBookingsCount: number;
  mostBookedFacility: {
    id: string;
    name: string;
    type: FacilityType;
    bookingCount: number;
  } | null;
  utilizationRate: number; // percentage (0 - 100)
  totalRevenue: number; // in VND
}

export interface UserContext {
  id: string;
  email?: string | null;
  role?: string | null;
  fullName?: string | null;
}
