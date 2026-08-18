import { prisma } from '@/lib/prisma';
import { ApartmentFilter, CreateApartmentDto, UpdateApartmentDto } from './apartment.types';
import { Prisma } from '@prisma/client';

export class ApartmentRepository {
  async findAll(filter: ApartmentFilter) {
    const { search, building, status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ApartmentWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (building) {
      where.building = building;
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.apartment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          residents: {
            select: { id: true, fullName: true, phone: true, relationshipToOwner: true },
          },
          _count: { select: { residents: true, contracts: true } },
        },
      }),
      prisma.apartment.count({ where }),
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
    return prisma.apartment.findUnique({
      where: { id },
      include: {
        residents: true,
        contracts: true,
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
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
    });
    return result.map((r) => r.building);
  }
}

export const apartmentRepository = new ApartmentRepository();
