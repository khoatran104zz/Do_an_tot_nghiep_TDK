import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { staffService } from '@/modules/staff/staff.service';
import { updateStaffStatusSchema } from '@/modules/staff/staff.schema';

const ALLOWED_STAFF_MANAGERS = ['ADMIN', 'MANAGER'];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_STAFF_MANAGERS.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền thay đổi trạng thái nhân sự');
    }

    const body = await req.json();
    const validated = updateStaffStatusSchema.parse(body);

    const updated = await staffService.updateStatus(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(updated, 'Cập nhật trạng thái nhân sự thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật trạng thái thất bại', 'STATUS_UPDATE_FAILED', 400);
  }
}
