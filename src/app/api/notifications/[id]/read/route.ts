import { NextRequest } from 'next/server';
import { notificationService } from '@/modules/notification/notification.service';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    await notificationService.markAsRead(id, session.user.id);
    return apiSuccess(null, 'Đã đánh dấu là đã đọc');
  } catch (error: any) {
    return apiError(error.message || 'Thao tác thất bại', 'MARK_READ_FAILED', 400);
  }
}
