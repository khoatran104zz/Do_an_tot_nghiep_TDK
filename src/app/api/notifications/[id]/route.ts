import { NextRequest } from 'next/server';
import { notificationService } from '@/modules/notification/notification.service';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const { id } = await params;
    await notificationService.deleteNotification(id);
    return apiSuccess(null, 'Xóa thông báo thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa thất bại', 'DELETE_FAILED', 400);
  }
}
