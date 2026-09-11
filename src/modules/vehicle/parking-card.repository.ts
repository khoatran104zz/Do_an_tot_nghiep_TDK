import { prisma } from '@/lib/prisma';
import { ParkingCardStatus, Prisma } from '@prisma/client';
import { ParkingCardFilter } from './vehicle.types';

export class ParkingCardRepository {
  async findAll(filter: ParkingCardFilter) {
    const { search, vehicleId, apartmentId, status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ParkingCardWhereInput = {};

    if (search) {
      where.OR = [
        { cardCode: { contains: search, mode: 'insensitive' } },
        { vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (apartmentId) {
      where.vehicle = { apartmentId };
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.parkingCard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: {
            select: {
              id: true,
              licensePlate: true,
              type: true,
              brand: true,
              model: true,
              status: true,
              apartment: { select: { id: true, code: true, building: true } },
              resident: { select: { id: true, fullName: true, phone: true } },
            },
          },
        },
      }),
      prisma.parkingCard.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return prisma.parkingCard.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            apartment: { select: { id: true, code: true, building: true } },
            resident: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
    });
  }

  async findByCardCode(cardCode: string) {
    return prisma.parkingCard.findUnique({
      where: { cardCode: cardCode.trim().toUpperCase() },
      include: {
        vehicle: true,
      },
    });
  }

  async findActiveCardByVehicleId(vehicleId: string, excludeCardId?: string) {
    return prisma.parkingCard.findFirst({
      where: {
        vehicleId,
        status: ParkingCardStatus.ACTIVE,
        ...(excludeCardId && { id: { not: excludeCardId } }),
      },
    });
  }

  async create(data: {
    cardCode: string;
    vehicleId: string;
    status?: ParkingCardStatus;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
  }) {
    return prisma.parkingCard.create({
      data: {
        cardCode: data.cardCode.trim().toUpperCase(),
        vehicleId: data.vehicleId,
        status: data.status || ParkingCardStatus.ACTIVE,
        issuedAt: data.issuedAt || new Date(),
        expiresAt: data.expiresAt || null,
      },
      include: {
        vehicle: {
          include: {
            apartment: { select: { id: true, code: true } },
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      status?: ParkingCardStatus;
      expiresAt?: Date | null;
      lockedAt?: Date | null;
      lockReason?: string | null;
    }
  ) {
    return prisma.parkingCard.update({
      where: { id },
      data,
      include: {
        vehicle: {
          include: {
            apartment: { select: { id: true, code: true } },
          },
        },
      },
    });
  }

  async lockAllActiveByVehicleId(vehicleId: string, lockReason: string) {
    return prisma.parkingCard.updateMany({
      where: {
        vehicleId,
        status: ParkingCardStatus.ACTIVE,
      },
      data: {
        status: ParkingCardStatus.LOCKED,
        lockedAt: new Date(),
        lockReason,
      },
    });
  }

  async delete(id: string) {
    return prisma.parkingCard.delete({
      where: { id },
    });
  }
}

export const parkingCardRepository = new ParkingCardRepository();
