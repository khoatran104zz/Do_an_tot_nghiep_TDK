import { NextRequest } from 'next/server';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const hierarchy = await apartmentService.getHierarchy();
    return apiSuccess(hierarchy, 'Lấy cấu trúc phân cấp tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy cấu trúc phân cấp tòa nhà', 'FETCH_FAILED', 500);
  }
}
