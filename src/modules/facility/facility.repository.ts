import { prisma } from '@/lib/prisma';
import {
  FacilityType,
  FacilityStatus,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import {
  FacilityFilter,
  CreateFacilityDto,
  UpdateFacilityDto,
  BookingFilter,
  CreateBookingDto,
  TimeSlotInfo,
  FacilityDashboardStats,
} from './facility.types';

export class FacilityRepository {
  // ==========================================
  // 1. FACILITY CRUD
  // ==========================================

  async findFacilities(filter: FacilityFilter = {}, role?: string) {
    const { search, type, status, buildingId, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.FacilityWhereInput = {};

    // Residents only see ACTIVE facilities by default unless specified
    if (role === 'RESIDENT') {
      where.status = FacilityStatus.ACTIVE;
    } else if (status) {
      where.status = status;
    }

    if (type) where.type = type;
    if (buildingId) where.buildingId = buildingId;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          building: { select: { id: true, name: true, code: true } },
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
                },
              },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.facility.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findFacilityById(id: string) {
    return prisma.facility.findUnique({
      where: { id },
      include: {
        building: { select: { id: true, name: true, code: true } },
        bookings: {
          where: {
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          },
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
            apartment: { select: { id: true, code: true, building: true } },
          },
          orderBy: { startTimeDate: 'asc' },
          take: 20,
        },
      },
    });
  }

  async createFacility(data: CreateFacilityDto) {
    return prisma.facility.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        location: data.location,
        buildingId: data.buildingId,
        openTime: data.openTime,
        closeTime: data.closeTime,
        slotDuration: data.slotDuration || 60,
        maxUsers: data.maxUsers || 1,
        fee: data.fee || 0,
        status: data.status || FacilityStatus.ACTIVE,
        images: data.images || [],
        rules: data.rules,
      },
      include: {
        building: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async updateFacility(id: string, data: UpdateFacilityDto) {
    return prisma.facility.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location && { location: data.location }),
        ...(data.buildingId !== undefined && { buildingId: data.buildingId }),
        ...(data.openTime && { openTime: data.openTime }),
        ...(data.closeTime && { closeTime: data.closeTime }),
        ...(data.slotDuration && { slotDuration: data.slotDuration }),
        ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers }),
        ...(data.fee !== undefined && { fee: data.fee }),
        ...(data.status && { status: data.status }),
        ...(data.images && { images: data.images }),
        ...(data.rules !== undefined && { rules: data.rules }),
      },
      include: {
        building: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async updateFacilityStatus(id: string, status: FacilityStatus) {
    return prisma.facility.update({
      where: { id },
      data: { status },
    });
  }

  async deleteFacility(id: string) {
    return prisma.facility.delete({
      where: { id },
    });
  }

  // ==========================================
  // 2. TIME-SLOTS & ANTI-OVERBOOKING CHECK
  // ==========================================

  async getAvailableSlots(facilityId: string, dateStr: string): Promise<TimeSlotInfo[]> {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new Error('Không tìm thấy tiện ích');
    }

    // If facility is not active, return no available slots
    if (facility.status !== FacilityStatus.ACTIVE) {
      return [];
    }

    // Parse openTime & closeTime in minutes
    const [openH, openM] = facility.openTime.split(':').map(Number);
    const [closeH, closeM] = facility.closeTime.split(':').map(Number);
    const openTotalMin = openH * 60 + openM;
    const closeTotalMin = closeH * 60 + closeM;
    const duration = facility.slotDuration || 60;

    // Build raw slot boundaries
    interface RawSlot {
      startTime: string;
      endTime: string;
      startDate: Date;
      endDate: Date;
    }

    const rawSlots: RawSlot[] = [];
    for (let m = openTotalMin; m + duration <= closeTotalMin; m += duration) {
      const sH = Math.floor(m / 60).toString().padStart(2, '0');
      const sM = (m % 60).toString().padStart(2, '0');
      const eH = Math.floor((m + duration) / 60).toString().padStart(2, '0');
      const eM = ((m + duration) % 60).toString().padStart(2, '0');

      const startTime = `${sH}:${sM}`;
      const endTime = `${eH}:${eM}`;

      const startDate = new Date(`${dateStr}T${startTime}:00.000Z`);
      const endDate = new Date(`${dateStr}T${endTime}:00.000Z`);

      rawSlots.push({ startTime, endTime, startDate, endDate });
    }

    if (rawSlots.length === 0) return [];

    // Query all overlapping active bookings on this date
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const existingBookings = await prisma.facilityBooking.findMany({
      where: {
        facilityId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startTimeDate: { lte: dayEnd },
        endTimeDate: { gte: dayStart },
      },
      select: {
        startTimeDate: true,
        endTimeDate: true,
        numberOfUsers: true,
      },
    });

    const now = new Date();

    return rawSlots.map((slot) => {
      // Find bookings overlapping with this slot
      const overlapping = existingBookings.filter((b) => {
        return b.startTimeDate < slot.endDate && b.endTimeDate > slot.startDate;
      });

      const bookedUsers = facility.maxUsers === 1
        ? (overlapping.length > 0 ? 1 : 0)
        : overlapping.reduce((acc, b) => acc + b.numberOfUsers, 0);

      // Check if slot is in the past
      // Compare local date/time
      const isPast = slot.startDate.getTime() < now.getTime();
      const isAvailable = !isPast && bookedUsers < facility.maxUsers;

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        bookedUsers,
        maxUsers: facility.maxUsers,
        isAvailable,
        isPast,
      };
    });
  }

  // ==========================================
  // 3. BOOKING CREATION WITH TRANSACTION & OVERBOOKING PREVENTION
  // ==========================================

  async createBookingWithAntiOverbookingLock(
    data: CreateBookingDto,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch facility
      const facility = await tx.facility.findUnique({
        where: { id: data.facilityId },
      });

      if (!facility) {
        throw new Error('Tiện ích không tồn tại');
      }

      if (facility.status !== FacilityStatus.ACTIVE) {
        throw new Error(
          `Tiện ích hiện đang ở trạng thái [${facility.status}], không thể nhận đặt chỗ`
        );
      }

      // 2. Validate time boundaries
      if (data.startTime < facility.openTime || data.endTime > facility.closeTime) {
        throw new Error(
          `Khung giờ đặt phải nằm trong thời gian mở cửa (${facility.openTime} - ${facility.closeTime})`
        );
      }

      if (data.startTime >= data.endTime) {
        throw new Error('Giờ bắt đầu phải trước giờ kết thúc');
      }

      const startTimeDate = new Date(`${data.bookingDate}T${data.startTime}:00.000Z`);
      const endTimeDate = new Date(`${data.bookingDate}T${data.endTime}:00.000Z`);

      if (startTimeDate.getTime() < Date.now()) {
        throw new Error('Không thể đặt chỗ cho khung giờ đã qua trong quá khứ');
      }

      const requestedUsers = data.numberOfUsers || 1;
      if (requestedUsers > facility.maxUsers) {
        throw new Error(
          `Số lượng người đăng ký (${requestedUsers}) vượt quá sức chứa tối đa của tiện ích (${facility.maxUsers} người)`
        );
      }

      // 3. CRITICAL: Concurrency Overlap Check (Anti-Overbooking Lock)
      const overlappingBookings = await tx.facilityBooking.findMany({
        where: {
          facilityId: data.facilityId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          startTimeDate: { lt: endTimeDate },
          endTimeDate: { gt: startTimeDate },
        },
        select: {
          id: true,
          bookingCode: true,
          numberOfUsers: true,
          startTime: true,
          endTime: true,
        },
      });

      if (facility.maxUsers === 1) {
        // Exclusive facility (e.g. BBQ, Meeting Room, Sports Court)
        if (overlappingBookings.length > 0) {
          throw new Error(
            `Khung giờ ${data.startTime} - ${data.endTime} ngày ${data.bookingDate} đã có người đặt trước. Vui lòng chọn khung giờ khác!`
          );
        }
      } else {
        // Capacity facility (e.g. Gym, Swimming Pool)
        const currentBookedUsers = overlappingBookings.reduce(
          (sum, b) => sum + b.numberOfUsers,
          0
        );

        if (currentBookedUsers + requestedUsers > facility.maxUsers) {
          const remaining = Math.max(0, facility.maxUsers - currentBookedUsers);
          throw new Error(
            `Khung giờ ${data.startTime} - ${data.endTime} chỉ còn trống ${remaining} chỗ (bạn yêu cầu ${requestedUsers} chỗ). Vui lòng chọn khung giờ khác!`
          );
        }
      }

      // 4. Resolve Resident & Apartment profile if available
      const resident = await tx.resident.findFirst({
        where: { userId },
        include: { apartment: true },
      });

      // 5. Generate Booking Code
      const year = new Date().getFullYear();
      const count = await tx.facilityBooking.count();
      const bookingCode = `BK-${year}-${(count + 1).toString().padStart(4, '0')}`;

      // 6. Create booking
      const booking = await tx.facilityBooking.create({
        data: {
          bookingCode,
          facilityId: data.facilityId,
          userId,
          residentId: resident?.id || null,
          apartmentId: resident?.apartmentId || null,
          bookingDate: new Date(`${data.bookingDate}T00:00:00.000Z`),
          startTime: data.startTime,
          endTime: data.endTime,
          startTimeDate,
          endTimeDate,
          numberOfUsers: requestedUsers,
          totalFee: facility.fee || 0,
          status: BookingStatus.CONFIRMED,
          notes: data.notes || null,
        },
        include: {
          facility: true,
          user: { select: { id: true, fullName: true, phone: true } },
          apartment: { select: { id: true, code: true, building: true } },
        },
      });

      return booking;
    });
  }

  // ==========================================
  // 4. BOOKINGS LIST & CANCELLATION
  // ==========================================

  async findBookings(filter: BookingFilter = {}) {
    const { facilityId, userId, apartmentId, status, date, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.FacilityBookingWhereInput = {};

    if (facilityId) where.facilityId = facilityId;
    if (userId) where.userId = userId;
    if (apartmentId) where.apartmentId = apartmentId;
    if (status) where.status = status;

    if (date) {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      where.bookingDate = {
        gte: new Date(`${dateStr}T00:00:00.000Z`),
        lte: new Date(`${dateStr}T23:59:59.999Z`),
      };
    }

    const [items, total] = await Promise.all([
      prisma.facilityBooking.findMany({
        where,
        include: {
          facility: {
            select: { id: true, name: true, type: true, location: true, fee: true },
          },
          user: { select: { id: true, fullName: true, phone: true } },
          apartment: { select: { id: true, code: true, building: true } },
        },
        orderBy: { startTimeDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.facilityBooking.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findBookingById(id: string) {
    return prisma.facilityBooking.findUnique({
      where: { id },
      include: {
        facility: true,
        user: { select: { id: true, fullName: true, phone: true, email: true } },
        apartment: { select: { id: true, code: true, building: true } },
      },
    });
  }

  async cancelBooking(id: string, reason?: string) {
    return prisma.facilityBooking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledReason: reason || 'Hủy bởi người dùng',
      },
      include: {
        facility: true,
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  // ==========================================
  // 5. DASHBOARD STATS & UTILIZATION
  // ==========================================

  async getDashboardStats(): Promise<FacilityDashboardStats> {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    const [
      totalFacilities,
      activeFacilities,
      todayBookingsCount,
      totalBookingsCount,
      bookingsByFacility,
      revenueResult,
    ] = await Promise.all([
      prisma.facility.count(),
      prisma.facility.count({ where: { status: FacilityStatus.ACTIVE } }),
      prisma.facilityBooking.count({
        where: {
          bookingDate: { gte: todayStart, lte: todayEnd },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      }),
      prisma.facilityBooking.count({
        where: {
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      }),
      prisma.facilityBooking.groupBy({
        by: ['facilityId'],
        where: {
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      prisma.facilityBooking.aggregate({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
        _sum: { totalFee: true },
      }),
    ]);

    let mostBookedFacility: FacilityDashboardStats['mostBookedFacility'] = null;
    if (bookingsByFacility.length > 0) {
      const topFacility = await prisma.facility.findUnique({
        where: { id: bookingsByFacility[0].facilityId },
        select: { id: true, name: true, type: true },
      });
      if (topFacility) {
        mostBookedFacility = {
          id: topFacility.id,
          name: topFacility.name,
          type: topFacility.type,
          bookingCount: bookingsByFacility[0]._count.id,
        };
      }
    }

    // Approximate utilization rate: today's bookings divided by (active facilities * 12 slots average) * 100
    const theoreticalMaxDailySlots = Math.max(1, activeFacilities * 12);
    const utilizationRate = Math.min(
      100,
      Math.round((todayBookingsCount / theoreticalMaxDailySlots) * 100)
    );

    return {
      totalFacilities,
      activeFacilities,
      todayBookingsCount,
      totalBookingsCount,
      mostBookedFacility,
      utilizationRate,
      totalRevenue: revenueResult._sum.totalFee || 0,
    };
  }
}

export const facilityRepository = new FacilityRepository();
