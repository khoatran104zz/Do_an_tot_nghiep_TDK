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
    const licensePlate = searchParams.get('licensePlate') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const direction = (searchParams.get('direction') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await parkingService.getAccessLogs(
      {
        buildingId,
        licensePlate,
        status,
        direction,
        search,
        startDate,
        endDate,
        page,
        limit,
      },
      session.user
    );

    return apiSuccess(result.items, 'Lấy nhật ký bãi đỗ xe thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy nhật ký bãi đỗ xe', 'SERVER_ERROR', 500);
  }
}
