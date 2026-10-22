import { prisma } from '@/lib/prisma';
import { CreateTenantDto, UpdateTenantDto, TenantFilter } from './tenant.types';
import { Prisma } from '@prisma/client';

export class TenantRepository {
  async findAll(filter: TenantFilter = {}) {
    const { search, status, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const andClauses: Prisma.TenantWhereInput[] = [];

    if (search) {
      andClauses.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status) {
      andClauses.push({ status });
    }

    const where: Prisma.TenantWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              buildings: true,
              users: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
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
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        buildings: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { blocks: true, apartments: true } },
          },
        },
        users: {
          where: { role: 'TENANT_ADMIN' },
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            buildings: true,
            users: true,
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return prisma.tenant.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
  }

  async create(data: CreateTenantDto) {
    return prisma.tenant.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.toLowerCase().trim() || null,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, data: UpdateTenantDto) {
    return prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.address !== undefined && { address: data.address?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.email !== undefined && { email: data.email?.toLowerCase().trim() || null }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  async delete(id: string) {
    return prisma.tenant.delete({
      where: { id },
    });
  }
}

export const tenantRepository = new TenantRepository();
