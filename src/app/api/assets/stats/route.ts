import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { assetService } from '@/modules/asset/asset.service';

const ALLOWED_VIEW_ROLES = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_VIEW_ROLES.includes(session.user.role)) {
      return apiForbidden('Không có quyền xem số liệu thống kê tài sản');
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    const stats = await assetService.getDashboardMetrics(buildingId);
    return apiSuccess(stats, 'Lấy thống kê tài sản và bảo trì thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thống kê tài sản', 'FETCH_FAILED', 500);
  }
}
