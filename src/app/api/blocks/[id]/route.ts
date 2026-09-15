import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { blockSchema } from '@/modules/apartment/apartment.schema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const block = await apartmentService.getBlockById(id);
    return apiSuccess(block, 'Chi tiết khối tháp');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy khối tháp yêu cầu');
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
      return apiForbidden('Chỉ Ban Quản Trị mới có quyền cập nhật khối tháp');
    }

    const { id } = await params;
    const body = await req.json();
    const validated = blockSchema.partial().parse(body);
    const updated = await apartmentService.updateBlock(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(updated, 'Cập nhật khối tháp thành công');
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
      return apiForbidden('Chỉ Ban Quản Trị mới có quyền xóa khối tháp');
    }

    const { id } = await params;
    await apartmentService.deleteBlock(id, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(null, 'Xóa khối tháp thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa khối tháp thất bại', 'DELETE_FAILED', 400);
  }
}
