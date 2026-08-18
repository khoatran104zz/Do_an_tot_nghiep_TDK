import { NextRequest } from 'next/server';
import { feedbackService } from '@/modules/feedback/feedback.service';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const item = await feedbackService.getFeedbackById(id);
    return apiSuccess(item, 'Chi tiết phản ánh sự cố');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy phản ánh');
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    await feedbackService.deleteFeedback(id);
    return apiSuccess(null, 'Xóa phản ánh thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa thất bại', 'DELETE_FAILED', 400);
  }
}
