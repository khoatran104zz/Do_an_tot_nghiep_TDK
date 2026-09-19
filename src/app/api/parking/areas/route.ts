import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parkingService } from '@/modules/parking/parking.service';
import { createParkingAreaSchema } from '@/modules/parking/parking.schema';
import { ParkingError } from '@/modules/parking/parking.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;
    const search = searchParams.get('search') || undefined;
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined;

    const areas = await parkingService.getAreas(
      { buildingId, search, isActive },
      session.user
    );

    return apiSuccess(areas, 'Lấy danh sách khu vực bãi đỗ thành công');
  } catch (error: any) {
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy danh sách khu vực đỗ xe', 'SERVER_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createParkingAreaSchema.parse(body);

    const area = await parkingService.createArea(validated, session.user);
    return apiSuccess(area, 'Tạo khu vực bãi đỗ xe thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi tạo khu vực đỗ xe', 'SERVER_ERROR', 500);
  }
}
