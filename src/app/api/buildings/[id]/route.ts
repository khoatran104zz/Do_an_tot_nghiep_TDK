import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { buildingSchema } from '@/modules/apartment/apartment.schema';
import { authorizeBuildingAccess } from '@/lib/authorization';
import { isAdmin, isManager } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;

    // Scope check: Admin gets all, Manager gets assigned only
    const authCheck = await authorizeBuildingAccess(session.user, id);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error || 'Bạn không có quyền truy cập tòa nhà này');
    }

    const building = await apartmentService.getBuildingById(id);
    return apiSuccess(building, 'Chi tiết tòa nhà');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy tòa nhà yêu cầu');
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;

    // Scope check: Admin full access; Manager only if assigned
    const authCheck = await authorizeBuildingAccess(session.user, id);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error || 'Bạn không có quyền cập nhật tòa nhà này');
    }

    const body = await req.json();
    const validated = buildingSchema.partial().parse(body);

    // If manager, protect critical fields (code cannot be altered by manager)
    if (isManager(session.user.role)) {
      delete validated.code;
    }

    const updated = await apartmentService.updateBuilding(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(updated, 'Cập nhật tòa nhà thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật thất bại', 'UPDATE_FAILED', 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY ADMIN ONLY - Managers CANNOT delete buildings!
    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao (Admin) mới có quyền xóa tòa nhà');
    }

    const { id } = await params;

    // Safety check: Prevent deletion if active blocks or apartments exist
    const [apartmentCount, blockCount] = await Promise.all([
      prisma.apartment.count({ where: { buildingId: id } }),
      prisma.block.count({ where: { buildingId: id } }),
    ]);

    if (apartmentCount > 0 || blockCount > 0) {
      return apiError(
        `Không thể xóa tòa nhà vì đang tồn tại ${blockCount} khối nhà và ${apartmentCount} căn hộ liên kết. Vui lòng di chuyển hoặc xóa dữ liệu con trước.`,
        'SAFETY_CHECK_FAILED',
        400
      );
    }

    await apartmentService.deleteBuilding(id, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(null, 'Xóa tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa tòa nhà thất bại', 'DELETE_FAILED', 400);
  }
}
