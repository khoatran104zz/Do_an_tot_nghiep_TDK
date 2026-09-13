import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { visitorService } from '@/modules/visitor/visitor.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const stats = await visitorService.getStats();
    return apiSuccess(stats, 'Lấy thống kê khách thăm thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thống kê khách thăm', 'FETCH_FAILED', 500);
  }
}
