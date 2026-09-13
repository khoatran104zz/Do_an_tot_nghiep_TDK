import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { assetService } from '@/modules/asset/asset.service';
import { updateAssetSchema } from '@/modules/asset/asset.schema';

const ALLOWED_VIEW_ROLES = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];
const ALLOWED_MANAGE_ROLES = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_VIEW_ROLES.includes(session.user.role)) {
      return apiForbidden('Không có quyền xem chi tiết tài sản');
    }

    const { id } = await context.params;
    const asset = await assetService.getAssetById(id);

    if (!asset) {
      return apiError('Không tìm thấy tài sản thiết bị', 'NOT_FOUND', 404);
    }

    return apiSuccess(asset, 'Lấy chi tiết tài sản thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải chi tiết tài sản', 'FETCH_FAILED', 500);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_MANAGE_ROLES.includes(session.user.role)) {
      return apiForbidden('Không có quyền chỉnh sửa tài sản');
    }

    const { id } = await context.params;
    const body = await req.json();
    const validated = updateAssetSchema.parse(body);

    const updated = await assetService.updateAsset(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(updated, 'Cập nhật tài sản thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi cập nhật tài sản', 'UPDATE_FAILED', 500);
  }
}
