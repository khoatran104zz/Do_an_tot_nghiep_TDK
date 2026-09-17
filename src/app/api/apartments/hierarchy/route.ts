import { NextRequest } from 'next/server';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAssignedBuildingIds } from '@/lib/building-scope';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    let buildingIds: string[] | undefined = undefined;
    if (session.user.role === 'MANAGER') {
      const assigned = await getUserAssignedBuildingIds(session.user.id);
      if (assigned.length === 0) {
        return apiSuccess([], 'Lấy cấu trúc phân cấp tòa nhà thành công');
      }
      if (buildingId && !assigned.includes(buildingId)) {
        return apiForbidden('Bạn không có quyền truy cập dữ liệu tòa nhà này');
      }
      buildingIds = buildingId ? [buildingId] : assigned;
    } else if (buildingId) {
      buildingIds = [buildingId];
    }

    const hierarchy = await apartmentService.getHierarchy(buildingIds);
    return apiSuccess(hierarchy, 'Lấy cấu trúc phân cấp tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy cấu trúc phân cấp tòa nhà', 'FETCH_FAILED', 500);
  }
}
