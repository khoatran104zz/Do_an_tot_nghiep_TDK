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
    const andClauses: Prisma.ResidenceRequestWhereInput[] = [];

    if (apartmentId) andClauses.push({ apartmentId });
    if (requesterId) andClauses.push({ requesterId });
    if (status) andClauses.push({ status });
    if (type) andClauses.push({ type });

    if (search) {
      andClauses.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { identityCard: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { apartment: { code: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (filter.buildingId) {
      andClauses.push({
        apartment: {
          OR: [
            { buildingId: filter.buildingId },
            { block: { buildingId: filter.buildingId } },
          ],
        },
      });
    } else if (filter.buildingIds && filter.buildingIds.length > 0) {
      andClauses.push({
        apartment: {
          OR: [
            { buildingId: { in: filter.buildingIds } },
            { block: { buildingId: { in: filter.buildingIds } } },
          ],
        },
      });
    }

    const where: Prisma.ResidenceRequestWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

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
    const [occupancies, ownerships] = await Promise.all([
      prisma.apartmentResident.findMany({
        where: { apartmentId },
        include: { resident: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.apartmentOwnership.findMany({
        where: { apartmentId, isCurrent: true },
        include: { ownerResident: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const activeOccupancies = occupancies.filter((o) => o.isLivingHere);
    const residents = occupancies.map((o) => o.resident);

    const owner =
      ownerships[0]?.ownerResident ||
      occupancies.find((o) => o.roleInHousehold === 'HEAD_OF_HOUSEHOLD')?.resident ||
      null;

    const familyMembers = occupancies
      .filter((o) => o.roleInHousehold === 'FAMILY_MEMBER' && o.resident.id !== owner?.id)
      .map((o) => o.resident);

    const tenants = occupancies
      .filter((o) => o.roleInHousehold === 'TENANT')
      .map((o) => o.resident);

    const temporaryResidents = occupancies
      .filter((o) => o.roleInHousehold === 'TEMPORARY')
      .map((o) => o.resident);

    return {
      owner,
      familyMembers,
      tenants,
      temporaryResidents,
      allResidents: residents,
      totalActiveCount: activeOccupancies.length,
    };
  }
}

export const householdRepository = new HouseholdRepository();
