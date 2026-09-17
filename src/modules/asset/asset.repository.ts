import { prisma } from '@/lib/prisma';
import {
  AssetFilter,
  CreateAssetDto,
  UpdateAssetDto,
  ScheduleFilter,
  CreateScheduleDto,
  UpdateScheduleDto,
  CompleteScheduleDto,
  AssetDashboardStats,
} from './asset.types';
import {
  AssetCategory,
  AssetStatus,
  MaintenanceCycle,
  MaintenanceStatus,
  Prisma,
  Role,
} from '@prisma/client';

export class AssetRepository {
  async generateAssetCode(category: AssetCategory): Promise<string> {
    const prefixMap: Record<AssetCategory, string> = {
      ELEVATOR: 'AST-ELEV-',
      WATER_PUMP: 'AST-PUMP-',
      FIRE_ALARM: 'AST-FIRE-',
      FIRE_EXTINGUISHER: 'AST-EXT-',
      GENERATOR: 'AST-GEN-',
      CCTV: 'AST-CCTV-',
      BARRIER: 'AST-BAR-',
      AIR_CONDITIONER: 'AST-HVAC-',
      ELECTRICAL_SYSTEM: 'AST-ELEC-',
      OTHER: 'AST-GEN-',
    };

    const prefix = prefixMap[category] || 'AST-DEV-';
    const count = await prisma.asset.count({
      where: { code: { startsWith: prefix } },
    });
    const padded = String(count + 1).padStart(3, '0');
    return `${prefix}${padded}`;
  }

