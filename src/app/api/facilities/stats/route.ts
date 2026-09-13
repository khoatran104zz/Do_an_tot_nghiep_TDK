import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { facilityService } from '@/modules/facility/facility.service';

const ALLOWED_VIEW_ROLES = ['ADMIN', 'MANAGER'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_VIEW_ROLES.includes(session.user.role)) {
      return apiForbidden('Không có quyền xem số liệu thống kê tiện ích');
    }

    const stats = await facilityService.getDashboardMetrics();
    return apiSuccess(stats, 'Lấy thống kê tiện ích & đặt chỗ thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thống kê tiện ích', 'FETCH_FAILED', 500);
  }
}
