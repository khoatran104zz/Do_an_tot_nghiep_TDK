import { prisma } from '@/lib/prisma';
import { Prisma, VehicleStatus } from '@prisma/client';
import { VehicleFilter, CreateVehicleDto, UpdateVehicleDto } from './vehicle.types';
import { normalizeLicensePlate } from './vehicle.schema';

export class VehicleRepository {
  async findAll(filter: VehicleFilter) {
    const { search, building, buildingId, buildingIds, apartmentId, residentId, type, status, parkingCardStatus, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const andClauses: Prisma.VehicleWhereInput[] = [];

    if (search) {
      andClauses.push({
        OR: [
          { licensePlate: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { apartment: { is: { code: { contains: search, mode: 'insensitive' } } } },
          { resident: { is: { fullName: { contains: search, mode: 'insensitive' } } } },
        ],
      });
    }

    if (buildingIds && buildingIds.length > 0) {
      andClauses.push({
        apartment: {
          is: {
            OR: [
              { buildingId: { in: buildingIds } },
              { block: { buildingId: { in: buildingIds } } },
            ],
          },
        },
      });
    } else if (buildingId) {
      andClauses.push({
        apartment: {
          is: {
            OR: [
              { buildingId },
              { block: { buildingId } },
            ],
          },
        },
      });
    } else if (building) {
      andClauses.push({
        apartment: {
          is: { building },
        },
      });
    }

    if (apartmentId) {
      andClauses.push({ apartmentId });
    }

    if (residentId) {
      andClauses.push({ residentId });
    }

    if (type) {
      andClauses.push({ type });
    }

    if (status) {
      andClauses.push({ status });
    }

    if (parkingCardStatus) {
      andClauses.push({ parkingCards: { some: { status: parkingCardStatus } } });
    }

    const where: Prisma.VehicleWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: { select: { id: true, code: true, building: true, floor: true } },
          resident: { select: { id: true, fullName: true, phone: true, email: true } },
          parkingCards: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.vehicle.count({ where }),
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
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        apartment: { select: { id: true, code: true, building: true, floor: true } },
        resident: { select: { id: true, fullName: true, phone: true, email: true } },
        parkingCards: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByPlate(licensePlate: string) {
    return prisma.vehicle.findUnique({
      where: { licensePlate: licensePlate.trim() },
    });
  }

  /**
   * Find vehicle matching normalized plate string to avoid duplicate plate variations.
   */
  async findByNormalizedPlate(licensePlate: string, excludeId?: string) {
    const targetNormalized = normalizeLicensePlate(licensePlate);
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, licensePlate: true, status: true },
    });

    return vehicles.find(
      (v) => (!excludeId || v.id !== excludeId) && normalizeLicensePlate(v.licensePlate) === targetNormalized
    );
  }

  async create(data: CreateVehicleDto & { apartmentId: string }) {
    return prisma.vehicle.create({
      data: {
        licensePlate: data.licensePlate.trim().toUpperCase(),
        type: data.type,
        brand: data.brand.trim(),
        model: data.model ? data.model.trim() : null,
        color: data.color ? data.color.trim() : null,
        apartmentId: data.apartmentId,
        residentId: data.residentId || null,
        status: data.status || VehicleStatus.PENDING_APPROVAL,
        registrationDocumentUrl: data.registrationDocumentUrl || null,
      },
      include: {
        apartment: { select: { id: true, code: true, building: true, floor: true } },
        resident: { select: { id: true, fullName: true, phone: true } },
        parkingCards: true,
      },
    });
  }

  async update(id: string, data: UpdateVehicleDto & { status?: VehicleStatus }) {
    return prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.licensePlate && { licensePlate: data.licensePlate.trim().toUpperCase() }),
        ...(data.type && { type: data.type }),
        ...(data.brand && { brand: data.brand.trim() }),
        ...(data.model !== undefined && { model: data.model ? data.model.trim() : null }),
        ...(data.color !== undefined && { color: data.color ? data.color.trim() : null }),
        ...(data.registrationDocumentUrl !== undefined && {
          registrationDocumentUrl: data.registrationDocumentUrl || null,
        }),
        ...(data.apartmentId && { apartmentId: data.apartmentId }),
        ...(data.residentId !== undefined && { residentId: data.residentId || null }),
        ...(data.status && { status: data.status }),
      },
      include: {
        apartment: { select: { id: true, code: true, building: true, floor: true } },
        resident: { select: { id: true, fullName: true, phone: true } },
        parkingCards: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.vehicle.delete({
      where: { id },
    });
  }
}

export const vehicleRepository = new VehicleRepository();
