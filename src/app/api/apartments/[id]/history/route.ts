import { NextRequest } from 'next/server';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVerifiedResidentInfo } from '@/lib/authorization';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;

    // IDOR Protection: Residents can only see history of their own apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (residentInfo?.apartmentId !== id) {
        return apiForbidden('Bạn chỉ có quyền xem lịch sử căn hộ của mình');
      }
    }

    const history = await apartmentService.getHistory(id);
    return apiSuccess(history, 'Lấy lịch sử căn hộ thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy lịch sử căn hộ', 'FETCH_FAILED', 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const { id } = await params;
    const body = await req.json();

    if (!body.event || !body.title) {
      return apiError('Sự kiện và tiêu đề không được để trống', 'VALIDATION_ERROR', 400);
    }

    const created = await apartmentService.createHistory(id, {
      ...body,
      performedBy: session.user.name || 'Ban Quản Lý',
    });

    return apiSuccess(created, 'Ghi nhận sự kiện lịch sử căn hộ thành công', undefined, 201);
  } catch (error: any) {
    return apiError(error.message || 'Lỗi ghi nhận lịch sử căn hộ', 'CREATE_FAILED', 400);
  }
}
