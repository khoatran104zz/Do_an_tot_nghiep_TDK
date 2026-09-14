import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { pollService } from '@/modules/poll/poll.service';
import { votePollSchema } from '@/modules/poll/poll.schema';
import { Role } from '@prisma/client';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (session.user.role !== Role.RESIDENT) {
      return apiForbidden('Chỉ cư dân mới có quyền tham gia biểu quyết');
    }

    const { id: pollId } = await context.params;
    const body = await req.json();
    const validated = votePollSchema.safeParse(body);

    if (!validated.success) {
      return apiError(validated.error.issues[0]?.message || 'Dữ liệu biểu quyết không hợp lệ', 'VALIDATION_ERROR', 400);
    }

    const vote = await pollService.vote(pollId, validated.data, {
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(vote, 'Biểu quyết của căn hộ đã được ghi nhận', undefined, 201);
  } catch (error: any) {
    console.error('POST /api/polls/[id]/vote error:', error);
    return apiError(error.message || 'Biểu quyết thất bại', 'VOTE_ERROR', 400);
  }
}
