import { NextRequest } from 'next/server';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { apartmentSchema } from '@/modules/apartment/apartment.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVerifiedResidentInfo } from '@/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const building = searchParams.get('building') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // IDOR Protection: Residents can only see their own assigned apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo?.apartmentId) {
        return apiSuccess([], 'Lấy danh sách căn hộ thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      const myApartment = await apartmentService.getApartmentById(residentInfo.apartmentId);
      return apiSuccess([myApartment], 'Lấy danh sách căn hộ thành công', {
        page: 1,
        limit,
        total: 1,
        totalPages: 1,
      });
    }

    const result = await apartmentService.getApartments({
      search,
      building,
      status,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách căn hộ thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách căn hộ', 'FETCH_FAILED', 500);
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = apartmentSchema.parse(body);
    const item = await apartmentService.createApartment(validated);
    return apiSuccess(item, 'Thêm mới căn hộ thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới căn hộ thất bại', 'CREATE_FAILED', 400);
  }
}
