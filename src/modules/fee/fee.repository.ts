import { prisma } from '@/lib/prisma';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from './fee.types';

export class FeeCategoryRepository {
  async findAll(tenantId?: string | null) {
    const where: any = {};
    if (tenantId) {
      where.OR = [
        { tenantId },
        { tenantId: null, isSystem: true },
      ];
    }
    return prisma.feeCategory.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.feeCategory.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string, tenantId?: string | null) {
    const normalizedCode = code.trim().toUpperCase();
    if (tenantId !== undefined) {
      return prisma.feeCategory.findFirst({
        where: {
          code: normalizedCode,
          tenantId: tenantId || null,
        },
      });
    }
    return prisma.feeCategory.findFirst({
      where: { code: normalizedCode },
    });
  }

  async create(data: CreateFeeCategoryDto) {
    return prisma.feeCategory.create({
      data: {
        ...data,
        code: data.code.trim().toUpperCase(),
        tenantId: data.tenantId || null,
      },
    });
  }

  async update(id: string, data: UpdateFeeCategoryDto) {
    return prisma.feeCategory.update({
      where: { id },
      data: {
        ...data,
        ...(data.code && { code: data.code.trim().toUpperCase() }),
      },
    });
  }

  async delete(id: string) {
    return prisma.feeCategory.delete({
      where: { id },
    });
  }
}

export const feeCategoryRepository = new FeeCategoryRepository();
