import { NextRequest } from 'next/server';
import { vehicleService } from '@/modules/vehicle/vehicle.service';
import { updateVehicleSchema } from '@/modules/vehicle/vehicle.schema';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const vehicle = await vehicleService.getVehicleById(id, session.user as any);

    return apiSuccess(vehicle, 'Lấy thông tin phương tiện thành công');
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy thông tin phương tiện', 'FETCH_FAILED', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const body = await req.json();
    const validated = updateVehicleSchema.parse(body);

    const updated = await vehicleService.updateVehicle(id, validated, session.user as any);

    return apiSuccess(updated, 'Cập nhật thông tin phương tiện thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Cập nhật phương tiện thất bại', 'UPDATE_FAILED', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const result = await vehicleService.deleteVehicle(id, session.user as any);

    return apiSuccess(result, 'Xóa phương tiện thành công');
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Xóa phương tiện thất bại', 'DELETE_FAILED', 400);
  }
}
