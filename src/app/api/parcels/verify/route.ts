import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { parcelService } from '@/modules/parcel/parcel.service';
import { collectParcelSchema } from '@/modules/parcel/parcel.schema';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF_RECEPTIONIST'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return apiForbidden('Chỉ nhân viên lễ tân hoặc ban quản lý mới có quyền xác nhận bàn giao bưu kiện');
    }

    const body = await req.json();
    const validated = collectParcelSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Mã nhận hàng không hợp lệ';
      return apiError(errorMsg, 'VALIDATION_ERROR', 400);
    }

    const collected = await parcelService.collectParcel(validated.data, {
      id: session.user.id,
      role: session.user.role,
      fullName: session.user.name || undefined,
    });

    return apiSuccess(collected, 'Xác nhận bàn giao bưu kiện thành công');
  } catch (error: any) {
    console.error('POST /api/parcels/verify error:', error);
    return apiError(error.message || 'Xác nhận bàn giao bưu kiện thất bại', 'VERIFY_ERROR', 400);
  }
}
