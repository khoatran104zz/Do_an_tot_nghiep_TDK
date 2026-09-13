import { prisma } from '@/lib/prisma';
import {
  ResidenceRequestFilter,
  CreateResidenceRequestDto,
  HouseholdGroup,
} from './household.types';
import {
  ResidenceRequestStatus,
  ResidenceRequestType,
  ResidentRelationship,
  ResidentStatus,
  Prisma,
} from '@prisma/client';

export class HouseholdRepository {
  async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.residenceRequest.count();
    const padded = String(count + 1).padStart(4, '0');
    return `REQ-${year}-${padded}`;
  }

  async create(requesterId: string, data: CreateResidenceRequestDto) {
    const code = await this.generateCode();
    return prisma.residenceRequest.create({
      data: {
        code,
        type: data.type,
        status: ResidenceRequestStatus.PENDING,
        apartmentId: data.apartmentId,
        requesterId,
        fullName: data.fullName,
        identityCard: data.identityCard,
        phone: data.phone,
        relationship: data.relationship || ResidentRelationship.FAMILY,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        note: data.note || null,
        attachmentUrl: data.attachmentUrl || null,
      },
      include: {
        apartment: {
          select: {
            id: true,
            code: true,
            building: true,
            floor: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.residenceRequest.findUnique({
      where: { id },
      include: {
        apartment: {
          select: {
            id: true,
            code: true,
            building: true,
            floor: true,
            status: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findMany(filter: ResidenceRequestFilter) {
    const {
      search,
      apartmentId,
      requesterId,
      status,
      type,
      page = 1,
      limit = 20,
    } = filter;

    const skip = (page - 1) * limit;
    const where: Prisma.ResidenceRequestWhereInput = {};

    if (apartmentId) where.apartmentId = apartmentId;
    if (requesterId) where.requesterId = requesterId;
    if (status) where.status = status;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { identityCard: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { apartment: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.residenceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: {
            select: {
              id: true,
              code: true,
              building: true,
              floor: true,
            },
          },
          requester: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.residenceRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateReviewStatus(
    id: string,
    data: {
      status: ResidenceRequestStatus;
      reviewerId: string;
      reviewedAt: Date;
      rejectReason?: string | null;
    }
  ) {
    return prisma.residenceRequest.update({
      where: { id },
      data: {
        status: data.status,
        reviewerId: data.reviewerId,
        reviewedAt: data.reviewedAt,
        rejectReason: data.rejectReason || null,
      },
      include: {
        apartment: true,
        requester: true,
        reviewer: true,
      },
    });
  }

  async countPending(apartmentId?: string): Promise<number> {
    return prisma.residenceRequest.count({
      where: {
        status: ResidenceRequestStatus.PENDING,
        ...(apartmentId ? { apartmentId } : {}),
      },
    });
  }

  async getHouseholdByApartmentId(apartmentId: string): Promise<HouseholdGroup> {
    const residents = await prisma.resident.findMany({
      where: {
        apartmentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const activeResidents = residents.filter((r) => r.status === ResidentStatus.RESIDING);
    const owner =
      residents.find(
        (r) => r.relationshipToOwner === ResidentRelationship.OWNER && r.status === ResidentStatus.RESIDING
      ) ||
      residents.find((r) => r.relationshipToOwner === ResidentRelationship.OWNER) ||
      null;

    const familyMembers = residents.filter(
      (r) => r.relationshipToOwner === ResidentRelationship.FAMILY && r.id !== owner?.id
    );

    const tenants = residents.filter(
      (r) => r.relationshipToOwner === ResidentRelationship.TENANT
    );

    const temporaryResidents = residents.filter(
      (r) => r.relationshipToOwner === ResidentRelationship.TEMPORARY_RESIDENT
    );

    return {
      owner,
      familyMembers,
      tenants,
      temporaryResidents,
      allResidents: residents,
      totalActiveCount: activeResidents.length,
    };
  }
}

export const householdRepository = new HouseholdRepository();
