import { facilityRepository } from './facility.repository';
import {
  FacilityFilter,
  CreateFacilityDto,
  UpdateFacilityDto,
  BookingFilter,
  CreateBookingDto,
  UserContext,
} from './facility.types';
import { FacilityStatus } from '@prisma/client';
import { auditLogService } from '@/modules/audit/audit-log.service';

export class FacilityService {
  // ==========================================
  // 1. FACILITIES
  // ==========================================

  async getFacilities(filter: FacilityFilter, user?: UserContext) {
    return facilityRepository.findFacilities(filter, user?.role || undefined);
  }

  async getFacilityById(id: string) {
    const facility = await facilityRepository.findFacilityById(id);
    if (!facility) {
      throw new Error('Không tìm thấy tiện ích tòa nhà');
    }
    return facility;
  }

  async createFacility(dto: CreateFacilityDto, user: UserContext) {
    const facility = await facilityRepository.createFacility(dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_FACILITY',
      entity: 'FACILITY',
      entityId: facility.id,
      metadata: {
        name: facility.name,
        type: facility.type,
        location: facility.location,
        openTime: facility.openTime,
        closeTime: facility.closeTime,
        maxUsers: facility.maxUsers,
        fee: facility.fee,
      },
    });

    return facility;
  }

  async updateFacility(id: string, dto: UpdateFacilityDto, user: UserContext) {
    const facility = await facilityRepository.updateFacility(id, dto);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'UPDATE_FACILITY',
      entity: 'FACILITY',
      entityId: facility.id,
      metadata: {
        name: facility.name,
        status: facility.status,
        maxUsers: facility.maxUsers,
        fee: facility.fee,
      },
    });

    return facility;
  }

  async setFacilityStatus(id: string, status: FacilityStatus, user: UserContext) {
    const facility = await facilityRepository.updateFacilityStatus(id, status);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CHANGE_FACILITY_STATUS',
      entity: 'FACILITY',
      entityId: facility.id,
      metadata: {
        name: facility.name,
        newStatus: status,
      },
    });

    return facility;
  }

  async deleteFacility(id: string, user: UserContext) {
    const facility = await this.getFacilityById(id);
    const result = await facilityRepository.deleteFacility(id);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DELETE_FACILITY',
      entity: 'FACILITY',
      entityId: id,
      metadata: {
        name: facility.name,
      },
    });

    return result;
  }

  // ==========================================
  // 2. SLOTS & BOOKINGS
  // ==========================================

  async getSlots(facilityId: string, date: string) {
    return facilityRepository.getAvailableSlots(facilityId, date);
  }

  async createBooking(dto: CreateBookingDto, user: UserContext) {
    const booking = await facilityRepository.createBookingWithAntiOverbookingLock(
      dto,
      user.id
    );

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CREATE_FACILITY_BOOKING',
      entity: 'FACILITY_BOOKING',
      entityId: booking.id,
      metadata: {
        bookingCode: booking.bookingCode,
        facilityName: booking.facility.name,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        numberOfUsers: booking.numberOfUsers,
        totalFee: booking.totalFee,
      },
    });

    return booking;
  }

  async getBookings(filter: BookingFilter, user: UserContext) {
    // If resident, enforce filtering by their userId only
    if (user.role === 'RESIDENT') {
      filter.userId = user.id;
    }
    return facilityRepository.findBookings(filter);
  }

  async cancelBooking(bookingId: string, reason: string | undefined, user: UserContext) {
    const booking = await facilityRepository.findBookingById(bookingId);
    if (!booking) {
      throw new Error('Không tìm thấy lịch đặt chỗ');
    }

    // If resident, check ownership
    if (user.role === 'RESIDENT' && booking.userId !== user.id) {
      throw new Error('Bạn không có quyền hủy lịch đặt chỗ của cư dân khác');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Lịch đặt chỗ này đã bị hủy trước đó');
    }

    const updated = await facilityRepository.cancelBooking(bookingId, reason);

    await auditLogService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CANCEL_FACILITY_BOOKING',
      entity: 'FACILITY_BOOKING',
      entityId: booking.id,
      metadata: {
        bookingCode: booking.bookingCode,
        reason: reason || 'Người dùng hủy',
        cancelledBy: user.email,
      },
    });

    return updated;
  }

  async getDashboardMetrics() {
    return facilityRepository.getDashboardStats();
  }
}

export const facilityService = new FacilityService();
