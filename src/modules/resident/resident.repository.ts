import { prisma } from '@/lib/prisma';
import { ResidentFilter, CreateResidentDto, UpdateResidentDto } from './resident.types';
import { Prisma } from '@prisma/client';

export class ResidentRepository {
  async findAll(filter: ResidentFilter) {
    const { search, apartmentId, relationshipToOwner, status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ResidentWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { identityCard: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (apartmentId) {
      where.apartmentId = apartmentId;
    }

    if (relationshipToOwner) {
      where.relationshipToOwner = relationshipToOwner;
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.resident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: { select: { id: true, code: true, building: true, floor: true } },
          user: { select: { id: true, email: true, isActive: true } },
        },
      }),
      prisma.resident.count({ where }),
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
    return prisma.resident.findUnique({
      where: { id },
      include: {
        apartment: true,
        user: true,
        contracts: true,
        feedbacks: true,
      },
    });
  }

  async findByIdentityCard(identityCard: string) {
    return prisma.resident.findUnique({
      where: { identityCard: identityCard.trim() },
    });
  }

  async create(data: CreateResidentDto) {
    return prisma.resident.create({
      data: {
        fullName: data.fullName,
        identityCard: data.identityCard.trim(),
        phone: data.phone.trim(),
        email: data.email || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        relationshipToOwner: data.relationshipToOwner || 'OWNER',
        status: data.status || 'RESIDING',
        apartmentId: data.apartmentId || null,
      },
    });
  }

  async update(id: string, data: UpdateResidentDto) {
    return prisma.resident.update({
      where: { id },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.identityCard && { identityCard: data.identityCard.trim() }),
        ...(data.phone && { phone: data.phone.trim() }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
        ...(data.gender !== undefined && { gender: data.gender || null }),
        ...(data.relationshipToOwner && { relationshipToOwner: data.relationshipToOwner }),
        ...(data.status && { status: data.status }),
        ...(data.apartmentId !== undefined && { apartmentId: data.apartmentId || null }),
      },
    });
  }

  async delete(id: string) {
    return prisma.resident.delete({
      where: { id },
    });
  }
}

export const residentRepository = new ResidentRepository();
