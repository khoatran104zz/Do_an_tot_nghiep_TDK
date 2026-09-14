import { NextRequest } from 'next/server';
import { notificationService } from '@/modules/notification/notification.service';
import { createNotificationSchema } from '@/modules/notification/notification.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationCategory, NotificationPriority, Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const category = (searchParams.get('category') as NotificationCategory) || undefined;
    const priority = (searchParams.get('priority') as NotificationPriority) || undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await notificationService.getNotifications(
      { page, limit, category, priority, unreadOnly },
      { id: session.user.id, role: session.user.role }
    );

    return apiSuccess(result.items, 'Lấy danh sách thông báo thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('GET /api/notifications error:', error);
    return apiError(error.message || 'Lỗi lấy danh sách thông báo', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const allowedRoles = ['ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return apiForbidden('Chỉ Ban Quản Lý mới có quyền đăng thông báo chung');
    }

    const body = await req.json();
    const validated = createNotificationSchema.parse(body);

    const item = await notificationService.createNotification({
      ...validated,
      senderId: session.user.id,
    });

    return apiSuccess(item, 'Đăng thông báo thành công', undefined, 201);
  } catch (error: any) {
    console.error('POST /api/notifications error:', error);
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Đăng thông báo thất bại', 'CREATE_FAILED', 400);
  }
}
