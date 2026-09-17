import { NextRequest } from 'next/server';
import { residentService } from '@/modules/resident/resident.service';
import { residentSchema } from '@/modules/resident/resident.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getVerifiedResidentInfo,
  getManagerAssignedBuildingIds,
  authorizeApartmentAccess,
} from '@/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    let apartmentId = searchParams.get('apartmentId') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const relationshipToOwner = (searchParams.get('relationshipToOwner') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // IDOR Protection: If resident user, restrict to residents belonging to their own apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo?.apartmentId) {
        return apiSuccess([], 'Lấy danh sách cư dân thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      apartmentId = residentInfo.apartmentId;
    }

    let finalBuildingId = buildingId;
    let finalBuildingIds: string[] | undefined = undefined;

    if (session.user.role === 'MANAGER') {
      const assignedIds = session.user.assignedBuildingIds?.length
        ? session.user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(session.user.id);

      if (assignedIds.length === 0) {
        return apiSuccess([], 'Lấy danh sách cư dân thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      if (buildingId) {
        if (!assignedIds.includes(buildingId)) {
          return apiForbidden('Bạn không có quyền truy cập cư dân của tòa nhà này');
        }
        finalBuildingId = buildingId;
      } else {
        finalBuildingIds = assignedIds;
      }
    }

    const result = await residentService.getResidents({
      search,
      apartmentId,
      buildingId: finalBuildingId,
      buildingIds: finalBuildingIds,
      relationshipToOwner,
      status,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách cư dân thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách cư dân', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = residentSchema.parse(body);

    if (session.user.role === 'MANAGER' && validated.apartmentId) {
      const aptAuth = await authorizeApartmentAccess(session.user, validated.apartmentId);
      if (!aptAuth.allowed) {
        return apiForbidden(aptAuth.error || 'Bạn không có quyền thêm cư dân vào căn hộ thuộc tòa nhà khác');
      }
    }

    const item = await residentService.createResident(validated);
    return apiSuccess(item, 'Thêm mới cư dân thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới cư dân thất bại', 'CREATE_FAILED', 400);
  }
}
