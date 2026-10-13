import { prisma } from '@/lib/prisma';
import { ResidentFilter, CreateResidentDto, UpdateResidentDto } from './resident.types';
import { Prisma } from '@prisma/client';

export class ResidentRepository {
  async findAll(filter: ResidentFilter) {
    const { search, apartmentId, buildingId, buildingIds, roleInHousehold, relationshipToOwner, status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const andClauses: Prisma.ResidentWhereInput[] = [];

    if (search) {
      andClauses.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { identityCard: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (apartmentId) {
      andClauses.push({
        occupancies: {
          some: { apartmentId, isLivingHere: true },
        },
      });
    }

    if (buildingIds && buildingIds.length > 0) {
      andClauses.push({
        occupancies: {
          some: {
            apartment: {
              OR: [
                { buildingId: { in: buildingIds } },
                { block: { buildingId: { in: buildingIds } } },
              ],
            },
            isLivingHere: true,
          },
        },
      });
    } else if (buildingId) {
      andClauses.push({
        occupancies: {
          some: {
            apartment: {
              OR: [
                { buildingId },
                { block: { buildingId } },
              ],
            },
            isLivingHere: true,
          },
        },
      });
    }

    const targetRole = roleInHousehold || (relationshipToOwner === 'OWNER' ? 'HEAD_OF_HOUSEHOLD' : relationshipToOwner === 'FAMILY' ? 'FAMILY_MEMBER' : relationshipToOwner === 'TENANT' ? 'TENANT' : relationshipToOwner === 'TEMPORARY_RESIDENT' ? 'TEMPORARY' : undefined);
    if (targetRole) {
      andClauses.push({
        occupancies: {
          some: { roleInHousehold: targetRole },
        },
      });
    }

    if (status) {
      andClauses.push({ status });
    }

    const where: Prisma.ResidentWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [rawItems, total] = await Promise.all([
      prisma.resident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          occupancies: {
            where: { isLivingHere: true },
            include: {
              apartment: { select: { id: true, code: true, building: true, floor: true } },
            },
          },
          ownedApartments: {
            where: { isCurrent: true },
            include: {
              apartment: { select: { id: true, code: true, building: true, floor: true } },
            },
          },
          user: { select: { id: true, email: true, isActive: true } },
        },
      }),
      prisma.resident.count({ where }),
    ]);

    const items = rawItems.map((r: any) => {
      const activeApartment = r.occupancies?.[0]?.apartment || r.ownedApartments?.[0]?.apartment || null;
      const activeRole = r.occupancies?.[0]?.roleInHousehold || (r.ownedApartments?.length > 0 ? 'HEAD_OF_HOUSEHOLD' : 'TEMPORARY');
      const legacyRelationship =
        activeRole === 'HEAD_OF_HOUSEHOLD'
          ? 'OWNER'
          : activeRole === 'FAMILY_MEMBER'
          ? 'FAMILY'
          : activeRole === 'TENANT'
          ? 'TENANT'
          : 'TEMPORARY_RESIDENT';

      return {
        ...r,
        apartment: activeApartment,
        apartmentId: activeApartment?.id || null,
        roleInHousehold: activeRole,
        relationshipToOwner: legacyRelationship,
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
    const resident = await prisma.resident.findUnique({
      where: { id },
      include: {
        occupancies: {
          where: { isLivingHere: true },
          include: {
            apartment: true,
          },
        },
        ownedApartments: {
          where: { isCurrent: true },
          include: {
            apartment: true,
          },
        },
        user: true,
        contracts: true,
        feedbacks: true,
      },
    });

    if (!resident) return null;

    const activeApartment =
      resident.occupancies?.[0]?.apartment ||
      resident.ownedApartments?.[0]?.apartment ||
      null;

    const activeRole =
      resident.occupancies?.[0]?.roleInHousehold ||
      (resident.ownedApartments?.length > 0 ? 'HEAD_OF_HOUSEHOLD' : 'TEMPORARY');

    return {
      ...resident,
      apartment: activeApartment,
      apartmentId: activeApartment?.id || null,
      roleInHousehold: activeRole,
      relationshipToOwner:
        activeRole === 'HEAD_OF_HOUSEHOLD'
          ? 'OWNER'
          : activeRole === 'FAMILY_MEMBER'
          ? 'FAMILY'
          : activeRole === 'TENANT'
          ? 'TENANT'
          : 'TEMPORARY_RESIDENT',
    };
  }

  async findByIdentityCard(identityCard: string) {
    return prisma.resident.findUnique({
      where: { identityCard: identityCard.trim() },
    });
  }

  async create(data: CreateResidentDto) {
    return prisma.$transaction(async (tx) => {
      const resident = await tx.resident.create({
        data: {
          fullName: data.fullName,
          identityCard: data.identityCard.trim(),
          phone: data.phone.trim(),
          email: data.email || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          status: data.status || 'RESIDING',
        },
      });

      // Tạo quan hệ cư trú trong apartment_residents
      if (data.apartmentId) {
        let roleInHousehold = data.roleInHousehold || 'TEMPORARY';
        if (!data.roleInHousehold && data.relationshipToOwner) {
          if (data.relationshipToOwner === 'OWNER') roleInHousehold = 'HEAD_OF_HOUSEHOLD';
          else if (data.relationshipToOwner === 'FAMILY') roleInHousehold = 'FAMILY_MEMBER';
          else if (data.relationshipToOwner === 'TENANT') roleInHousehold = 'TENANT';
        }

        await tx.apartmentResident.create({
          data: {
            apartmentId: data.apartmentId,
            residentId: resident.id,
            roleInHousehold,
            isLivingHere: resident.status === 'RESIDING',
            startDate: new Date(),
          },
        });

        // Chỉ tạo ownership khi có bằng chứng xác nhận chủ sở hữu
        const isOwner = data.isOwner || data.relationshipToOwner === 'OWNER' || roleInHousehold === 'HEAD_OF_HOUSEHOLD';
        if (isOwner) {
          await tx.apartmentOwnership.create({
            data: {
              apartmentId: data.apartmentId,
              ownerResidentId: resident.id,
              ownershipType: 'SOLE',
              ownershipPercentage: 100,
              isCurrent: true,
              startDate: new Date(),
            },
          });
        }
      }

      return resident;
    });
  }

  async update(id: string, data: UpdateResidentDto) {
    return prisma.$transaction(async (tx) => {
      const resident = await tx.resident.update({
        where: { id },
        data: {
          ...(data.fullName && { fullName: data.fullName }),
          ...(data.identityCard && { identityCard: data.identityCard.trim() }),
          ...(data.phone && { phone: data.phone.trim() }),
          ...(data.email !== undefined && { email: data.email || null }),
          ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
          ...(data.gender !== undefined && { gender: data.gender || null }),
          ...(data.status && { status: data.status }),
        },
      });

      // Đồng bộ quan hệ cư trú vào apartment_residents
      if (data.apartmentId) {
        const existingOccupancy = await tx.apartmentResident.findFirst({
          where: {
            apartmentId: data.apartmentId,
            residentId: resident.id,
          },
        });

        let roleInHousehold = data.roleInHousehold || 'TEMPORARY';
        if (!data.roleInHousehold && data.relationshipToOwner) {
          if (data.relationshipToOwner === 'OWNER') roleInHousehold = 'HEAD_OF_HOUSEHOLD';
          else if (data.relationshipToOwner === 'FAMILY') roleInHousehold = 'FAMILY_MEMBER';
          else if (data.relationshipToOwner === 'TENANT') roleInHousehold = 'TENANT';
        }

        if (existingOccupancy) {
          await tx.apartmentResident.update({
            where: { id: existingOccupancy.id },
            data: {
              roleInHousehold,
              isLivingHere: resident.status === 'RESIDING',
            },
          });
        } else {
          await tx.apartmentResident.create({
            data: {
              apartmentId: data.apartmentId,
              residentId: resident.id,
              roleInHousehold,
              isLivingHere: resident.status === 'RESIDING',
              startDate: new Date(),
            },
          });
        }

        const isOwner = data.isOwner || data.relationshipToOwner === 'OWNER' || roleInHousehold === 'HEAD_OF_HOUSEHOLD';
        if (isOwner) {
          const existingOwnership = await tx.apartmentOwnership.findFirst({
            where: {
              apartmentId: data.apartmentId,
              ownerResidentId: resident.id,
            },
          });

          if (!existingOwnership) {
            await tx.apartmentOwnership.create({
              data: {
                apartmentId: data.apartmentId,
                ownerResidentId: resident.id,
                ownershipType: 'SOLE',
                ownershipPercentage: 100,
                isCurrent: true,
                startDate: new Date(),
              },
            });
          }
        }
      }

      return resident;
    });
  }

  async delete(id: string) {
    return prisma.resident.delete({
      where: { id },
    });
  }
}

export const residentRepository = new ResidentRepository();
