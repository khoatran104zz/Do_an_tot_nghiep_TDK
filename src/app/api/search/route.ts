import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getVerifiedResidentInfo } from '@/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return apiSuccess({
        apartments: [],
        residents: [],
        invoices: [],
        tickets: [],
      });
    }

    const isResident = session.user.role === 'RESIDENT';
    let residentApartmentId: string | null = null;
    let residentId: string | null = null;

    if (isResident) {
      const resInfo = await getVerifiedResidentInfo(session.user.id);
      residentApartmentId = resInfo?.apartmentId || null;
      residentId = resInfo?.id || null;
    }

    // 1. Search Apartments
    const apartmentWhere: any = {
      OR: [
        { code: { contains: q, mode: 'insensitive' } },
        { building: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (isResident && residentApartmentId) {
      apartmentWhere.id = residentApartmentId;
    }

    // 2. Search Residents
    const residentWhere: any = {
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (isResident) {
      if (residentApartmentId) {
        residentWhere.apartmentId = residentApartmentId;
      } else {
        residentWhere.id = residentId || 'non-existent';
      }
    }

    // 3. Search Invoices
    const invoiceWhere: any = {
      OR: [
        { code: { contains: q, mode: 'insensitive' } },
        { billingMonth: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (isResident) {
      if (residentApartmentId) {
        invoiceWhere.apartmentId = residentApartmentId;
      } else {
        invoiceWhere.apartmentId = 'non-existent';
      }
    }

    // 4. Search Tickets / Feedbacks
    const ticketWhere: any = {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (isResident) {
      ticketWhere.OR = [
        { residentId: residentId || 'non-existent' },
        ...(residentApartmentId ? [{ apartmentId: residentApartmentId }] : []),
      ];
    }

    const [apartments, residents, invoices, tickets] = await Promise.all([
      isResident && !residentApartmentId
        ? []
        : prisma.apartment.findMany({
            where: apartmentWhere,
            select: { id: true, code: true, building: true, floor: true, status: true },
            take: 4,
          }),
      isResident && !residentApartmentId && !residentId
        ? []
        : prisma.resident.findMany({
            where: residentWhere,
            select: {
              id: true,
              fullName: true,
              phone: true,
              apartment: { select: { code: true } },
            },
            take: 4,
          }),
      isResident && !residentApartmentId
        ? []
        : prisma.invoice.findMany({
            where: invoiceWhere,
            select: {
              id: true,
              code: true,
              billingMonth: true,
              totalAmount: true,
              status: true,
              apartment: { select: { code: true } },
            },
            take: 4,
          }),
      prisma.feedback.findMany({
        where: ticketWhere,
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          priority: true,
          apartment: { select: { code: true } },
        },
        take: 4,
      }),
    ]);

    return apiSuccess({
      apartments,
      residents,
      invoices,
      tickets,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi tìm kiếm', 'SEARCH_ERROR', 500);
  }
}
