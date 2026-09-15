import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { buildingSchema } from '@/modules/apartment/apartment.schema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const building = await apartmentService.getBuildingById(id);
    return apiSuccess(building, 'Chi tiết tòa nhà');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy tòa nhà yêu cầu');
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return apiForbidden('Chỉ Ban Quản Trị mới có quyền cập nhật tòa nhà');
    }

    const { id } = await params;
    const body = await req.json();
    const validated = buildingSchema.partial().parse(body);
    const updated = await apartmentService.updateBuilding(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(updated, 'Cập nhật tòa nhà thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật thất bại', 'UPDATE_FAILED', 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return apiForbidden('Chỉ Ban Quản Trị mới có quyền xóa tòa nhà');
    }

    const { id } = await params;
    await apartmentService.deleteBuilding(id, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(null, 'Xóa tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa tòa nhà thất bại', 'DELETE_FAILED', 400);
  }
}
