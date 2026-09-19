import { prisma } from '@/lib/prisma';
import {
  ParkingAreaFilter,
  ParkingSlotFilter,
  ParkingRequestFilter,
  ParkingAccessLogFilter,
  OccupancyMetrics,
} from './parking.types';
import {
  Prisma,
  ParkingSlotStatus,
  ParkingRequestStatus,
  ParkingAssignmentStatus,
  SlotVehicleType,
} from '@prisma/client';

export class ParkingRepository {
  // --------------------------------------------------------------------------
  // PARKING AREAS
  // --------------------------------------------------------------------------
  async findAreas(filter: ParkingAreaFilter = {}) {
    const where: Prisma.ParkingAreaWhereInput = {};

    if (filter.buildingId) {
      where.buildingId = filter.buildingId;
    }
    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return prisma.parkingArea.findMany({
      where,
      include: {
        building: { select: { id: true, code: true, name: true } },
        zones: {
          orderBy: { code: 'asc' },
          include: {
            _count: { select: { slots: true } },
          },
        },
        _count: {
          select: {
            slots: true,
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { code: 'asc' }],
    });
  }

  async findAreaById(id: string) {
    return prisma.parkingArea.findUnique({
      where: { id },
      include: {
        building: true,
        zones: {
          include: {
            slots: {
              orderBy: { code: 'asc' },
              include: {
                assignments: {
                  where: { status: ParkingAssignmentStatus.ACTIVE },
                  take: 1,
                  include: {
                    vehicle: true,
                    resident: true,
                    apartment: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAreaByCode(buildingId: string, code: string) {
    return prisma.parkingArea.findUnique({
      where: {
        buildingId_code: {
          buildingId,
          code,
        },
      },
    });
  }

  async createArea(data: Prisma.ParkingAreaCreateInput) {
    return prisma.parkingArea.create({
      data,
      include: { building: true },
    });
  }

  async updateArea(id: string, data: Prisma.ParkingAreaUpdateInput) {
    return prisma.parkingArea.update({
      where: { id },
      data,
      include: { building: true },
    });
  }

  async deleteArea(id: string) {
    return prisma.parkingArea.delete({ where: { id } });
  }

  // --------------------------------------------------------------------------
  // PARKING ZONES
  // --------------------------------------------------------------------------
  async findZones(areaId: string) {
    return prisma.parkingZone.findMany({
      where: { areaId },
      include: {
        area: true,
        _count: { select: { slots: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findZoneById(id: string) {
    return prisma.parkingZone.findUnique({
      where: { id },
      include: {
        area: { include: { building: true } },
      },
    });
  }

  async createZone(data: Prisma.ParkingZoneCreateInput) {
    return prisma.parkingZone.create({
      data,
      include: { area: true },
    });
  }

  async updateZone(id: string, data: Prisma.ParkingZoneUpdateInput) {
    return prisma.parkingZone.update({
      where: { id },
      data,
      include: { area: true },
    });
  }

  // --------------------------------------------------------------------------
  // PARKING SLOTS
  // --------------------------------------------------------------------------
  async findSlots(filter: ParkingSlotFilter = {}) {
    const where: Prisma.ParkingSlotWhereInput = {};

    if (filter.buildingId) {
      where.area = { buildingId: filter.buildingId };
    }
    if (filter.areaId) {
      where.areaId = filter.areaId;
    }
    if (filter.zoneId) {
      where.zoneId = filter.zoneId;
    }
    if (filter.floor !== undefined) {
      where.floor = filter.floor;
    }
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.search) {
      where.code = { contains: filter.search, mode: 'insensitive' };
    }

    const page = filter.page || 1;
    const limit = filter.limit || 100;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.parkingSlot.count({ where }),
      prisma.parkingSlot.findMany({
        where,
        include: {
          area: { select: { id: true, code: true, name: true, buildingId: true } },
          zone: { select: { id: true, code: true, name: true, colorHex: true } },
          assignments: {
            where: { status: ParkingAssignmentStatus.ACTIVE },
            take: 1,
            include: {
              vehicle: {
                select: {
                  id: true,
                  licensePlate: true,
                  brand: true,
                  model: true,
                  color: true,
                  type: true,
                },
              },
              resident: { select: { id: true, fullName: true, phone: true } },
              apartment: { select: { id: true, code: true } },
            },
          },
        },
        orderBy: [{ floor: 'asc' }, { code: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSlotById(id: string) {
    return prisma.parkingSlot.findUnique({
      where: { id },
      include: {
        area: { include: { building: true } },
        zone: true,
        assignments: {
          where: { status: ParkingAssignmentStatus.ACTIVE },
          take: 1,
          include: {
            vehicle: true,
            resident: true,
            apartment: true,
          },
        },
      },
    });
  }

  async findSlotByCode(areaId: string, code: string) {
    return prisma.parkingSlot.findUnique({
      where: {
        areaId_code: {
          areaId,
          code,
        },
      },
    });
  }

  async createSlot(data: Prisma.ParkingSlotCreateInput) {
    return prisma.parkingSlot.create({
      data,
      include: {
        area: true,
        zone: true,
      },
    });
  }

  async updateSlot(id: string, data: Prisma.ParkingSlotUpdateInput) {
    return prisma.parkingSlot.update({
      where: { id },
      data,
      include: {
        area: true,
        zone: true,
      },
    });
  }

  async updateSlotStatus(id: string, status: ParkingSlotStatus) {
    return prisma.parkingSlot.update({
      where: { id },
      data: { status },
    });
  }

  async deleteSlot(id: string) {
    return prisma.parkingSlot.delete({ where: { id } });
  }

  // --------------------------------------------------------------------------
  // PARKING REGISTRATION REQUESTS
  // --------------------------------------------------------------------------
  async findRequests(filter: ParkingRequestFilter = {}) {
    const where: Prisma.ParkingRegistrationRequestWhereInput = {};

    if (filter.buildingId) {
      where.apartment = { buildingId: filter.buildingId };
    }
    if (filter.residentId) {
      where.residentId = filter.residentId;
    }
    if (filter.apartmentId) {
      where.apartmentId = filter.apartmentId;
    }
    if (filter.vehicleId) {
      where.vehicleId = filter.vehicleId;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.search) {
      where.OR = [
        { requestCode: { contains: filter.search, mode: 'insensitive' } },
        { vehicle: { licensePlate: { contains: filter.search, mode: 'insensitive' } } },
        { resident: { fullName: { contains: filter.search, mode: 'insensitive' } } },
        { apartment: { code: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.parkingRegistrationRequest.count({ where }),
      prisma.parkingRegistrationRequest.findMany({
        where,
        include: {
          resident: { select: { id: true, fullName: true, phone: true, email: true } },
          apartment: { select: { id: true, code: true, building: true } },
          vehicle: true,
          preferredArea: true,
          preferredZone: true,
          slot: {
            include: {
              area: true,
              zone: true,
            },
          },
          reviewer: { select: { id: true, fullName: true } },
          assignment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRequestById(id: string) {
    return prisma.parkingRegistrationRequest.findUnique({
      where: { id },
      include: {
        resident: true,
        apartment: { include: { buildingRef: true } },
        vehicle: true,
        preferredArea: true,
        preferredZone: true,
        slot: {
          include: {
            area: true,
            zone: true,
          },
        },
        reviewer: true,
        assignment: true,
      },
    });
  }

  async findActiveRequestByVehicle(vehicleId: string) {
    return prisma.parkingRegistrationRequest.findFirst({
      where: {
        vehicleId,
        status: ParkingRequestStatus.PENDING,
      },
    });
  }

  async createRequest(data: Prisma.ParkingRegistrationRequestCreateInput) {
    return prisma.parkingRegistrationRequest.create({
      data,
      include: {
        resident: true,
        apartment: true,
        vehicle: true,
        preferredArea: true,
        preferredZone: true,
        slot: true,
      },
    });
  }

  async updateRequest(id: string, data: Prisma.ParkingRegistrationRequestUpdateInput) {
    return prisma.parkingRegistrationRequest.update({
      where: { id },
      data,
      include: {
        resident: true,
        apartment: true,
        vehicle: true,
        slot: true,
        assignment: true,
      },
    });
  }

  // --------------------------------------------------------------------------
  // PARKING ASSIGNMENTS
  // --------------------------------------------------------------------------
  async findAssignments(whereInput: Prisma.ParkingAssignmentWhereInput = {}) {
    return prisma.parkingAssignment.findMany({
      where: whereInput,
      include: {
        slot: {
          include: {
            area: true,
            zone: true,
          },
        },
        vehicle: true,
        resident: true,
        apartment: true,
        assignedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAssignmentById(id: string) {
    return prisma.parkingAssignment.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            area: { include: { building: true } },
            zone: true,
          },
        },
        vehicle: true,
        resident: true,
        apartment: true,
        assignedBy: true,
      },
    });
  }

  async findActiveAssignmentByVehicle(vehicleId: string) {
    return prisma.parkingAssignment.findFirst({
      where: {
        vehicleId,
        status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
      },
      include: {
        slot: {
          include: {
            area: true,
            zone: true,
          },
        },
        vehicle: true,
        resident: true,
        apartment: true,
      },
    });
  }

  async findActiveAssignmentBySlot(slotId: string) {
    return prisma.parkingAssignment.findFirst({
      where: {
        slotId,
        status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
      },
      include: {
        vehicle: true,
        resident: true,
        apartment: true,
      },
    });
  }

  async findByQrToken(qrToken: string) {
    return prisma.parkingAssignment.findUnique({
      where: { qrToken },
      include: {
        slot: {
          include: {
            area: { include: { building: true } },
            zone: true,
          },
        },
        vehicle: true,
        resident: true,
        apartment: true,
      },
    });
  }

  async findByLicensePlate(licensePlate: string) {
    return prisma.parkingAssignment.findFirst({
      where: {
        vehicle: {
          licensePlate: { equals: licensePlate, mode: 'insensitive' },
        },
        status: { in: [ParkingAssignmentStatus.ACTIVE, ParkingAssignmentStatus.EXPIRING_SOON] },
      },
      include: {
        slot: {
          include: {
            area: { include: { building: true } },
            zone: true,
          },
        },
        vehicle: true,
        resident: true,
        apartment: true,
      },
    });
  }

  async createAssignment(data: Prisma.ParkingAssignmentCreateInput) {
    return prisma.parkingAssignment.create({
      data,
      include: {
        slot: {
          include: {
            area: true,
            zone: true,
          },
        },
        vehicle: true,
        resident: true,
        apartment: true,
      },
    });
  }

  async updateAssignment(id: string, data: Prisma.ParkingAssignmentUpdateInput) {
    return prisma.parkingAssignment.update({
      where: { id },
      data,
      include: {
        slot: true,
        vehicle: true,
      },
    });
  }

  // --------------------------------------------------------------------------
  // ACCESS LOGS
  // --------------------------------------------------------------------------
  async findAccessLogs(filter: ParkingAccessLogFilter = {}) {
    const where: Prisma.ParkingAccessLogWhereInput = {};

    if (filter.buildingId) {
      where.slot = { area: { buildingId: filter.buildingId } };
    }
    if (filter.licensePlate) {
      where.licensePlate = { contains: filter.licensePlate, mode: 'insensitive' };
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.direction) {
      where.direction = filter.direction;
    }
    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = new Date(filter.startDate);
      if (filter.endDate) where.timestamp.lte = new Date(filter.endDate);
    }
    if (filter.search) {
      where.OR = [
        { licensePlate: { contains: filter.search, mode: 'insensitive' } },
        { cardCode: { contains: filter.search, mode: 'insensitive' } },
        { gateName: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.parkingAccessLog.count({ where }),
      prisma.parkingAccessLog.findMany({
        where,
        include: {
          slot: {
            include: {
              area: true,
              zone: true,
            },
          },
          vehicle: {
            include: {
              apartment: true,
              resident: true,
            },
          },
          operator: { select: { id: true, fullName: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createAccessLog(data: Prisma.ParkingAccessLogCreateInput) {
    return prisma.parkingAccessLog.create({
      data,
      include: {
        slot: true,
        vehicle: true,
        operator: true,
      },
    });
  }

  // --------------------------------------------------------------------------
  // OCCUPANCY CALCULATIONS (BACKEND SOURCE OF TRUTH)
  // --------------------------------------------------------------------------
  async calculateAreaOccupancy(areaId: string): Promise<OccupancyMetrics> {
    const slots = await prisma.parkingSlot.findMany({
      where: { areaId, isActive: true },
      select: { status: true },
    });

    const total = slots.length;
    const occupied = slots.filter((s) => s.status === ParkingSlotStatus.OCCUPIED).length;
    const reserved = slots.filter((s) => s.status === ParkingSlotStatus.RESERVED).length;
    const maintenance = slots.filter((s) => s.status === ParkingSlotStatus.MAINTENANCE).length;
    const blocked = slots.filter((s) => s.status === ParkingSlotStatus.BLOCKED).length;
    const available = Math.max(0, total - occupied - reserved - maintenance - blocked);
    const occupancyRate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      blocked,
      occupancyRate,
    };
  }

  async calculateBuildingOccupancy(buildingId?: string): Promise<OccupancyMetrics> {
    const where: Prisma.ParkingSlotWhereInput = { isActive: true };
    if (buildingId) {
      where.area = { buildingId };
    }

    const slots = await prisma.parkingSlot.findMany({
      where,
      select: { status: true },
    });

    const total = slots.length;
    const occupied = slots.filter((s) => s.status === ParkingSlotStatus.OCCUPIED).length;
    const reserved = slots.filter((s) => s.status === ParkingSlotStatus.RESERVED).length;
    const maintenance = slots.filter((s) => s.status === ParkingSlotStatus.MAINTENANCE).length;
    const blocked = slots.filter((s) => s.status === ParkingSlotStatus.BLOCKED).length;
    const available = Math.max(0, total - occupied - reserved - maintenance - blocked);
    const occupancyRate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

    return {
      total,
      available,
      occupied,
      reserved,
      maintenance,
      blocked,
      occupancyRate,
    };
  }
}

export const parkingRepository = new ParkingRepository();
