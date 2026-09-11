import { NextRequest } from 'next/server';
import { vehicleService } from '@/modules/vehicle/vehicle.service';
import { approveVehicleSchema } from '@/modules/vehicle/vehicle.schema';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (session.user.role === 'RESIDENT') {
      return apiForbidden('Cư dân không có quyền phê duyệt phương tiện');
    }

    const { id } = await params;
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional if approving without immediate card issuance
    }

    const validated = approveVehicleSchema.parse(body);
    const approved = await vehicleService.approveVehicle(id, validated, session.user as any);

    return apiSuccess(approved, 'Phê duyệt phương tiện thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Phê duyệt phương tiện thất bại', 'APPROVE_FAILED', 400);
  }
}
