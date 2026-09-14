import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { parcelService } from '@/modules/parcel/parcel.service';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const stats = await parcelService.getStats({
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(stats, 'Lấy số liệu thống kê bưu kiện thành công');
  } catch (error: any) {
    console.error('GET /api/parcels/stats error:', error);
    return apiError(error.message || 'Không thể lấy số liệu thống kê', 'STATS_ERROR', 500);
  }
}
