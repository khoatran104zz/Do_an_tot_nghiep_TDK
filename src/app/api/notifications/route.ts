import { NextRequest } from 'next/server';
import { notificationService } from '@/modules/notification/notification.service';
import { createNotificationSchema } from '@/modules/notification/notification.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await notificationService.getNotifications({ page, limit }, session.user.id);

    return apiSuccess(result.items, 'Lấy danh sách thông báo thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách thông báo', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = createNotificationSchema.parse(body);

    const item = await notificationService.createNotification({
      ...validated,
      senderId: session.user.id,
    });

    return apiSuccess(item, 'Đăng thông báo chung thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Đăng thông báo thất bại', 'CREATE_FAILED', 400);
  }
}
