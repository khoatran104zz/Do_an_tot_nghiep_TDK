import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { buildingSchema } from '@/modules/apartment/apartment.schema';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const namesOnly = searchParams.get('namesOnly') === 'true';

    if (namesOnly) {
      const names = await apartmentService.getBuildings();
      return apiSuccess(names, 'Lấy danh sách tên tòa nhà thành công');
    }

    const buildings = await apartmentService.getBuildingsList();
    return apiSuccess(buildings, 'Lấy danh sách tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách tòa nhà', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return apiForbidden('Chỉ Ban Quản Trị mới có quyền thêm tòa nhà');
    }

    const body = await req.json();
    const validated = buildingSchema.parse(body);
    const created = await apartmentService.createBuilding(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(created, 'Thêm mới tòa nhà thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới tòa nhà thất bại', 'CREATE_FAILED', 400);
  }
}
