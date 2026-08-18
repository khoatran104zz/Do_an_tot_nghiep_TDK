import { NextRequest } from 'next/server';
import { dashboardService } from '@/modules/dashboard/dashboard.service';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const data = await dashboardService.getDashboardStats();
    return apiSuccess(data, 'Lấy dữ liệu dashboard tổng quan thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy dữ liệu thống kê', 'FETCH_FAILED', 500);
  }
}
