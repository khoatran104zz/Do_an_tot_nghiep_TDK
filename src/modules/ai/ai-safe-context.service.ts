import { prisma } from '@/lib/prisma';
import { InvoiceStatus, Role, ParkingAssignmentStatus, ParkingSlotStatus } from '@prisma/client';

export interface SafeResidentContext {
  userId: string;
  role?: string;
  hasApartment: boolean;
  apartmentCode?: string;
  apartmentBuilding?: string;
  apartmentFloor?: number;
  residentName?: string;
  currentMonthInvoices: Array<{
    code: string;
    totalAmount: number;
    dueDate: Date;
    status: InvoiceStatus;
    billingMonth: string;
  }>;
  overdueInvoices: Array<{
    code: string;
    totalAmount: number;
    dueDate: Date;
    status: InvoiceStatus;
  }>;
  facilities: Array<{
    name: string;
    type: string;
    operatingHours: string;
    location?: string | null;
  }>;
  recentTickets: Array<{
    code: string;
    title: string;
    status: string;
    createdAt: Date;
  }>;

  // Real Parking Domain Context (Section 27, 28, 29, 38)
  parkingAvailability?: {
    total: number;
    available: number;
    occupied: number;
    areas: Array<{
      code: string;
      name: string;
      floor: number;
      available: number;
      total: number;
    }>;
  };
  myParkingAssignments?: Array<{
    slotCode: string;
    areaName: string;
    floor: number;
    licensePlate: string;
    vehicleBrand: string;
    vehicleModel?: string | null;
    startDate: Date;
    endDate?: Date | null;
  }>;
  myVehicles?: Array<{
    licensePlate: string;
    brand: string;
    model?: string | null;
    type: string;
    status: string;
    cardCode?: string | null;
    cardStatus?: string | null;
  }>;

  // Role-specific operational stats
  managementStats?: {
    totalApartments: number;
    occupiedApartments: number;
    occupancyRate: number;
    unpaidInvoicesCount: number;
    unpaidInvoicesAmount: number;
    openTicketsCount: number;
    criticalAlertsCount: number;
  };
  technicianStats?: {
    openTicketsCount: number;
    pendingMaintenanceCount: number;
    abnormalSensorsCount: number;
  };
  securityStats?: {
    todayVisitorsCount: number;
    pendingPassesCount: number;
    activeParkingCardsCount: number;
    activeAlertsCount: number;
  };
  receptionistStats?: {
    waitingParcelsCount: number;
    todayVisitorsCount: number;
  };
}

export type SafeUserContext = SafeResidentContext;

export class AISafeContextService {
  /**
   * Safe Context Retrieval Layer:
   * Isolate data according to the authenticated user's role and boundaries.
   */
  async getSafeContextForUser(userId: string, role?: string): Promise<SafeResidentContext> {
    // 1. If role is not provided, look up the user's role in DB
    let effectiveRole = role;
    if (!effectiveRole) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      effectiveRole = user?.role || 'RESIDENT';
    }

    // Baseline facilities data (Public to all roles)
    const facilitiesData = await prisma.facility.findMany({
      where: { status: 'ACTIVE' },
      select: {
        name: true,
        type: true,
        openTime: true,
        closeTime: true,
        location: true,
      },
      take: 10,
    });

    const formattedFacilities = facilitiesData.map((f) => ({
      name: f.name,
      type: f.type,
      operatingHours: `${f.openTime} - ${f.closeTime}`,
      location: f.location,
    }));

    // Baseline parking availability (Public real data for all authenticated roles)
    const parkingAreas = await prisma.parkingArea.findMany({
      where: { isActive: true },
      include: {
        slots: {
          where: { isActive: true },
          select: { status: true },
        },
      },
      orderBy: { floor: 'asc' },
    });

    let totalParkingSlots = 0;
    let totalAvailableSlots = 0;
    let totalOccupiedSlots = 0;

