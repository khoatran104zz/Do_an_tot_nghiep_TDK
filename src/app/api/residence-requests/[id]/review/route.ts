import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { householdService } from '@/modules/household/household.service';
import { reviewResidenceRequestSchema } from '@/modules/household/household.schema';

const ALLOWED_REVIEW_ROLES = ['ADMIN', 'MANAGER', 'STAFF_RECEPTIONIST'];

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_REVIEW_ROLES.includes(session.user.role)) {
      return apiForbidden('Bạn không có thẩm quyền phê duyệt/từ chối yêu cầu cư trú');
    }

    const body = await req.json();
    const validated = reviewResidenceRequestSchema.parse(body);

    const result = await householdService.reviewRequest(
      id,
      {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        fullName: session.user.name,
      },
      validated
    );

    const actionText = validated.action === 'APPROVE' ? 'Phê duyệt' : 'Từ chối';
    return apiSuccess(result, `${actionText} yêu cầu cư trú thành công`);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Xử lý yêu cầu thất bại', 'REVIEW_FAILED', 400);
  }
}
