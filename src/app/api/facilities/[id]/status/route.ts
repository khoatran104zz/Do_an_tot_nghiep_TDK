import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { facilityService } from '@/modules/facility/facility.service';
import { updateFacilityStatusSchema } from '@/modules/facility/facility.schema';

const ALLOWED_MANAGE_ROLES = ['ADMIN', 'MANAGER'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_MANAGE_ROLES.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý có quyền thay đổi trạng thái tiện ích');
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateFacilityStatusSchema.parse(body);

    const updated = await facilityService.setFacilityStatus(id, validated.status, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(updated, 'Cập nhật trạng thái tiện ích thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi cập nhật trạng thái tiện ích', 'UPDATE_FAILED', 500);
  }
}
