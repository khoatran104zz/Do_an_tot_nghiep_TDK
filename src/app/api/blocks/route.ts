import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { blockSchema } from '@/modules/apartment/apartment.schema';

import { isAdmin, isManager } from '@/lib/permissions';
import { authorizeBuildingAccess } from '@/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    if (buildingId) {
      const authCheck = await authorizeBuildingAccess(session.user, buildingId);
      if (!authCheck.allowed) {
        return apiForbidden(authCheck.error || 'Bạn không có quyền truy cập tòa nhà này');
      }
    }

    const blocks = await apartmentService.getBlocks(buildingId);
    return apiSuccess(blocks, 'Lấy danh sách khối tháp thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách khối tháp', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const isAllowedRole = isAdmin(session.user.role) || isManager(session.user.role);
    if (!isAllowedRole) {
      return apiForbidden('Chỉ Ban Quản Trị hoặc Quản lý mới có quyền thêm khối tháp');
    }

    const body = await req.json();
    const validated = blockSchema.parse(body);

    const authCheck = await authorizeBuildingAccess(session.user, validated.buildingId);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error || 'Bạn không có quyền quản lý tòa nhà này');
    }

    const created = await apartmentService.createBlock(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(created, 'Thêm mới khối tháp thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới khối tháp thất bại', 'CREATE_FAILED', 400);
  }
}
