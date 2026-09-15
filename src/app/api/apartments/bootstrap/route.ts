import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role !== 'ADMIN') {
      return apiForbidden('Chỉ Quản trị viên hệ thống (ADMIN) mới có quyền chạy lệnh đồng bộ cấu trúc');
    }

    const result = await apartmentService.bootstrapHierarchy();
    return apiSuccess(result, 'Đồng bộ cấu trúc phân cấp bất động sản thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi trong quá trình đồng bộ cấu trúc', 'BOOTSTRAP_FAILED', 500);
  }
}
