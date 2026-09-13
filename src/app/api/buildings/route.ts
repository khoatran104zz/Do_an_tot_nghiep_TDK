import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const buildings = await apartmentService.getBuildings();
    return apiSuccess(buildings, 'Lấy danh sách tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách tòa nhà', 'FETCH_FAILED', 500);
  }
}
