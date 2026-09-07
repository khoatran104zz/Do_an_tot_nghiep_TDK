import { NextRequest } from 'next/server';
import { feedbackService } from '@/modules/feedback/feedback.service';
import { ticketWorkflowService } from '@/modules/feedback/ticket-workflow.service';
import { rateFeedbackSchema } from '@/modules/feedback/feedback.schema';
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
    const body = await req.json();
    const validated = rateFeedbackSchema.parse(body);

    const updated = await ticketWorkflowService.rateTicket({
      ticketId: id,
      rating: validated.rating,
      comment: validated.ratingComment,
      residentUserId: session.user.id,
    });
    return apiSuccess(updated, 'Đánh giá mức độ hài lòng thành công. Cảm ơn bạn!');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Đánh giá thất bại', 'RATE_FAILED', 400);
  }
}
