import { NextRequest } from 'next/server';
import { vehicleService } from '@/modules/vehicle/vehicle.service';
import { createVehicleSchema } from '@/modules/vehicle/vehicle.schema';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const building = searchParams.get('building') || undefined;
    const apartmentId = searchParams.get('apartmentId') || undefined;
    const residentId = searchParams.get('residentId') || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const parkingCardStatus = (searchParams.get('parkingCardStatus') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await vehicleService.getVehicles(
      {
        search,
        building,
        apartmentId,
        residentId,
        type,
        status,
        parkingCardStatus,
        page,
        limit,
      },
      session.user as any
    );

    return apiSuccess(result.items, 'Lấy danh sách phương tiện thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy danh sách phương tiện', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createVehicleSchema.parse(body);

    const created = await vehicleService.createVehicle(validated, session.user as any);

    return apiSuccess(created, 'Đăng ký phương tiện thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Đăng ký phương tiện thất bại', 'CREATE_FAILED', 400);
  }
}
