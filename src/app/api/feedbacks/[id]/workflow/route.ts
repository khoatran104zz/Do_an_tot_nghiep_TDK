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
    const { action, payload } = body;

    // Fetch existing ticket to check resource ownership
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

    let result;

    switch (action) {
      case 'ASSIGN': {
        if (session.user.role === 'RESIDENT') return apiForbidden('Chỉ BQL mới có quyền phân công');
        if (!payload?.staffId) return apiError('Vui lòng chọn nhân sự phụ trách', 'INVALID_PAYLOAD', 400);

        result = await ticketWorkflowService.assignTicket({
          ticketId: id,
          staffId: payload.staffId,
          internalNote: payload.internalNote,
          changedBy: { id: session.user.id, role: session.user.role, fullName: session.user.name || undefined },
        });
        break;
      }

      case 'START_PROCESSING': {
        result = await ticketWorkflowService.startProcessing({
          ticketId: id,
          note: payload?.note,
          changedBy: { id: session.user.id, role: session.user.role },
        });
        break;
      }

      case 'RESOLVE': {
        if (!payload?.resolutionNote) {
          return apiError('Vui lòng nhập mô tả kết quả xử lý', 'INVALID_PAYLOAD', 400);
        }
        result = await ticketWorkflowService.resolveTicket({
          ticketId: id,
          resolutionNote: payload.resolutionNote,
          changedBy: { id: session.user.id, role: session.user.role },
        });
        break;
      }

      case 'REJECT': {
        if (session.user.role === 'RESIDENT') return apiForbidden('Chỉ BQL mới có quyền từ chối yêu cầu');
        if (!payload?.reason) {
          return apiError('Vui lòng nhập lý do từ chối', 'INVALID_PAYLOAD', 400);
        }
        result = await ticketWorkflowService.rejectTicket({
          ticketId: id,
          reason: payload.reason,
          changedBy: { id: session.user.id, role: session.user.role },
        });
        break;
      }

      case 'CLOSE': {
        result = await ticketWorkflowService.closeTicket({
          ticketId: id,
          note: payload?.note,
          changedBy: { id: session.user.id, role: session.user.role },
        });
        break;
      }

      case 'PRIORITY': {
        if (session.user.role === 'RESIDENT') return apiForbidden('Cư dân không có quyền đổi độ ưu tiên');
        if (!payload?.priority) return apiError('Vui lòng chọn mức ưu tiên hợp lệ', 'INVALID_PAYLOAD', 400);

        result = await ticketWorkflowService.changePriority({
          ticketId: id,
          priority: payload.priority,
          changedBy: { id: session.user.id, role: session.user.role },
        });
        break;
      }

      case 'CATEGORY': {
        if (session.user.role === 'RESIDENT') return apiForbidden('Cư dân không có quyền đổi phân loại sự cố');
        if (!payload?.category) return apiError('Vui lòng chọn phân loại hợp lệ', 'INVALID_PAYLOAD', 400);

        result = await ticketWorkflowService.changeCategory({
          ticketId: id,
          category: payload.category,
          changedBy: { id: session.user.id, role: session.user.role },
        });
        break;
      }

      default:
        return apiError(`Hành động '${action}' không được hỗ trợ`, 'UNSUPPORTED_ACTION', 400);
    }

    return apiSuccess(result, 'Cập nhật tiến trình sự cố thành công');
  } catch (error: any) {
    return apiError(error.message || 'Thao tác thất bại', 'WORKFLOW_ERROR', 400);
  }
}
