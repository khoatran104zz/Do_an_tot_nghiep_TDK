import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { staffService } from '@/modules/staff/staff.service';
import { assignShiftSchema } from '@/modules/staff/staff.schema';

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
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền điều chuyển ca trực nhân sự');
    }

    const body = await req.json();
    const validated = assignShiftSchema.parse(body);

    const updated = await staffService.assignShift(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(updated, 'Điều chuyển ca trực và khu vực phân công thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu ca trực không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Điều chuyển ca trực thất bại', 'SHIFT_UPDATE_FAILED', 400);
  }
}
