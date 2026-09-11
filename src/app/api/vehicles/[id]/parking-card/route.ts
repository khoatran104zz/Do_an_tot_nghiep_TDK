import { NextRequest } from 'next/server';
import { parkingCardService } from '@/modules/vehicle/parking-card.service';
import { createParkingCardSchema } from '@/modules/vehicle/vehicle.schema';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (session.user.role === 'RESIDENT') {
      return apiForbidden('Cư dân không có quyền cấp thẻ gửi xe');
    }

    const { id: vehicleId } = await params;
    const body = await req.json();
    const validated = createParkingCardSchema.parse(body);

    const card = await parkingCardService.issueCard(vehicleId, validated, session.user as any);

    return apiSuccess(card, 'Cấp thẻ gửi xe thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Cấp thẻ gửi xe thất bại', 'ISSUE_FAILED', 400);
  }
}
