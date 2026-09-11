import { NextRequest } from 'next/server';
import { vehicleService } from '@/modules/vehicle/vehicle.service';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (session.user.role === 'RESIDENT') {
      return apiForbidden('Cư dân không có quyền hủy kích hoạt phương tiện');
    }

    const { id } = await params;
    const deactivated = await vehicleService.deactivateVehicle(id, session.user as any);

    return apiSuccess(deactivated, 'Đã chuyển phương tiện sang trạng thái ngừng hoạt động và khóa thẻ xe liên quan');
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Hủy kích hoạt phương tiện thất bại', 'DEACTIVATE_FAILED', 400);
  }
}
