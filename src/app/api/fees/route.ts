import { NextRequest } from 'next/server';
import { feeCategoryService } from '@/modules/fee/fee.service';
import { feeCategorySchema } from '@/modules/fee/fee.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const items = await feeCategoryService.getFeeCategories();
    return apiSuccess(items, 'Lấy danh mục phí thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh mục phí', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = feeCategorySchema.parse(body);
    const item = await feeCategoryService.createFeeCategory(validated);
    return apiSuccess(item, 'Tạo mới danh mục phí thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Tạo mới danh mục phí thất bại', 'CREATE_FAILED', 400);
  }
}
