import { prisma } from '@/lib/prisma';
import {
  ApartmentFilter,
  CreateApartmentDto,
  UpdateApartmentDto,
  CreateApartmentHistoryDto,
  CreateBuildingDto,
  UpdateBuildingDto,
  CreateBlockDto,
  UpdateBlockDto,
  CreateFloorDto,
  UpdateFloorDto,
} from './apartment.types';
import { Prisma, ApartmentStatus, ApartmentHistoryEvent } from '@prisma/client';

export class ApartmentRepository {
  async findAll(filter: ApartmentFilter) {
    const {
      search,
      building,
      buildingId,
      block,
      blockId,
      floor,
      floorId,
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

    if (buildingId) {
      where.buildingId = buildingId;
    } else if (building) {
      where.building = building;
    }

    if (blockId) {
      where.blockId = blockId;
    } else if (block) {
      where.OR = [
        ...(where.OR || []),
        { building: { contains: block, mode: 'insensitive' } },
        { block: { code: { contains: block, mode: 'insensitive' } } },
        { block: { name: { contains: block, mode: 'insensitive' } } },
      ];
    }

    if (floorId) {
      where.floorId = floorId;
    } else {
      const targetFloor = floorNumber !== undefined ? floorNumber : floor;
      if (targetFloor !== undefined && !isNaN(targetFloor)) {
        where.floor = targetFloor;
      }
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
          buildingRef: {
            select: { id: true, code: true, name: true },
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
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        feedbacks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        vehicles: true,
        visitorPasses: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        parcels: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 30,
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
    let buildingName = data.building;
    let floorNumber = data.floor;
    let buildingId = data.buildingId;
    let blockId = data.blockId;
    let floorId = data.floorId;

    // Resolve hierarchy links if floorId is specified
    if (floorId) {
      const floorRecord = await prisma.floor.findUnique({
        where: { id: floorId },
        include: { block: true },
      });
      if (floorRecord) {
        floorNumber = floorRecord.floorNumber;
        blockId = floorRecord.blockId;
        buildingId = floorRecord.block.buildingId;
        if (!buildingName) {
          buildingName = floorRecord.block.name;
        }
      }
    }

    return prisma.apartment.create({
      data: {
        code: data.code.trim().toUpperCase(),
        building: buildingName || 'Tòa A',
        floor: floorNumber !== undefined ? floorNumber : 1,
        bedrooms: data.bedrooms || 2,
        bathrooms: data.bathrooms || 2,
        area: data.area,
        status: data.status || ApartmentStatus.VACANT,
        note: data.note || null,
        buildingId: buildingId || null,
        blockId: blockId || null,
        floorId: floorId || null,
      },
    });
  }

  async update(id: string, data: UpdateApartmentDto) {
    let resolvedBuilding = data.building;
    let resolvedFloor = data.floor;
    let resolvedBuildingId = data.buildingId;
    let resolvedBlockId = data.blockId;
    let resolvedFloorId = data.floorId;

    if (data.floorId) {
      const floorRecord = await prisma.floor.findUnique({
        where: { id: data.floorId },
        include: { block: true },
      });
      if (floorRecord) {
        resolvedFloor = floorRecord.floorNumber;
        resolvedBlockId = floorRecord.blockId;
        resolvedBuildingId = floorRecord.block.buildingId;
        if (!resolvedBuilding) {
          resolvedBuilding = floorRecord.block.name;
        }
      }
    }

    return prisma.apartment.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.trim().toUpperCase() }),
        ...(resolvedBuilding !== undefined && { building: resolvedBuilding }),
        ...(resolvedFloor !== undefined && { floor: resolvedFloor }),
        ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
        ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.note !== undefined && { note: data.note }),
        ...(resolvedBuildingId !== undefined && { buildingId: resolvedBuildingId }),
        ...(resolvedBlockId !== undefined && { blockId: resolvedBlockId }),
        ...(resolvedFloorId !== undefined && { floorId: resolvedFloorId }),
      },
    });
  }

  async delete(id: string) {
    return prisma.apartment.delete({
      where: { id },
    });
  }

  // --- Building Methods ---
  async findBuildings() {
    return prisma.building.findMany({
      orderBy: { name: 'asc' },
      include: {
        blocks: {
          orderBy: { code: 'asc' },
          include: {
            _count: { select: { floors: true, apartments: true } },
          },
        },
        _count: { select: { blocks: true, apartments: true } },
      },
    });
  }

  async findBuildingById(id: string) {
    return prisma.building.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { code: 'asc' },
          include: {
            floors: {
              orderBy: { floorNumber: 'asc' },
              include: {
                _count: { select: { apartments: true } },
              },
            },
            _count: { select: { floors: true, apartments: true } },
          },
        },
        _count: { select: { blocks: true, apartments: true } },
      },
    });
  }

  async createBuilding(data: CreateBuildingDto) {
    return prisma.building.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        address: data.address?.trim() || null,
        description: data.description?.trim() || null,
      },
    });
  }

  async updateBuilding(id: string, data: UpdateBuildingDto) {
    return prisma.building.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.trim().toUpperCase() }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.address !== undefined && { address: data.address?.trim() || null }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });
  }

  async deleteBuilding(id: string) {
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        _count: { select: { blocks: true, apartments: true } },
      },
    });
    if (!building) throw new Error('Không tìm thấy tòa nhà để xóa');
    if (building._count.blocks > 0 || building._count.apartments > 0) {
      throw new Error('Không thể xóa tòa nhà khi vẫn còn các khối tháp hoặc căn hộ trực thuộc!');
    }
    return prisma.building.delete({ where: { id } });
  }

  // --- Block Methods ---
  async findBlocks(buildingId?: string) {
    const where: Prisma.BlockWhereInput = {};
    if (buildingId) where.buildingId = buildingId;
    return prisma.block.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        building: { select: { id: true, code: true, name: true } },
        floors: {
          orderBy: { floorNumber: 'asc' },
          include: {
            _count: { select: { apartments: true } },
          },
        },
        _count: { select: { floors: true, apartments: true } },
      },
    });
  }

  async findBlockById(id: string) {
    return prisma.block.findUnique({
      where: { id },
      include: {
        building: true,
        floors: {
          orderBy: { floorNumber: 'asc' },
          include: {
            _count: { select: { apartments: true } },
          },
        },
        _count: { select: { floors: true, apartments: true } },
      },
    });
  }

  async createBlock(data: CreateBlockDto) {
    return prisma.block.create({
      data: {
        buildingId: data.buildingId,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        totalFloors: data.totalFloors || 25,
      },
    });
  }

  async updateBlock(id: string, data: UpdateBlockDto) {
    return prisma.block.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.trim().toUpperCase() }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.totalFloors !== undefined && { totalFloors: data.totalFloors }),
      },
    });
  }

  async deleteBlock(id: string) {
    const block = await prisma.block.findUnique({
      where: { id },
      include: {
        _count: { select: { floors: true, apartments: true } },
      },
    });
    if (!block) throw new Error('Không tìm thấy khối tháp');
    if (block._count.floors > 0 || block._count.apartments > 0) {
      throw new Error('Không thể xóa khối tháp khi vẫn còn tầng hoặc căn hộ!');
    }
    return prisma.block.delete({ where: { id } });
  }

  // --- Floor Methods ---
  async findFloors(blockId?: string) {
    const where: Prisma.FloorWhereInput = {};
    if (blockId) where.blockId = blockId;
    return prisma.floor.findMany({
      where,
      orderBy: { floorNumber: 'asc' },
      include: {
        block: {
          include: {
            building: { select: { id: true, code: true, name: true } },
          },
        },
        _count: { select: { apartments: true } },
      },
    });
  }

  async findFloorById(id: string) {
    return prisma.floor.findUnique({
      where: { id },
      include: {
        block: {
          include: {
            building: true,
          },
        },
        apartments: {
          orderBy: { code: 'asc' },
          include: {
            residents: {
              select: { id: true, fullName: true, phone: true, status: true, relationshipToOwner: true },
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
        _count: { select: { apartments: true } },
      },
    });
  }

  async createFloor(data: CreateFloorDto) {
    return prisma.floor.create({
      data: {
        blockId: data.blockId,
        floorNumber: data.floorNumber,
        name: data.name.trim(),
      },
    });
  }

  async updateFloor(id: string, data: UpdateFloorDto) {
    return prisma.floor.update({
      where: { id },
      data: {
        ...(data.floorNumber !== undefined && { floorNumber: data.floorNumber }),
        ...(data.name && { name: data.name.trim() }),
      },
    });
  }

  async deleteFloor(id: string) {
    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        _count: { select: { apartments: true } },
      },
    });
    if (!floor) throw new Error('Không tìm thấy tầng');
    if (floor._count.apartments > 0) {
      throw new Error('Không thể xóa tầng khi vẫn còn căn hộ trực thuộc!');
    }
    return prisma.floor.delete({ where: { id } });
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
    // Pure Read-only query
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

    if (buildings.length > 0) {
      return buildings;
    }

    // Fallback: If DB hierarchy is empty, initialize once safely
    await this.bootstrapHierarchy();
    return prisma.building.findMany({
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
    try {
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
      const towerConfigs = [
        { code: 'BLOCK-A', name: 'Tháp A (Sky Tower)', totalFloors: 15 },
        { code: 'BLOCK-B', name: 'Tháp B (Ocean Tower)', totalFloors: 25 },
        { code: 'BLOCK-C', name: 'Tháp C (Garden Tower)', totalFloors: 10 },
      ];

      const blockCache: Record<string, any> = {};
      const floorCache: Record<string, any> = {};

      for (const t of towerConfigs) {
        const block = await prisma.block.upsert({
          where: {
            buildingId_code: {
              buildingId: defaultBuilding.id,
              code: t.code,
            },
          },
          update: {
            name: t.name,
            totalFloors: t.totalFloors,
          },
          create: {
            buildingId: defaultBuilding.id,
            code: t.code,
            name: t.name,
            totalFloors: t.totalFloors,
          },
        });
        blockCache[t.code] = block;

        // Ensure all floors 1 to totalFloors exist
        for (let f = 1; f <= t.totalFloors; f++) {
          const floor = await prisma.floor.upsert({
            where: {
              blockId_floorNumber: {
                blockId: block.id,
                floorNumber: f,
              },
            },
            update: {},
            create: {
              blockId: block.id,
              floorNumber: f,
              name: `Tầng ${f.toString().padStart(2, '0')}`,
            },
          });
          floorCache[`${block.id}_${f}`] = floor;
        }
      }

      for (const apt of apartments) {
        const blockCode = apt.building.includes('A')
          ? 'BLOCK-A'
          : apt.building.includes('B')
          ? 'BLOCK-B'
          : 'BLOCK-C';

        let block = blockCache[blockCode];
        if (!block) {
          block = blockCache['BLOCK-A'];
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

        // If apartment not yet linked to hierarchy, update it safely
        if (!apt.blockId || !apt.floorId || !apt.buildingId) {
          try {
            await prisma.apartment.update({
              where: { id: apt.id },
              data: {
                buildingId: defaultBuilding.id,
                blockId: block.id,
                floorId: floor.id,
              },
            });
          } catch {
            // Ignore if apartment was concurrently deleted
          }
        }
      }
      return { success: true, message: 'Đồng bộ cấu trúc phân cấp thành công' };
    } catch (error: any) {
      console.error('[ApartmentRepository] Error in bootstrapHierarchy:', error);
      return { success: false, message: error.message };
    }
  }
}

export const apartmentRepository = new ApartmentRepository();

