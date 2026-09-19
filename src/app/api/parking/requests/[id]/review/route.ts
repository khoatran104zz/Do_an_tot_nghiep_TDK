import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parkingService } from '@/modules/parking/parking.service';
import { reviewParkingRequestSchema } from '@/modules/parking/parking.schema';
import { ParkingError } from '@/modules/parking/parking.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const body = await req.json();
    const validated = reviewParkingRequestSchema.parse(body);

    const result = await parkingService.reviewRequest(id, validated, session.user);
    const msg =
      validated.action === 'APPROVE'
        ? 'Phê duyệt yêu cầu và cấp phát chỗ đỗ thành công'
        : 'Đã từ chối yêu cầu đăng ký chỗ đỗ';

    return apiSuccess(result, msg);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi xử lý yêu cầu đăng ký', 'SERVER_ERROR', 500);
  }
}
