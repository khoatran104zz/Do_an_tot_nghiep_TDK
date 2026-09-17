import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { visitorService } from '@/modules/visitor/visitor.service';
import { getUserAssignedBuildingIds } from '@/lib/building-scope';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    let assignedBuildingIds: string[] | undefined = undefined;
    if (session.user.role === 'MANAGER') {
      assignedBuildingIds = await getUserAssignedBuildingIds(session.user.id);
      if (assignedBuildingIds.length === 0) {
        return apiSuccess(
          {
            activeVisitors: 0,
            todayTotal: 0,
            pendingToday: 0,
            checkedOutToday: 0,
          },
          'Lấy thống kê khách thăm thành công'
        );
      }
      if (buildingId && !assignedBuildingIds.includes(buildingId)) {
        return apiForbidden('Bạn không có quyền truy cập dữ liệu tòa nhà này');
      }
    }

    const stats = await visitorService.getStats(
      buildingId ? [buildingId] : assignedBuildingIds
    );
    return apiSuccess(stats, 'Lấy thống kê khách thăm thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thống kê khách thăm', 'FETCH_FAILED', 500);
  }
}
