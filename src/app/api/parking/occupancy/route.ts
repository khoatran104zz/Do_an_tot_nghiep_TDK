import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parkingService } from '@/modules/parking/parking.service';
import { ParkingError } from '@/modules/parking/parking.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    const overview = await parkingService.getOverview(buildingId, session.user);
    return apiSuccess(overview, 'Lấy dữ liệu công suất bãi đỗ xe thành công');
  } catch (error: any) {
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy thống kê bãi đỗ xe', 'SERVER_ERROR', 500);
  }
}
