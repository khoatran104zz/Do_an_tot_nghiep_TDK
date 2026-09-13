import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { staffService } from '@/modules/staff/staff.service';

const ALLOWED_STAFF_MANAGERS = ['ADMIN', 'MANAGER'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_STAFF_MANAGERS.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền truy cập thống kê nhân sự');
    }

    const stats = await staffService.getStaffStats();
    return apiSuccess(stats, 'Lấy thống kê nhân sự thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thống kê nhân sự', 'FETCH_FAILED', 500);
  }
}
