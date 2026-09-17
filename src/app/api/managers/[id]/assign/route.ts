import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';
import { z } from 'zod';

const assignBuildingsSchema = z.object({
  buildingIds: z.array(z.string()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY ADMIN ONLY
    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao (Admin) mới có quyền phân công tòa nhà cho Manager');
    }

    const { id: managerId } = await params;
    const manager = await prisma.user.findUnique({
      where: { id: managerId, role: 'MANAGER' },
    });

    if (!manager) {
      return apiNotFound('Không tìm thấy tài khoản Quản lý tòa nhà');
    }

    const body = await req.json();
    const { buildingIds } = assignBuildingsSchema.parse(body);

    // Verify all buildingIds exist
    if (buildingIds.length > 0) {
      const count = await prisma.building.count({
        where: { id: { in: buildingIds } },
      });
      if (count !== buildingIds.length) {
        return apiError('Một số mã tòa nhà không tồn tại trong hệ thống', 'INVALID_BUILDING_ID', 400);
      }
    }

    // Reconcile assignments in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Remove current assignments
      await tx.managerBuilding.deleteMany({
        where: { managerId },
      });

      // 2. Insert new assignments
      if (buildingIds.length > 0) {
        await tx.managerBuilding.createMany({
          data: buildingIds.map((bId) => ({
            managerId,
            buildingId: bId,
          })),
        });
      }

      // 3. Write audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.user.role,
          action: 'ASSIGN_MANAGER_BUILDINGS',
          entity: 'MANAGER_BUILDING',
          entityId: managerId,
          metadata: {
            managerName: manager.fullName,
            assignedBuildingIds: buildingIds,
          },
        },
      });
    });

    const updatedAssignments = await prisma.managerBuilding.findMany({
      where: { managerId },
      include: {
        building: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return apiSuccess(
      updatedAssignments.map((ua) => ua.building),
      `Đã cập nhật phân công tòa nhà cho quản lý ${manager.fullName} thành công`
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Phân công tòa nhà thất bại', 'ASSIGN_FAILED', 400);
  }
}
