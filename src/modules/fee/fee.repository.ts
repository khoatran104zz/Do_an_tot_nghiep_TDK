import { prisma } from '@/lib/prisma';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from './fee.types';

export class FeeCategoryRepository {
  async findAll() {
    return prisma.feeCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.feeCategory.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return prisma.feeCategory.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
  }

  async create(data: CreateFeeCategoryDto) {
    return prisma.feeCategory.create({
      data: {
        ...data,
        code: data.code.trim().toUpperCase(),
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
