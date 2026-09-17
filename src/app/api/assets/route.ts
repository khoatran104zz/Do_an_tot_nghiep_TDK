import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { assetService } from '@/modules/asset/asset.service';
import { createAssetSchema } from '@/modules/asset/asset.schema';
import { getUserAssignedBuildingIds } from '@/lib/building-scope';
import { AssetCategory, AssetStatus } from '@prisma/client';

const ALLOWED_VIEW_ROLES = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];
const ALLOWED_MANAGE_ROLES = ['ADMIN', 'MANAGER'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_VIEW_ROLES.includes(session.user.role)) {
      return apiForbidden('Không có quyền truy cập danh sách tài sản tòa nhà');
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = (searchParams.get('category') as AssetCategory) || undefined;
    const status = (searchParams.get('status') as AssetStatus) || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let assignedBuildingIds: string[] | undefined = undefined;
    if (session.user.role === 'MANAGER') {
      assignedBuildingIds = await getUserAssignedBuildingIds(session.user.id);
      if (assignedBuildingIds.length === 0) {
        return apiSuccess([], 'Lấy danh sách tài sản thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
        });
      }
      if (buildingId && !assignedBuildingIds.includes(buildingId)) {
        return apiForbidden('Bạn không có quyền truy cập dữ liệu tòa nhà này');
      }
    }

    // If STAFF_TECHNICIAN, scope to assigned technician assets
    const technicianId = session.user.role === 'STAFF_TECHNICIAN' ? session.user.id : undefined;

    const result = await assetService.getAssets(
      {
        search,
        category,
        status,
        buildingId,
        buildingIds: assignedBuildingIds,
        technicianId,
        page,
        limit,
      },
      {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        fullName: session.user.name,
      }
    );

    return apiSuccess(result.items, 'Lấy danh sách tài sản thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách tài sản', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_MANAGE_ROLES.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền thêm mới tài sản');
    }

    const body = await req.json();
    const validated = createAssetSchema.parse(body);

    if (session.user.role === 'MANAGER' && validated.buildingId) {
      const assigned = await getUserAssignedBuildingIds(session.user.id);
      if (!assigned.includes(validated.buildingId)) {
        return apiForbidden('Bạn không có quyền thêm tài sản cho tòa nhà này');
      }
    }

    const asset = await assetService.createAsset(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(asset, 'Tạo mới tài sản thiết bị thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi tạo tài sản', 'CREATE_FAILED', 500);
  }
}
