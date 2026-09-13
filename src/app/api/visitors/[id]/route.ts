import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { visitorService } from '@/modules/visitor/visitor.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await context.params;
    const pass = await visitorService.getPassById(id, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(pass, 'Lấy chi tiết thẻ khách thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải chi tiết thẻ khách', 'FETCH_FAILED', 500);
  }
}
