import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { householdService } from '@/modules/household/household.service';
import { createResidenceRequestSchema } from '@/modules/household/household.schema';
import { getVerifiedResidentInfo } from '@/lib/authorization';
import { ResidenceRequestStatus, ResidenceRequestType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    let apartmentId = searchParams.get('apartmentId') || undefined;
    const status = (searchParams.get('status') as ResidenceRequestStatus) || undefined;
    const type = (searchParams.get('type') as ResidenceRequestType) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let requesterId: string | undefined = undefined;

    // IDOR Protection for Residents
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo?.apartmentId) {
        // Fallback to requesterId if resident profile has no apartmentId yet
        requesterId = session.user.id;
      } else {
        apartmentId = residentInfo.apartmentId;
      }
    }

    const result = await householdService.getRequests({
      search,
      apartmentId,
      requesterId,
      status,
      type,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách yêu cầu cư trú thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách yêu cầu cư trú', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createResidenceRequestSchema.parse(body);

    // If RESIDENT, enforce that apartmentId is their own apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (residentInfo?.apartmentId && residentInfo.apartmentId !== validated.apartmentId) {
        return apiForbidden('Bạn chỉ được phép gửi yêu cầu cư trú cho căn hộ của chính mình');
      }
    }

    const request = await householdService.submitRequest(session.user.id, validated);
    return apiSuccess(request, 'Gửi yêu cầu cư trú thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Gửi yêu cầu thất bại', 'CREATE_FAILED', 400);
  }
}
