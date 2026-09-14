import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { pollService } from '@/modules/poll/poll.service';
import { createPollSchema } from '@/modules/poll/poll.schema';
import { PollStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as PollStatus) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await pollService.getPolls(
      { search, status, page, limit },
      { id: session.user.id, role: session.user.role }
    );

    return apiSuccess(result.items, 'Lấy danh sách khảo sát thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('GET /api/polls error:', error);
    return apiError(error.message || 'Lỗi lấy danh sách khảo sát', 'FETCH_POLLS_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const allowedRoles = ['ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return apiForbidden('Chỉ Ban Quản Lý hoặc Quản trị viên mới có quyền tạo khảo sát');
    }

    const body = await req.json();
    const validated = createPollSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      return apiError(errorMsg, 'VALIDATION_ERROR', 400, validated.error.flatten());
    }

    const poll = await pollService.createPoll(validated.data, {
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(poll, 'Tạo cuộc khảo sát và phát hành thông báo thành công', undefined, 201);
  } catch (error: any) {
    console.error('POST /api/polls error:', error);
    return apiError(error.message || 'Tạo khảo sát thất bại', 'CREATE_POLL_ERROR', 400);
  }
}
