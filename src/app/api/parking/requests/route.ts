import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parkingService } from '@/modules/parking/parking.service';
import { createParkingRequestSchema } from '@/modules/parking/parking.schema';
import { ParkingError } from '@/modules/parking/parking.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId') || undefined;
    const residentId = searchParams.get('residentId') || undefined;
    const apartmentId = searchParams.get('apartmentId') || undefined;
    const vehicleId = searchParams.get('vehicleId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await parkingService.getRequests(
      {
        buildingId,
        residentId,
        apartmentId,
        vehicleId,
        status,
        search,
        page,
        limit,
      },
      session.user
    );

    return apiSuccess(result.items, 'Lấy danh sách yêu cầu đăng ký chỗ đỗ thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy danh sách yêu cầu', 'SERVER_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createParkingRequestSchema.parse(body);

    const request = await parkingService.createRequest(validated, session.user);
    return apiSuccess(request, 'Gửi yêu cầu đăng ký chỗ đỗ xe thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi gửi yêu cầu đăng ký chỗ đỗ', 'SERVER_ERROR', 500);
  }
}
