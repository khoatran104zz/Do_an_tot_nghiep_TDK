import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api-response';
import { pollService } from '@/modules/poll/poll.service';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await context.params;
    const results = await pollService.getResults(id, {
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(results, 'Lấy kết quả khảo sát thành công');
  } catch (error: any) {
    console.error('GET /api/polls/[id]/results error:', error);
    return apiNotFound(error.message || 'Không tìm thấy kết quả khảo sát');
  }
}
