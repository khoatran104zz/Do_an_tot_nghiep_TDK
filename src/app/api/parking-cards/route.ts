import { NextRequest } from 'next/server';
import { parkingCardService } from '@/modules/vehicle/parking-card.service';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const vehicleId = searchParams.get('vehicleId') || undefined;
    const apartmentId = searchParams.get('apartmentId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await parkingCardService.getCards(
      {
        search,
        vehicleId,
        apartmentId,
        status,
        page,
        limit,
      },
      session.user as any
    );

    return apiSuccess(result.items, 'Lấy danh sách thẻ gửi xe thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy danh sách thẻ gửi xe', 'FETCH_FAILED', 500);
  }
}
