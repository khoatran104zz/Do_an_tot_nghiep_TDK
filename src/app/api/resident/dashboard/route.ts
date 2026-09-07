import { NextRequest } from 'next/server';
import { residentDashboardService } from '@/modules/resident-dashboard/resident-dashboard.service';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return apiUnauthorized('Vui lòng đăng nhập để truy cập thông tin căn hộ');
    }

    // Always authenticate identity from validated session token, never from client params
    const data = await residentDashboardService.getResidentDashboard(session.user.id);
    return apiSuccess(data, 'Lấy thông tin Resident Portal thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải dữ liệu cư dân', 'FETCH_FAILED', 500);
  }
}
