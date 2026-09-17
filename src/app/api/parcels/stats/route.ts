import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { parcelService } from '@/modules/parcel/parcel.service';
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
            totalPending: 0,
            receivedToday: 0,
            collectedToday: 0,
            overdueCount: 0,
            totalMonthly: 0,
          },
          'Lấy số liệu thống kê bưu kiện thành công'
        );
      }
      if (buildingId && !assignedBuildingIds.includes(buildingId)) {
        return apiForbidden('Bạn không có quyền truy cập dữ liệu tòa nhà này');
      }
    }

    const stats = await parcelService.getStats(
      {
        id: session.user.id,
        role: session.user.role,
      },
      buildingId ? [buildingId] : assignedBuildingIds
    );

    return apiSuccess(stats, 'Lấy số liệu thống kê bưu kiện thành công');
  } catch (error: any) {
    console.error('GET /api/parcels/stats error:', error);
    return apiError(error.message || 'Không thể lấy số liệu thống kê', 'STATS_ERROR', 500);
  }
}
