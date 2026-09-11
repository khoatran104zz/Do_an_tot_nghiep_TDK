import { NextRequest } from 'next/server';
import { parkingCardService } from '@/modules/vehicle/parking-card.service';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const card = await parkingCardService.getCardById(id, session.user as any);

    return apiSuccess(card, 'Lấy thông tin thẻ gửi xe thành công');
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy thông tin thẻ gửi xe', 'FETCH_FAILED', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const body = await req.json();

    const updated = await parkingCardService.updateCard(id, body, session.user as any);

    return apiSuccess(updated, 'Cập nhật thẻ gửi xe thành công');
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Cập nhật thẻ gửi xe thất bại', 'UPDATE_FAILED', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const result = await parkingCardService.deleteCard(id, session.user as any);

    return apiSuccess(result, 'Xóa thẻ gửi xe thành công');
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Xóa thẻ gửi xe thất bại', 'DELETE_FAILED', 400);
  }
}