  async generateScheduleCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.maintenanceSchedule.count();
    const padded = String(count + 1).padStart(3, '0');
    return `SCH-${year}-${padded}`;
  }

  async generateWorkOrderCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.workOrder.count();
    const padded = String(count + 1).padStart(3, '0');
    return `WO-${year}-${padded}`;
  }

  async findAssets(filter: AssetFilter, userRole?: string, userId?: string) {
    const { search, category, status, buildingId, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (buildingId) {
      where.buildingId = buildingId;
    } else if (filter.buildingIds && filter.buildingIds.length > 0) {
      where.buildingId = { in: filter.buildingIds };
    }

    // Technician Scoping: Only see assets with tasks assigned to them or in general operational pool
    if (userRole === Role.STAFF_TECHNICIAN && userId) {
      where.OR = [
        { schedules: { some: { technicianId: userId } } },
        { workOrders: { some: { technicianId: userId } } },
        { status: { in: [AssetStatus.OPERATIONAL, AssetStatus.MAINTENANCE, AssetStatus.BROKEN] } },
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
            { supplier: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          building: { select: { id: true, code: true, name: true } },
          schedules: {
            orderBy: { nextMaintenance: 'asc' },
            take: 1,
            include: {
              technician: { select: { id: true, fullName: true, phone: true } },
            },
          },
          _count: {
            select: {
              feedbacks: true,
              schedules: true,
              workOrders: true,
            },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAssetById(id: string) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        building: true,
        schedules: {
          orderBy: { nextMaintenance: 'asc' },
          include: {
            technician: {
              select: { id: true, fullName: true, email: true, phone: true, role: true },
            },
            workOrders: {
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
          },
        },
        workOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            technician: { select: { id: true, fullName: true } },
          },
        },
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          include: {
            resident: { select: { id: true, fullName: true, phone: true } },
            apartment: { select: { id: true, code: true, building: true } },
          },
        },
      },
    });
  }

  async createAsset(data: CreateAssetDto) {
    const code = data.code || (await this.generateAssetCode(data.category));
    return prisma.asset.create({
      data: {
        code,
        name: data.name,
        category: data.category,
        buildingId: data.buildingId || null,
        location: data.location,
        supplier: data.supplier || null,
        installDate: data.installDate ? new Date(data.installDate) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        status: data.status || AssetStatus.OPERATIONAL,
        description: data.description || null,
        documents: data.documents || [],
        images: data.images || [],
      },
      include: {
        building: true,
      },
    });
  }

  async updateAsset(id: string, data: UpdateAssetDto) {
    return prisma.asset.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.buildingId !== undefined ? { buildingId: data.buildingId } : {}),
        ...(data.location ? { location: data.location } : {}),
        ...(data.supplier !== undefined ? { supplier: data.supplier } : {}),
        ...(data.installDate !== undefined
          ? { installDate: data.installDate ? new Date(data.installDate) : null }
          : {}),
        ...(data.warrantyExpiry !== undefined
          ? { warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null }
          : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.documents ? { documents: data.documents } : {}),
        ...(data.images ? { images: data.images } : {}),
      },
      include: {
        building: true,
      },
    });
  }

  async findSchedules(filter: ScheduleFilter, userRole?: string, userId?: string) {
    const { search, assetId, technicianId, status, cycle, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceScheduleWhereInput = {};

    if (assetId) where.assetId = assetId;
    if (status) where.status = status;
    if (cycle) where.cycle = cycle;

    if (filter.buildingId) {
      where.asset = { buildingId: filter.buildingId };
    } else if (filter.buildingIds && filter.buildingIds.length > 0) {
      where.asset = { buildingId: { in: filter.buildingIds } };
    }

    // Technician Scoping
    if (userRole === Role.STAFF_TECHNICIAN && userId) {
      where.technicianId = userId;
    } else if (technicianId) {
      where.technicianId = technicianId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { asset: { name: { contains: search, mode: 'insensitive' } } },
        { asset: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.maintenanceSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nextMaintenance: 'asc' },
        include: {
          asset: {
            select: { id: true, code: true, name: true, category: true, location: true, status: true },
          },
          technician: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      }),
      prisma.maintenanceSchedule.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createSchedule(data: CreateScheduleDto) {
    const code = data.code || (await this.generateScheduleCode());
    return prisma.maintenanceSchedule.create({
      data: {
        code,
        assetId: data.assetId,
        title: data.title,
        cycle: data.cycle || MaintenanceCycle.MONTHLY,
        lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : null,
        nextMaintenance: new Date(data.nextMaintenance),
        vendor: data.vendor || null,
        technicianId: data.technicianId || null,
        status: MaintenanceStatus.PENDING,
        notes: data.notes || null,
      },
      include: {
        asset: true,
        technician: true,
      },
    });
  }

  async completeSchedule(
    scheduleId: string,
    data: CompleteScheduleDto,
    performerId?: string
  ) {
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
      include: { asset: true },
    });

    if (!schedule) {
      throw new Error('Lịch bảo trì không tồn tại');
    }

    const now = new Date();
    const woCode = await this.generateWorkOrderCode();

    // Calculate next maintenance based on cycle
    const nextDate = new Date(now);
    switch (schedule.cycle) {
      case MaintenanceCycle.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case MaintenanceCycle.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case MaintenanceCycle.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case MaintenanceCycle.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case MaintenanceCycle.SEMI_ANNUALLY:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case MaintenanceCycle.ANNUALLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    const [workOrder, updatedSchedule] = await prisma.$transaction([
      prisma.workOrder.create({
        data: {
          code: woCode,
          scheduleId: schedule.id,
          assetId: schedule.assetId,
          technicianId: performerId || schedule.technicianId,
          title: `Nghiệm thu: ${schedule.title}`,
          description: data.notes || schedule.notes,
          findings: data.findings || 'Đã hoàn tất bảo dưỡng định kỳ đạt tiêu chuẩn kỹ thuật',
          cost: data.cost || 0,
          status: MaintenanceStatus.COMPLETED,
          completedAt: now,
          images: data.images || [],
        },
      }),
      prisma.maintenanceSchedule.update({
        where: { id: scheduleId },
        data: {
          lastMaintenance: now,
          nextMaintenance: nextDate,
          status: MaintenanceStatus.COMPLETED,
        },
        include: {
          asset: true,
          technician: true,
        },
      }),
      // Set asset status to OPERATIONAL if it was under maintenance
      prisma.asset.update({
        where: { id: schedule.assetId },
        data: { status: AssetStatus.OPERATIONAL },
      }),
    ]);

    return { workOrder, schedule: updatedSchedule };
  }

  async getAssetDashboardStats(buildingIds?: string[]): Promise<AssetDashboardStats> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 3600 * 1000);

    const hasBuildingScope = buildingIds && buildingIds.length > 0;
    const assetBaseWhere: Prisma.AssetWhereInput = hasBuildingScope
      ? { buildingId: { in: buildingIds } }
      : {};
    const scheduleAssetFilter = hasBuildingScope
      ? { asset: { buildingId: { in: buildingIds } } }
      : {};

    const [
      totalAssets,
      operational,
      maintenance,
      broken,
      upcomingMaintenance,
      overdueMaintenance,
    ] = await Promise.all([
      prisma.asset.count({ where: assetBaseWhere }),
      prisma.asset.count({ where: { ...assetBaseWhere, status: AssetStatus.OPERATIONAL } }),
      prisma.asset.count({ where: { ...assetBaseWhere, status: AssetStatus.MAINTENANCE } }),
      prisma.asset.count({ where: { ...assetBaseWhere, status: AssetStatus.BROKEN } }),
      // Upcoming: nextMaintenance within 3 days and not completed
      prisma.maintenanceSchedule.count({
        where: {
          ...scheduleAssetFilter,
          status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS] },
          nextMaintenance: { gte: now, lte: threeDaysFromNow },
        },
      }),
      // Overdue: nextMaintenance past due and not completed
      prisma.maintenanceSchedule.count({
        where: {
          ...scheduleAssetFilter,
          OR: [
            { status: MaintenanceStatus.OVERDUE },
            {
              status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS] },
              nextMaintenance: { lt: now },
            },
          ],
        },
      }),
    ]);

    return {
      totalAssets,
      operationalCount: operational,
      maintenanceCount: maintenance,
      brokenCount: broken,
      upcomingMaintenanceCount: upcomingMaintenance,
      overdueMaintenanceCount: overdueMaintenance,
    };
  }
}

export const assetRepository = new AssetRepository();
