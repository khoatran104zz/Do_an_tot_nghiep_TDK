import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { parcelService } from '@/modules/parcel/parcel.service';
import { updateParcelSchema } from '@/modules/parcel/parcel.schema';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await context.params;

    const parcel = await parcelService.getParcelById(id, {
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(parcel, 'Lấy thông tin bưu kiện thành công');
  } catch (error: any) {
    console.error('GET /api/parcels/[id] error:', error);
    return apiNotFound(error.message || 'Không tìm thấy bưu kiện');
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF_RECEPTIONIST'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return apiForbidden('Chỉ nhân viên lễ tân hoặc ban quản lý mới có quyền chỉnh sửa bưu kiện');
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateParcelSchema.safeParse(body);

    if (!validated.success) {
      return apiError(validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }

    const updated = await parcelService.updateParcel(id, validated.data, {
      id: session.user.id,
      role: session.user.role,
    });

    return apiSuccess(updated, 'Cập nhật bưu kiện thành công');
  } catch (error: any) {
    console.error('PATCH /api/parcels/[id] error:', error);
    return apiError(error.message || 'Cập nhật bưu kiện thất bại', 'UPDATE_ERROR', 400);
  }
}
