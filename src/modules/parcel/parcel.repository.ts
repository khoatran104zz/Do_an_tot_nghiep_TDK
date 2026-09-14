import { prisma } from '@/lib/prisma';
import { ParcelFilter, ReceiveParcelDto, ParcelWithRelations } from './parcel.types';
import { ParcelStatus, Prisma } from '@prisma/client';

export class ParcelRepository {
  async findAll(
    filter: ParcelFilter = {},
    scopedApartmentId?: string
  ): Promise<{ items: ParcelWithRelations[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ParcelDeliveryWhereInput = {};

    // IDOR Protection: resident scoped strictly to their own apartment
    if (scopedApartmentId) {
      where.apartmentId = scopedApartmentId;
    } else if (filter.apartmentId) {
      where.apartmentId = filter.apartmentId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.carrier) {
      where.carrier = { contains: filter.carrier, mode: 'insensitive' };
    }

    if (filter.search) {
      const search = filter.search.trim();
      where.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { recipientPhone: { contains: search, mode: 'insensitive' } },
        { pickupCode: { contains: search, mode: 'insensitive' } },
        { apartment: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (filter.startDate || filter.endDate) {
      where.receivedAt = {};
      if (filter.startDate) where.receivedAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.receivedAt.lte = new Date(filter.endDate);
    }

    const [total, items] = await Promise.all([
      prisma.parcelDelivery.count({ where }),
      prisma.parcelDelivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: {
          apartment: {
            select: { id: true, code: true, building: true, floor: true },
          },
          recipient: {
            select: { id: true, fullName: true, phone: true },
          },
          receivedBy: {
            select: { id: true, fullName: true },
          },
          collectedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
    ]);

    return {
      items: items as unknown as ParcelWithRelations[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<ParcelWithRelations | null> {
    const item = await prisma.parcelDelivery.findUnique({
      where: { id },
      include: {
        apartment: {
          select: { id: true, code: true, building: true, floor: true },
        },
        recipient: {
          select: { id: true, fullName: true, phone: true },
        },
        receivedBy: {
          select: { id: true, fullName: true },
        },
        collectedBy: {
          select: { id: true, fullName: true },
        },
      },
    });
    return item as unknown as ParcelWithRelations | null;
  }

  async findByPickupCode(pickupCode: string): Promise<ParcelWithRelations | null> {
    const item = await prisma.parcelDelivery.findFirst({
      where: {
        pickupCode: pickupCode.trim(),
        status: { in: [ParcelStatus.RECEIVED, ParcelStatus.NOTIFIED] },
      },
      include: {
        apartment: {
          select: { id: true, code: true, building: true, floor: true },
        },
        recipient: {
          select: { id: true, fullName: true, phone: true },
        },
        receivedBy: {
          select: { id: true, fullName: true },
        },
        collectedBy: {
          select: { id: true, fullName: true },
        },
      },
    });
    return item as unknown as ParcelWithRelations | null;
  }

  async isPickupCodeActive(code: string): Promise<boolean> {
    const count = await prisma.parcelDelivery.count({
      where: {
        pickupCode: code,
        status: { in: [ParcelStatus.RECEIVED, ParcelStatus.NOTIFIED] },
      },
    });
    return count > 0;
  }

  async create(data: ReceiveParcelDto & { pickupCode: string; receivedById?: string }): Promise<ParcelWithRelations> {
    const createData: Prisma.ParcelDeliveryCreateInput = {
      apartment: { connect: { id: data.apartmentId } },
      recipient: data.recipientId ? { connect: { id: data.recipientId } } : undefined,
      recipientName: data.recipientName.trim(),
      recipientPhone: data.recipientPhone?.trim() || null,
      carrier: data.carrier.trim(),
      trackingNumber: data.trackingNumber?.trim() || null,
      pickupCode: data.pickupCode,
      photoUrl: data.photoUrl || null,
      location: data.location?.trim() || null,
      note: data.note?.trim() || null,
      status: ParcelStatus.RECEIVED,
      receivedBy: data.receivedById ? { connect: { id: data.receivedById } } : undefined,
    };

    const item = await prisma.parcelDelivery.create({
      data: createData,
      include: {
        apartment: {
          select: { id: true, code: true, building: true, floor: true },
        },
        recipient: {
          select: { id: true, fullName: true, phone: true },
        },
        receivedBy: {
          select: { id: true, fullName: true },
        },
        collectedBy: {
          select: { id: true, fullName: true },
        },
      },
    });
    return item as unknown as ParcelWithRelations;
  }

  async update(id: string, data: Prisma.ParcelDeliveryUpdateInput): Promise<ParcelWithRelations> {
    const item = await prisma.parcelDelivery.update({
      where: { id },
      data,
      include: {
        apartment: {
          select: { id: true, code: true, building: true, floor: true },
        },
        recipient: {
          select: { id: true, fullName: true, phone: true },
        },
        receivedBy: {
          select: { id: true, fullName: true },
        },
        collectedBy: {
          select: { id: true, fullName: true },
        },
      },
    });
    return item as unknown as ParcelWithRelations;
  }

  async delete(id: string): Promise<void> {
    await prisma.parcelDelivery.delete({ where: { id } });
  }

  async getStats(scopedApartmentId?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const baseWhere: Prisma.ParcelDeliveryWhereInput = {};
    if (scopedApartmentId) baseWhere.apartmentId = scopedApartmentId;

    const [totalPending, receivedToday, collectedToday, overdueCount, totalMonthly] = await Promise.all([
      prisma.parcelDelivery.count({
        where: {
          ...baseWhere,
          status: { in: [ParcelStatus.RECEIVED, ParcelStatus.NOTIFIED] },
        },
      }),
      prisma.parcelDelivery.count({
        where: {
          ...baseWhere,
          receivedAt: { gte: startOfToday },
        },
      }),
      prisma.parcelDelivery.count({
        where: {
          ...baseWhere,
          status: ParcelStatus.COLLECTED,
          collectedAt: { gte: startOfToday },
        },
      }),
      prisma.parcelDelivery.count({
        where: {
          ...baseWhere,
          status: { in: [ParcelStatus.RECEIVED, ParcelStatus.NOTIFIED] },
          receivedAt: { lte: threeDaysAgo },
        },
      }),
      prisma.parcelDelivery.count({
        where: {
          ...baseWhere,
          receivedAt: { gte: startOfMonth },
        },
      }),
    ]);

    return {
      totalPending,
      receivedToday,
      collectedToday,
      overdueCount,
      totalMonthly,
    };
  }
}

export const parcelRepository = new ParcelRepository();
