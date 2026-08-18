import { NextRequest } from 'next/server';
import { residentService } from '@/modules/resident/resident.service';
import { residentSchema } from '@/modules/resident/resident.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const item = await residentService.getResidentById(id);
    return apiSuccess(item, 'Chi tiết hồ sơ cư dân');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy cư dân');
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const { id } = await params;
    const body = await req.json();
    const validated = residentSchema.partial().parse(body);
    const updated = await residentService.updateResident(id, validated);
    return apiSuccess(updated, 'Cập nhật thông tin cư dân thành công');
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
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const { id } = await params;
    await residentService.deleteResident(id);
    return apiSuccess(null, 'Xóa thông tin cư dân thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa cư dân thất bại', 'DELETE_FAILED', 400);
  }
}
