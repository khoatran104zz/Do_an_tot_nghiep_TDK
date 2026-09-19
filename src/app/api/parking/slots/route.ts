import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parkingService } from '@/modules/parking/parking.service';
import { createParkingSlotSchema } from '@/modules/parking/parking.schema';
import { ParkingError } from '@/modules/parking/parking.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;
    const areaId = searchParams.get('areaId') || undefined;
    const zoneId = searchParams.get('zoneId') || undefined;
    const floor = searchParams.get('floor') ? parseInt(searchParams.get('floor')!, 10) : undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const result = await parkingService.getSlots(
      {
        buildingId,
        areaId,
        zoneId,
        floor,
        type,
        status,
        search,
        page,
        limit,
      },
      session.user
    );

    return apiSuccess(result.items, 'Lấy danh sách chỗ đỗ thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy danh sách chỗ đỗ xe', 'SERVER_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createParkingSlotSchema.parse(body);

    const slot = await parkingService.createSlot(validated, session.user);
    return apiSuccess(slot, 'Tạo vị trí đỗ xe thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi tạo vị trí đỗ xe', 'SERVER_ERROR', 500);
  }
}
