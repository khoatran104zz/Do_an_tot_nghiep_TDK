import { NextRequest } from 'next/server';
import { ticketWorkflowService } from '@/modules/feedback/ticket-workflow.service';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authorizeFeedbackAccess } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const body = await req.json();
    const { content, isInternal = false } = body;

    const existing = await prisma.feedback.findUnique({
      where: { id },
      select: { residentId: true, apartmentId: true },
    });
    if (!existing) {
      return apiError('Không tìm thấy sự cố', 'NOT_FOUND', 404);
    }

    const authCheck = await authorizeFeedbackAccess(session.user, existing);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error);
    }

    const comment = await ticketWorkflowService.addComment({
      ticketId: id,
      content,
      isInternal: Boolean(isInternal),
      author: {
        id: session.user.id,
        role: session.user.role,
        fullName: session.user.name || undefined,
      },
    });

    return apiSuccess(comment, 'Thêm trao đổi thành công', undefined, 201);
  } catch (error: any) {
    return apiError(error.message || 'Lỗi thêm trao đổi', 'COMMENT_ERROR', 400);
  }
}
