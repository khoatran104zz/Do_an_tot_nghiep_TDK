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

    const { searchParams } = new URL(req.url);
    const monthsParam = searchParams.get('months');
    const months = monthsParam === '12' ? 12 : 6;

    const data = await dashboardService.getManagementDashboard(months);
    return apiSuccess(data, 'Lấy dữ liệu Smart Apartment Operations Dashboard thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy dữ liệu tổng hợp dashboard', 'FETCH_FAILED', 500);
  }
}
