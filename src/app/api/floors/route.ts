import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { floorSchema } from '@/modules/apartment/apartment.schema';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get('blockId') || undefined;

    const floors = await apartmentService.getFloors(blockId);
    return apiSuccess(floors, 'Lấy danh sách tầng lầu thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách tầng lầu', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return apiForbidden('Chỉ Ban Quản Trị mới có quyền thêm tầng lầu');
    }

    const body = await req.json();
    const validated = floorSchema.parse(body);
    const created = await apartmentService.createFloor(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(created, 'Thêm mới tầng lầu thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới tầng lầu thất bại', 'CREATE_FAILED', 400);
  }
}
