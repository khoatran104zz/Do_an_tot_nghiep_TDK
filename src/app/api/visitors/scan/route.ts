import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { visitorService } from '@/modules/visitor/visitor.service';
import { scanVisitorPassSchema } from '@/modules/visitor/visitor.schema';

const ALLOWED_SCAN_ROLES = ['ADMIN', 'MANAGER', 'STAFF_SECURITY', 'STAFF_RECEPTIONIST'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_SCAN_ROLES.includes(session.user.role)) {
      return apiForbidden('Chỉ Nhân viên An ninh hoặc Ban Quản Lý có quyền quét thẻ khách');
    }

    const body = await req.json();
    const validated = scanVisitorPassSchema.parse(body);

    const result = await visitorService.scanAndValidate(validated.passCodeOrQr);

    return apiSuccess(result, result.message);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi quét thẻ khách', 'SCAN_FAILED', 500);
  }
}
