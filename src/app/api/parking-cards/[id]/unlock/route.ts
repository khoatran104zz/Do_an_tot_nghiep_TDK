import { NextRequest } from 'next/server';
import { parkingCardService } from '@/modules/vehicle/parking-card.service';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (session.user.role === 'RESIDENT') {
      return apiForbidden('Cư dân không có quyền mở khóa thẻ gửi xe');
    }

    const { id } = await params;
    const unlocked = await parkingCardService.unlockCard(id, session.user as any);

    return apiSuccess(unlocked, 'Mở khóa thẻ gửi xe thành công');
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Mở khóa thẻ gửi xe thất bại', 'UNLOCK_FAILED', 400);
  }
}
