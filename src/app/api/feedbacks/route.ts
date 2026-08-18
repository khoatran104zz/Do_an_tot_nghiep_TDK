import { NextRequest } from 'next/server';
import { feedbackService } from '@/modules/feedback/feedback.service';
import { createFeedbackSchema } from '@/modules/feedback/feedback.schema';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    let residentId = searchParams.get('residentId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // If resident user, limit to their own residentId / apartmentId
    if (session.user.role === 'RESIDENT') {
      if (session.user.residentId) residentId = session.user.residentId;
      if (session.user.apartmentId) apartmentId = session.user.apartmentId;
    }

    const result = await feedbackService.getFeedbacks({
      search,
      category,
      priority,
      status,
      apartmentId,
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
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createFeedbackSchema.parse(body);

    const apartmentId = validated.apartmentId || session.user.apartmentId;
    const residentId = session.user.residentId;

    if (!apartmentId || !residentId) {
      return apiError('Tài khoản cư dân chưa gắn thông tin căn hộ hợp lệ', 'MISSING_RESIDENT_PROFILE', 400);
    }

    const item = await feedbackService.createFeedback({
      ...validated,
      apartmentId,
      residentId,
    });

    return apiSuccess(item, 'Gửi phản ánh sự cố thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Gửi phản ánh thất bại', 'CREATE_FAILED', 400);
  }
}
