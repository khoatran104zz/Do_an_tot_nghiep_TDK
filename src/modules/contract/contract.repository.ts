import { prisma } from '@/lib/prisma';
import { ContractFilter, CreateContractDto, UpdateContractDto } from './contract.types';
import { Prisma } from '@prisma/client';

export class ContractRepository {
  async findAll(filter: ContractFilter) {
    const { search, apartmentId, type, status, expiringSoon, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {};

    if (search) {
      where.OR = [
        { contractCode: { contains: search, mode: 'insensitive' } },
        { apartment: { code: { contains: search, mode: 'insensitive' } } },
        { resident: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (apartmentId) {
      where.apartmentId = apartmentId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (expiringSoon) {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);
      where.endDate = {
        gte: now,
        lte: in30Days,
      };
      where.status = 'ACTIVE';
    }

    const [items, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: { select: { id: true, code: true, building: true } },
          resident: { select: { id: true, fullName: true, phone: true, identityCard: true } },
        },
      }),
      prisma.contract.count({ where }),
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
    return prisma.contract.findUnique({
      where: { id },
      include: {
        apartment: true,
        resident: true,
      },
    });
  }

  async findByCode(code: string) {
    return prisma.contract.findUnique({
      where: { contractCode: code.trim().toUpperCase() },
    });
  }

  async create(data: CreateContractDto) {
    return prisma.contract.create({
      data: {
        contractCode: data.contractCode.trim().toUpperCase(),
        apartmentId: data.apartmentId,
        residentId: data.residentId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        monthlyRent: data.monthlyRent || null,
        deposit: data.deposit || null,
        fileUrl: data.fileUrl || null,
        status: data.status || 'ACTIVE',
        note: data.note || null,
      },
    });
  }

  async update(id: string, data: UpdateContractDto) {
    return prisma.contract.update({
      where: { id },
      data: {
        ...(data.contractCode && { contractCode: data.contractCode.trim().toUpperCase() }),
        ...(data.apartmentId && { apartmentId: data.apartmentId }),
        ...(data.residentId && { residentId: data.residentId }),
        ...(data.type && { type: data.type }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.monthlyRent !== undefined && { monthlyRent: data.monthlyRent || null }),
        ...(data.deposit !== undefined && { deposit: data.deposit || null }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl || null }),
        ...(data.status && { status: data.status }),
        ...(data.note !== undefined && { note: data.note || null }),
      },
    });
  }

  async delete(id: string) {
    return prisma.contract.delete({
      where: { id },
    });
  }
}

export const contractRepository = new ContractRepository();
