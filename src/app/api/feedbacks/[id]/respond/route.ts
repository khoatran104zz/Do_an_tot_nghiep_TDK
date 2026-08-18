import { NextRequest } from 'next/server';
import { feedbackService } from '@/modules/feedback/feedback.service';
import { respondFeedbackSchema } from '@/modules/feedback/feedback.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const { id } = await params;
    const body = await req.json();
    const validated = respondFeedbackSchema.parse(body);

    const updated = await feedbackService.respondFeedback(id, validated);
    return apiSuccess(updated, 'Cập nhật xử lý phản ánh thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật thất bại', 'RESPOND_FAILED', 400);
  }
}
