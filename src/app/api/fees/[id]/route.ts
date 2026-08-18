import { NextRequest } from 'next/server';
import { feeCategoryService } from '@/modules/fee/fee.service';
import { feeCategorySchema } from '@/modules/fee/fee.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const validated = feeCategorySchema.partial().parse(body);
    const updated = await feeCategoryService.updateFeeCategory(id, validated);
    return apiSuccess(updated, 'Cập nhật danh mục phí thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật danh mục phí thất bại', 'UPDATE_FAILED', 400);
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
    await feeCategoryService.deleteFeeCategory(id);
    return apiSuccess(null, 'Xóa danh mục phí thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa danh mục phí thất bại', 'DELETE_FAILED', 400);
  }
}
