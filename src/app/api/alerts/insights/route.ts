import { NextRequest } from 'next/server';
import { smartInsightService } from '@/modules/smart-operations/smart-insight.service';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const summary = await smartInsightService.getSmartOperationsSummary();

    return apiSuccess(summary, 'Dữ liệu phân tích vận hành thông minh');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi phân tích vận hành', 'INSIGHTS_ERROR', 500);
  }
}
