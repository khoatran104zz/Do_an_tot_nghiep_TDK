import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { parcelService } from '@/modules/parcel/parcel.service';
import { receiveParcelSchema } from '@/modules/parcel/parcel.schema';
import { ParcelStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const apartmentId = searchParams.get('apartmentId') || undefined;
    const carrier = searchParams.get('carrier') || undefined;
    const status = (searchParams.get('status') as ParcelStatus) || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await parcelService.getParcels(
      { search, apartmentId, carrier, status, startDate, endDate, page, limit },
      {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email || undefined,
      }
    );

    return apiSuccess(result.items, 'Lấy danh sách bưu kiện thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('GET /api/parcels error:', error);
    return apiError(error.message || 'Không thể lấy danh sách bưu kiện', 'FETCH_PARCELS_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF_RECEPTIONIST'];
    if (!allowedRoles.includes(session.user.role as string)) {
      return apiForbidden('Chỉ Lễ tân hoặc Ban quản lý mới có quyền tiếp nhận bưu kiện');
    }

    const body = await req.json();
    const validated = receiveParcelSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      return apiError(errorMsg, 'VALIDATION_ERROR', 400, validated.error.flatten());
    }

    const parcel = await parcelService.receiveParcel(validated.data, {
      id: session.user.id,
      role: session.user.role,
      fullName: session.user.name || undefined,
    });

    return apiSuccess(parcel, 'Tiếp nhận bưu kiện và gửi thông báo thành công', undefined, 201);
  } catch (error: any) {
    console.error('POST /api/parcels error:', error);
    return apiError(error.message || 'Không thể tiếp nhận bưu kiện', 'RECEIVE_PARCEL_ERROR', 400);
  }
}
