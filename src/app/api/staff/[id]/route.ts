import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { staffService } from '@/modules/staff/staff.service';
import { updateStaffSchema } from '@/modules/staff/staff.schema';

const ALLOWED_STAFF_MANAGERS = ['ADMIN', 'MANAGER'];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_STAFF_MANAGERS.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền xem hồ sơ nhân sự');
    }

    const staff = await staffService.getStaffById(id);
    return apiSuccess(staff, 'Lấy thông tin nhân sự thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thông tin nhân sự', 'FETCH_FAILED', 500);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_STAFF_MANAGERS.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền cập nhật hồ sơ nhân sự');
    }

    const body = await req.json();
    const validated = updateStaffSchema.parse(body);

    const updated = await staffService.updateStaff(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(updated, 'Cập nhật thông tin nhân sự thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật nhân sự thất bại', 'UPDATE_FAILED', 400);
  }
}
