import { NextRequest } from 'next/server';
import { residentService } from '@/modules/resident/resident.service';
import { residentSchema } from '@/modules/resident/resident.schema';
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
    let apartmentId = searchParams.get('apartmentId') || undefined;
    const relationshipToOwner = (searchParams.get('relationshipToOwner') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // IDOR Protection: If resident user, restrict to residents belonging to their own apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo?.apartmentId) {
        return apiSuccess([], 'Lấy danh sách cư dân thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      apartmentId = residentInfo.apartmentId;
    }

    const result = await residentService.getResidents({
      search,
      apartmentId,
      relationshipToOwner,
      status,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách cư dân thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách cư dân', 'FETCH_FAILED', 500);
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = residentSchema.parse(body);
    const item = await residentService.createResident(validated);
    return apiSuccess(item, 'Thêm mới cư dân thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới cư dân thất bại', 'CREATE_FAILED', 400);
  }
}
