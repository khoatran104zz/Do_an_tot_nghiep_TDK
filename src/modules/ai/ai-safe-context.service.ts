import { prisma } from '@/lib/prisma';
import { InvoiceStatus, Role } from '@prisma/client';

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
        receptionistStats: {
          waitingParcelsCount: waitingParcels,
          todayVisitorsCount: todayVisitors,
        },
      };
    }

    // 6. RESIDENT (Default): Isolated apartment-specific context
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
      };
    }

    const aptId = resident.apartment.id;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get current month unpaid/pending invoices ONLY for this apartment
    const [currentInvoices, overdueInvoices, recentTickets] = await Promise.all([
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
    ]);

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
    };
  }
}

export const aiSafeContextService = new AISafeContextService();
