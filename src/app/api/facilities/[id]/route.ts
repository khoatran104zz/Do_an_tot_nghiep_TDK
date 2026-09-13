import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { facilityService } from '@/modules/facility/facility.service';
import { updateFacilitySchema } from '@/modules/facility/facility.schema';

const ALLOWED_MANAGE_ROLES = ['ADMIN', 'MANAGER'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await context.params;
    const facility = await facilityService.getFacilityById(id);

    return apiSuccess(facility, 'Lấy chi tiết tiện ích thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải chi tiết tiện ích', 'FETCH_FAILED', 500);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_MANAGE_ROLES.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý có quyền cập nhật thông tin tiện ích');
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateFacilitySchema.parse(body);

    const updated = await facilityService.updateFacility(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(updated, 'Cập nhật tiện ích thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi cập nhật tiện ích', 'UPDATE_FAILED', 500);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (session.user.role !== 'ADMIN') {
      return apiForbidden('Chỉ Quản trị viên (ADMIN) có quyền xóa tiện ích');
    }

    const { id } = await context.params;
    await facilityService.deleteFacility(id, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(null, 'Xóa tiện ích thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi xóa tiện ích', 'DELETE_FAILED', 500);
  }
}
