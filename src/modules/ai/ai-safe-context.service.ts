import { prisma } from '@/lib/prisma';
import { InvoiceStatus, Role } from '@prisma/client';

export interface SafeResidentContext {
  userId: string;
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
}

export class AISafeContextService {
  /**
   * Safe Context Retrieval Layer:
   * Isolate data exclusively to the authenticated resident's apartment.
   */
  async getSafeContextForUser(userId: string): Promise<SafeResidentContext> {
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

    // Baseline facilities data (Public to all residents)
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

    if (!resident || !resident.apartment) {
      return {
        userId,
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
