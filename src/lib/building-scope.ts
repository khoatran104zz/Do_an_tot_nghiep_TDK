import { prisma } from '@/lib/prisma';
import { getManagerAssignedBuildingIds } from '@/lib/authorization';

/**
 * Retrieve assigned building IDs for a user (building manager)
 */
export async function getUserAssignedBuildingIds(
  userId: string,
  prismaClient: any = prisma
): Promise<string[]> {
  return getManagerAssignedBuildingIds(userId, prismaClient);
}

export { getManagerAssignedBuildingIds };
