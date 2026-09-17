import { NextRequest } from 'next/server';
import { feedbackService } from '@/modules/feedback/feedback.service';
import { ticketWorkflowService } from '@/modules/feedback/ticket-workflow.service';
import { createFeedbackSchema } from '@/modules/feedback/feedback.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getVerifiedResidentInfo,
  getManagerAssignedBuildingIds,
  authorizeApartmentAccess,
} from '@/lib/authorization';
import { rateLimiter } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = (searchParams.get('category') as any) || undefined;
    const priority = (searchParams.get('priority') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    let apartmentId = searchParams.get('apartmentId') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    let residentId = searchParams.get('residentId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // IDOR Protection: If resident user, strictly enforce resident's own tickets / apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo) {
        return apiSuccess([], 'Lấy danh sách phản ánh thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      residentId = residentInfo.id;
      apartmentId = residentInfo.apartmentId || undefined;
    }

    let finalBuildingId = buildingId;
    let finalBuildingIds: string[] | undefined = undefined;

    if (session.user.role === 'MANAGER') {
      const assignedIds = session.user.assignedBuildingIds?.length
        ? session.user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(session.user.id);

      if (assignedIds.length === 0) {
        return apiSuccess([], 'Lấy danh sách phản ánh thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      if (buildingId) {
        if (!assignedIds.includes(buildingId)) {
          return apiForbidden('Bạn không có quyền truy cập phản ánh của tòa nhà này');
        }
        finalBuildingId = buildingId;
      } else {
        finalBuildingIds = assignedIds;
      }
    }

    const result = await feedbackService.getFeedbacks({
      search,
      category,
      priority,
      status,
      apartmentId,
      buildingId: finalBuildingId,
      buildingIds: finalBuildingIds,
      residentId,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách phản ánh thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách phản ánh', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit ticket submission (max 10 tickets per minute)
    const rateLimitResult = rateLimiter.apply(req, {
      maxRequests: 10,
      windowMs: 60 * 1000,
      keyPrefix: 'create_ticket',
    });
    if (!rateLimitResult.allowed) {
      return apiError('Quá nhiều yêu cầu tạo phản ánh. Vui lòng thử lại sau 1 phút.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createFeedbackSchema.parse(body);

    let apartmentId = validated.apartmentId;
    let residentId: string | undefined = undefined;

    if (session.user.role === 'RESIDENT') {
      const resident = await getVerifiedResidentInfo(session.user.id);
      if (!resident || !resident.apartmentId) {
        return apiError('Tài khoản chưa gắn thông tin căn hộ hợp lệ', 'MISSING_RESIDENT_PROFILE', 400);
      }
      residentId = resident.id;
      apartmentId = resident.apartmentId;
    } else {
      // Staff/Manager creating on behalf of resident
      residentId = session.user.id;
      if (session.user.role === 'MANAGER' && apartmentId) {
        const aptAuth = await authorizeApartmentAccess(session.user, apartmentId);
        if (!aptAuth.allowed) {
          return apiForbidden(aptAuth.error || 'Bạn không có quyền tạo sự cố cho căn hộ thuộc tòa nhà khác');
        }
      }
    }

    if (!apartmentId || !residentId) {
      return apiError('Tài khoản chưa gắn thông tin căn hộ hợp lệ', 'MISSING_RESIDENT_PROFILE', 400);
    }

    const item = await ticketWorkflowService.createTicket({
      ...validated,
      apartmentId,
      residentId,
      creatorUserId: session.user.id,
    });

    return apiSuccess(item, 'Gửi phản ánh sự cố thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Gửi phản ánh thất bại', 'CREATE_FAILED', 400);
  }
}

