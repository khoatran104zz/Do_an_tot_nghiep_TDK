import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { pollService } from '@/modules/poll/poll.service';
import { updatePollSchema } from '@/modules/poll/poll.schema';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await context.params;
    const poll = await pollService.getPollById(id, {
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(poll, 'Lấy thông tin khảo sát thành công');
  } catch (error: any) {
    console.error('GET /api/polls/[id] error:', error);
    return apiNotFound(error.message || 'Không tìm thấy cuộc khảo sát');
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const allowedRoles = ['ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return apiForbidden('Chỉ Ban Quản Lý mới có quyền cập nhật khảo sát');
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updatePollSchema.safeParse(body);

    if (!validated.success) {
      return apiError(validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }

    const updated = await pollService.updatePoll(id, validated.data, {
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(updated, 'Cập nhật khảo sát thành công');
  } catch (error: any) {
    console.error('PATCH /api/polls/[id] error:', error);
    return apiError(error.message || 'Cập nhật khảo sát thất bại', 'UPDATE_POLL_ERROR', 400);
  }
}