    const areaParkingStats = parkingAreas.map((area) => {
      const total = area.slots.length;
      const occupied = area.slots.filter((s) => s.status === ParkingSlotStatus.OCCUPIED).length;
      const available = area.slots.filter((s) => s.status === ParkingSlotStatus.AVAILABLE).length;
      totalParkingSlots += total;
      totalAvailableSlots += available;
      totalOccupiedSlots += occupied;
      return {
        code: area.code,
        name: area.name,
        floor: area.floor,
        available,
        total,
      };
    });

    const parkingAvailability = {
      total: totalParkingSlots,
      available: totalAvailableSlots,
      occupied: totalOccupiedSlots,
      areas: areaParkingStats,
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 2. ADMIN & MANAGER: Aggregate operational stats
    if (effectiveRole === 'ADMIN' || effectiveRole === 'MANAGER') {
      const [
        totalApts,
        occupiedApts,
        unpaidInvoicesAgg,
        openTickets,
        activeAlerts,
      ] = await Promise.all([
        prisma.apartment.count(),
        prisma.apartment.count({ where: { status: 'OCCUPIED' } }),
        prisma.invoice.aggregate({
          where: { status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] } },
          _count: true,
          _sum: { totalAmount: true },
        }),
        prisma.feedback.count({
          where: { status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] } },
        }),
        prisma.smartAlertRecord.count({
          where: { status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
        }),
      ]);

      const occupancyRate = totalApts > 0 ? Math.round((occupiedApts / totalApts) * 100) : 0;

      return {
        userId,
        role: effectiveRole,
        hasApartment: false,
        currentMonthInvoices: [],
        overdueInvoices: [],
        facilities: formattedFacilities,
        recentTickets: [],
        parkingAvailability,
        managementStats: {
          totalApartments: totalApts,
          occupiedApartments: occupiedApts,
          occupancyRate,
          unpaidInvoicesCount: unpaidInvoicesAgg._count || 0,
          unpaidInvoicesAmount: Number(unpaidInvoicesAgg._sum?.totalAmount || 0),
          openTicketsCount: openTickets,
          criticalAlertsCount: activeAlerts,
        },
      };
    }

    // 3. STAFF_TECHNICIAN: Maintenance, equipment & IoT alerts
    if (effectiveRole === 'STAFF_TECHNICIAN') {
      const [openTickets, pendingMaintenance, abnormalSensors] = await Promise.all([
        prisma.feedback.count({
          where: { status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] } },
        }),
        prisma.maintenanceSchedule.count({
          where: { status: 'PENDING' },
        }),
        prisma.ioTSensor.count({
          where: { status: { in: ['WARNING', 'CRITICAL'] } },
        }),
      ]);

      return {
        userId,
        role: effectiveRole,
        hasApartment: false,
        currentMonthInvoices: [],
        overdueInvoices: [],
        facilities: formattedFacilities,
        recentTickets: [],
        parkingAvailability,
        technicianStats: {
          openTicketsCount: openTickets,
          pendingMaintenanceCount: pendingMaintenance,
          abnormalSensorsCount: abnormalSensors,
        },
      };
    }

    // 4. STAFF_SECURITY: Visitor passes, parking cards & security alerts
    if (effectiveRole === 'STAFF_SECURITY') {
      const [todayVisitors, pendingPasses, activeCards, activeAlerts] = await Promise.all([
        prisma.visitorPass.count({
          where: { createdAt: { gte: todayStart } },
        }),
        prisma.visitorPass.count({
          where: { status: 'PENDING' },
        }),
        prisma.parkingCard.count({
          where: { status: 'ACTIVE' },
        }),
        prisma.smartAlertRecord.count({
          where: { status: 'OPEN' },
        }),
      ]);

      return {
        userId,
        role: effectiveRole,
        hasApartment: false,
        currentMonthInvoices: [],
        overdueInvoices: [],
        facilities: formattedFacilities,
        recentTickets: [],
        parkingAvailability,
        securityStats: {
          todayVisitorsCount: todayVisitors,
          pendingPassesCount: pendingPasses,
          activeParkingCardsCount: activeCards,
          activeAlertsCount: activeAlerts,
        },
      };
    }

    // 5. STAFF_RECEPTIONIST: Waiting parcels & expected visitors
    if (effectiveRole === 'STAFF_RECEPTIONIST') {
      const [waitingParcels, todayVisitors] = await Promise.all([
        prisma.parcelDelivery.count({
          where: { status: 'RECEIVED' },
        }),
        prisma.visitorPass.count({
          where: { createdAt: { gte: todayStart } },
        }),
      ]);

      return {
        userId,
        role: effectiveRole,
        hasApartment: false,
        currentMonthInvoices: [],
        overdueInvoices: [],
        facilities: formattedFacilities,
        recentTickets: [],
        parkingAvailability,
        receptionistStats: {
          waitingParcelsCount: waitingParcels,
          todayVisitorsCount: todayVisitors,
        },
      };
    }

    // 6. RESIDENT (Default): Isolated apartment & resident-specific context
    const resident = await prisma.resident.findFirst({
      where: { userId },
      include: {
        apartment: {
          select: {
            id: true,
            code: true,
            building: true,
            floor: true,
          },
        },
      },
    });

    if (!resident || !resident.apartment) {
      return {
        userId,
        role: effectiveRole,
        hasApartment: false,
        currentMonthInvoices: [],
        overdueInvoices: [],
        facilities: formattedFacilities,
        recentTickets: [],
        parkingAvailability,
      };
    }

    const aptId = resident.apartment.id;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get current month unpaid/pending invoices ONLY for this apartment, plus parking assignments & vehicles
    const [currentInvoices, overdueInvoices, recentTickets, myAssignments, myVehicles] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          apartmentId: aptId,
          billingMonth: currentMonthKey,
          status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] },
        },
        select: {
          code: true,
          totalAmount: true,
          dueDate: true,
          status: true,
          billingMonth: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          apartmentId: aptId,
          status: InvoiceStatus.OVERDUE,
        },
        select: {
          code: true,
          totalAmount: true,
          dueDate: true,
          status: true,
        },
      }),
      prisma.feedback.findMany({
        where: {
          apartmentId: aptId,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          code: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.parkingAssignment.findMany({
        where: {
          residentId: resident.id,
          status: ParkingAssignmentStatus.ACTIVE,
        },
        include: {
          slot: {
            include: {
              area: true,
            },
          },
          vehicle: true,
        },
      }),
      prisma.vehicle.findMany({
        where: {
          residentId: resident.id,
        },
        include: {
          parkingCards: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    const formattedAssignments = myAssignments.map((a) => ({
      slotCode: a.slot.code,
      areaName: a.slot.area.name,
      floor: a.slot.floor,
      licensePlate: a.vehicle.licensePlate,
      vehicleBrand: a.vehicle.brand,
      vehicleModel: a.vehicle.model,
      startDate: a.startDate,
      endDate: a.endDate,
    }));

    const formattedVehicles = myVehicles.map((v) => ({
      licensePlate: v.licensePlate,
      brand: v.brand,
      model: v.model,
      type: v.type,
      status: v.status,
      cardCode: v.parkingCards[0]?.cardCode || null,
      cardStatus: v.parkingCards[0]?.status || null,
    }));

    return {
      userId,
      role: effectiveRole,
      hasApartment: true,
      apartmentCode: resident.apartment.code,
      apartmentBuilding: resident.apartment.building,
      apartmentFloor: resident.apartment.floor,
      residentName: resident.fullName,
      currentMonthInvoices: currentInvoices,
      overdueInvoices: overdueInvoices,
      facilities: formattedFacilities,
      recentTickets: recentTickets,
      parkingAvailability,
      myParkingAssignments: formattedAssignments,
      myVehicles: formattedVehicles,
    };
  }
}

export const aiSafeContextService = new AISafeContextService();
