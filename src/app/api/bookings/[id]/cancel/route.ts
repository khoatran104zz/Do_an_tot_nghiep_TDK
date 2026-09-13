import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { facilityService } from '@/modules/facility/facility.service';
import { cancelBookingSchema } from '@/modules/facility/facility.schema';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await context.params;
    let reason = 'Người dùng hủy đặt chỗ';

    try {
      const body = await req.json();
      const validated = cancelBookingSchema.parse(body);
      if (validated.reason) reason = validated.reason;
    } catch {
      // Body is optional
    }

    const cancelled = await facilityService.cancelBooking(id, reason, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(cancelled, 'Hủy lịch đặt chỗ thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi hủy lịch đặt chỗ', 'CANCEL_FAILED', 400);
  }
}
