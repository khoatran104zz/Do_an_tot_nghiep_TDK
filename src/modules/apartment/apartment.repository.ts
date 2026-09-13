import { prisma } from '@/lib/prisma';
import {
  ApartmentFilter,
  CreateApartmentDto,
  UpdateApartmentDto,
  CreateApartmentHistoryDto,
} from './apartment.types';
import { Prisma, ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';

export class ApartmentRepository {
  async findAll(filter: ApartmentFilter) {
    const {
      search,
      building,
      block,
      blockId,
      floor,
      floorNumber,
      status,
      page = 1,
      limit = 10,
    } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ApartmentWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
        { residents: { some: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (building) {
      where.building = building;
    }

    if (block) {
      where.OR = [
        ...(where.OR || []),
        { building: { contains: block, mode: 'insensitive' } },
        { block: { code: { contains: block, mode: 'insensitive' } } },
        { block: { name: { contains: block, mode: 'insensitive' } } },
      ];
    }

    if (blockId) {
      where.blockId = blockId;
    }

    const targetFloor = floorNumber !== undefined ? floorNumber : floor;
    if (targetFloor !== undefined && !isNaN(targetFloor)) {
      where.floor = targetFloor;
    }

    if (status) {
      where.status = status;
    }

    const [rawItems, total] = await Promise.all([
      prisma.apartment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ floor: 'asc' }, { code: 'asc' }],
        include: {
          residents: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              relationshipToOwner: true,
              status: true,
            },
          },
          invoices: {
            where: { status: { in: ['UNPAID', 'OVERDUE'] } },
            select: { id: true, code: true, totalAmount: true, status: true, dueDate: true },
          },
          feedbacks: {
            where: { status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] } },
            select: { id: true, code: true, title: true, status: true, priority: true },
          },
          block: {
            select: { id: true, code: true, name: true },
          },
          floorRef: {
            select: { id: true, floorNumber: true, name: true },
          },
          _count: { select: { residents: true, contracts: true, vehicles: true } },
        },
      }),
      prisma.apartment.count({ where }),
    ]);

    // Format and calculate enriched indicators for each apartment card
    const items = rawItems.map((apt) => {
      const owner =
        apt.residents.find((r) => r.relationshipToOwner === 'OWNER') ||
        apt.residents[0] ||
        null;
      const residingResidents = apt.residents.filter((r) => r.status === 'RESIDING');
      const totalDebt = apt.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

      return {
        ...apt,
        owner,
        residentsCount: residingResidents.length > 0 ? residingResidents.length : apt.residents.length,
        unpaidInvoicesCount: apt.invoices.length,
        totalDebt,
        openTicketsCount: apt.feedbacks.length,
        latestOpenTicket: apt.feedbacks[0] || null,
        isOverdue: apt.invoices.some((inv) => inv.status === 'OVERDUE'),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const apt = await prisma.apartment.findUnique({
      where: { id },
      include: {
        residents: {
          orderBy: { createdAt: 'asc' },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        feedbacks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        vehicles: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        block: true,
        floorRef: true,
        buildingRef: true,
      },
    });

    if (!apt) return null;

    const owner =
      apt.residents.find((r) => r.relationshipToOwner === 'OWNER') ||
      apt.residents[0] ||
      null;
    const unpaidInvoices = apt.invoices.filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE');
    const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const openTickets = apt.feedbacks.filter(
      (f) => f.status === 'NEW' || f.status === 'ASSIGNED' || f.status === 'PROCESSING'
    );

    return {
      ...apt,
      owner,
      residentsCount: apt.residents.filter((r) => r.status === 'RESIDING').length,
      unpaidInvoicesCount: unpaidInvoices.length,
      totalDebt,
      openTicketsCount: openTickets.length,
    };
  }

  async findByCode(code: string) {
    return prisma.apartment.findUnique({
      where: { code: code.trim() },
    });
  }

  async create(data: CreateApartmentDto) {
    return prisma.apartment.create({
      data: {
        ...data,
        code: data.code.trim().toUpperCase(),
      },
    });
  }

  async update(id: string, data: UpdateApartmentDto) {
    return prisma.apartment.update({
      where: { id },
      data: {
        ...data,
        ...(data.code && { code: data.code.trim().toUpperCase() }),
      },
    });
  }

  async delete(id: string) {
    return prisma.apartment.delete({
      where: { id },
    });
  }

  async getBuildings() {
    const result = await prisma.apartment.findMany({
      select: { building: true },
      distinct: ['building'],
      orderBy: { building: 'asc' },
    });
    return result.map((r) => r.building);
  }

  async getHierarchy() {
    // Make sure database has hierarchy structure initialized
    await this.bootstrapHierarchy();

    const buildings = await prisma.building.findMany({
      include: {
        blocks: {
          orderBy: { code: 'asc' },
          include: {
            floors: {
              orderBy: { floorNumber: 'asc' },
              include: {
                apartments: {
                  orderBy: { code: 'asc' },
                  include: {
                    residents: {
                      select: { id: true, fullName: true, phone: true, relationshipToOwner: true, status: true },
                    },
                    invoices: {
                      where: { status: { in: ['UNPAID', 'OVERDUE'] } },
                      select: { id: true, totalAmount: true, status: true },
                    },
                    feedbacks: {
                      where: { status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] } },
                      select: { id: true, status: true, priority: true, title: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return buildings;
  }

  async getHistory(apartmentId: string) {
    return prisma.apartmentHistory.findMany({
      where: { apartmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHistory(apartmentId: string, data: CreateApartmentHistoryDto) {
    return prisma.apartmentHistory.create({
      data: {
        apartmentId,
        event: data.event,
        title: data.title,
        description: data.description,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        residentId: data.residentId,
        residentName: data.residentName,
        performedBy: data.performedBy,
        metadata: data.metadata || Prisma.JsonNull,
      },
    });
  }

  async bootstrapHierarchy() {
    // 1. Ensure master building exists
    let defaultBuilding = await prisma.building.findFirst();
    if (!defaultBuilding) {
      defaultBuilding = await prisma.building.create({
        data: {
          code: 'SMART-CITY',
          name: 'Tổ hợp Chung cư SmartCity Landmark',
          address: 'Số 108 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          description: 'Khu phức hợp căn hộ thông minh cao cấp tích hợp IoT & BMS',
        },
      });
    }

    // 2. Fetch all apartments
    const apartments = await prisma.apartment.findMany();

    // Map each unique building name to a Block
    const blockCache: Record<string, any> = {};
    const floorCache: Record<string, any> = {};

    for (const apt of apartments) {
      const blockCode = apt.building.includes('A')
        ? 'BLOCK-A'
        : apt.building.includes('B')
        ? 'BLOCK-B'
        : 'BLOCK-C';

      const blockName = apt.building.includes('A')
        ? 'Tháp A (Sky Tower)'
        : apt.building.includes('B')
        ? 'Tháp B (Ocean Tower)'
        : 'Tháp C (Garden Tower)';

      let block = blockCache[blockCode];
      if (!block) {
        block = await prisma.block.upsert({
          where: {
            buildingId_code: {
              buildingId: defaultBuilding.id,
              code: blockCode,
            },
          },
          update: {},
          create: {
            buildingId: defaultBuilding.id,
            code: blockCode,
            name: blockName,
            totalFloors: 25,
          },
        });
        blockCache[blockCode] = block;
      }

      const floorKey = `${block.id}_${apt.floor}`;
      let floor = floorCache[floorKey];
      if (!floor) {
        floor = await prisma.floor.upsert({
          where: {
            blockId_floorNumber: {
              blockId: block.id,
              floorNumber: apt.floor,
            },
          },
          update: {},
          create: {
            blockId: block.id,
            floorNumber: apt.floor,
            name: `Tầng ${apt.floor.toString().padStart(2, '0')}`,
          },
        });
        floorCache[floorKey] = floor;
      }

      // If apartment not yet linked to hierarchy, update it
      if (!apt.blockId || !apt.floorId || !apt.buildingId) {
        await prisma.apartment.update({
          where: { id: apt.id },
          data: {
            buildingId: defaultBuilding.id,
            blockId: block.id,
            floorId: floor.id,
          },
        });
      }

      // Check if sample history exists, if not seed initial history
      const historyCount = await prisma.apartmentHistory.count({
        where: { apartmentId: apt.id },
      });

      if (historyCount === 0) {
        if (apt.status === ApartmentStatus.OCCUPIED) {
          await prisma.apartmentHistory.createMany({
            data: [
              {
                apartmentId: apt.id,
                event: ApartmentHistoryEvent.OWNER_TRANSFER,
                title: 'Bàn giao căn hộ cho chủ sở hữu',
                description: `Bàn giao chìa khóa và hồ sơ kỹ thuật căn hộ ${apt.code}`,
                performedBy: 'Ban Quản Lý Tòa Nhà',
                createdAt: new Date(Date.now() - 90 * 86400000),
              },
              {
                apartmentId: apt.id,
                event: ApartmentHistoryEvent.STATUS_CHANGE,
                title: 'Chuyển trạng thái sang Đang ở (OCCUPIED)',
                description: 'Cư dân hoàn tất thủ tục đăng ký tạm trú và dọn vào sinh sống',
                fromStatus: ApartmentStatus.VACANT,
                toStatus: ApartmentStatus.OCCUPIED,
                performedBy: 'Ban Quản Lý Tòa Nhà',
                createdAt: new Date(Date.now() - 60 * 86400000),
              },
            ],
          });
        } else if (apt.status === ApartmentStatus.UNDER_MAINTENANCE) {
          await prisma.apartmentHistory.create({
            data: {
              apartmentId: apt.id,
              event: ApartmentHistoryEvent.STATUS_CHANGE,
              title: 'Chuyển trạng thái sang Bảo dưỡng (UNDER_MAINTENANCE)',
              description: 'Bảo dưỡng và chống thấm theo kế hoạch kỹ thuật định kỳ',
              fromStatus: ApartmentStatus.OCCUPIED,
              toStatus: ApartmentStatus.UNDER_MAINTENANCE,
              performedBy: 'Kỹ thuật viên trưởng',
              createdAt: new Date(Date.now() - 5 * 86400000),
            },
          });
        } else {
          await prisma.apartmentHistory.create({
            data: {
              apartmentId: apt.id,
              event: ApartmentHistoryEvent.STATUS_CHANGE,
              title: 'Căn hộ sẵn sàng đón cư dân (VACANT)',
              description: 'Nghiệm thu hoàn thiện nội thất và sẵn sàng bàn giao',
              fromStatus: ApartmentStatus.UNDER_MAINTENANCE,
              toStatus: ApartmentStatus.VACANT,
              performedBy: 'Ban Quản Lý Tòa Nhà',
              createdAt: new Date(Date.now() - 30 * 86400000),
            },
          });
        }
      }
    }
  }
}

export const apartmentRepository = new ApartmentRepository();
