import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { facilityService } from '@/modules/facility/facility.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Validate format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return apiError('Định dạng ngày không hợp lệ (YYYY-MM-DD)', 'INVALID_DATE', 400);
    }

    const slots = await facilityService.getSlots(id, date);
    return apiSuccess(slots, `Lấy danh sách khung giờ ngày ${date} thành công`);
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải khung giờ tiện ích', 'FETCH_FAILED', 500);
  }
}
