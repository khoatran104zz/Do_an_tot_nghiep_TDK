import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { assetService } from '@/modules/asset/asset.service';
import { getUserAssignedBuildingIds } from '@/lib/building-scope';

const ALLOWED_VIEW_ROLES = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_VIEW_ROLES.includes(session.user.role)) {
      return apiForbidden('Không có quyền xem số liệu thống kê tài sản');
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;

    let assignedBuildingIds: string[] | undefined = undefined;
    if (session.user.role === 'MANAGER') {
      assignedBuildingIds = await getUserAssignedBuildingIds(session.user.id);
      if (assignedBuildingIds.length === 0) {
        return apiSuccess(
          {
            totalAssets: 0,
            operationalCount: 0,
            maintenanceCount: 0,
            brokenCount: 0,
            upcomingMaintenanceCount: 0,
            overdueMaintenanceCount: 0,
          },
          'Lấy thống kê tài sản và bảo trì thành công'
        );
      }
      if (buildingId && !assignedBuildingIds.includes(buildingId)) {
        return apiForbidden('Bạn không có quyền truy cập dữ liệu tòa nhà này');
      }
    }

    const stats = await assetService.getDashboardMetrics(
      buildingId ? [buildingId] : assignedBuildingIds
    );
    return apiSuccess(stats, 'Lấy thống kê tài sản và bảo trì thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thống kê tài sản', 'FETCH_FAILED', 500);
  }
}
