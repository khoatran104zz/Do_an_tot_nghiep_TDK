import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { assetService } from '@/modules/asset/asset.service';
import { completeMaintenanceSchema } from '@/modules/asset/asset.schema';

const ALLOWED_COMPLETE_ROLES = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_COMPLETE_ROLES.includes(session.user.role)) {
      return apiForbidden('Chỉ Kỹ thuật viên hoặc BQL mới có quyền hoàn thành bảo trì');
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = completeMaintenanceSchema.parse(body);

    const result = await assetService.completeSchedule(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(result, 'Xác nhận hoàn thành bảo trì thành công và đã tạo phiếu công việc mới');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi hoàn thành bảo trì', 'OPERATION_FAILED', 500);
  }
}
