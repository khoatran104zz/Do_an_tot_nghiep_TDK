import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parkingService } from '@/modules/parking/parking.service';
import { ParkingSlotStatus } from '@prisma/client';
import { ParkingError } from '@/modules/parking/parking.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.nativeEnum(ParkingSlotStatus),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const body = await req.json();
    const { status } = statusSchema.parse(body);

    const updated = await parkingService.updateSlotStatus(id, status, session.user);
    return apiSuccess(updated, 'Cập nhật trạng thái chỗ đỗ thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Trạng thái không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof ParkingError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi cập nhật trạng thái', 'SERVER_ERROR', 500);
  }
}
