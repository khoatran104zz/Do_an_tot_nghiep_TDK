import { NextRequest } from 'next/server';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { apartmentSchema } from '@/modules/apartment/apartment.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getVerifiedResidentInfo,
  getManagerAssignedBuildingIds,
  authorizeBuildingAccess,
} from '@/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const building = searchParams.get('building') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const block = searchParams.get('block') || undefined;
    const blockId = searchParams.get('blockId') || undefined;
    const floorParam = searchParams.get('floor');
    const floor = floorParam ? parseInt(floorParam, 10) : undefined;
    const floorId = searchParams.get('floorId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // IDOR Protection: Residents can only see their own assigned apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo?.apartmentId) {
        return apiSuccess([], 'Lấy danh sách căn hộ thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      const myApartment = await apartmentService.getApartmentById(residentInfo.apartmentId);
      return apiSuccess([myApartment], 'Lấy danh sách căn hộ thành công', {
        page: 1,
        limit,
        total: 1,
        totalPages: 1,
      });
    }

    // Manager Scope Guard: Restrict query to assigned buildings
    let finalBuildingId = buildingId;
    let finalBuildingIds: string[] | undefined = undefined;

    if (session.user.role === 'MANAGER') {
      const assignedIds = session.user.assignedBuildingIds?.length
        ? session.user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(session.user.id);

      if (buildingId) {
        if (!assignedIds.includes(buildingId)) {
          return apiForbidden('Bạn không có quyền truy cập căn hộ của tòa nhà này');
        }
        finalBuildingId = buildingId;
      } else {
        finalBuildingIds = assignedIds;
      }
    }

    const result = await apartmentService.getApartments({
      search,
      building,
      buildingId: finalBuildingId,
      buildingIds: finalBuildingIds,
      block,
      blockId,
      floor,
      floorId,
      status,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách căn hộ thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách căn hộ', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = apartmentSchema.parse(body);

    // Manager Scope Guard: Can only create apartment in assigned building
    if (session.user.role === 'MANAGER') {
      if (validated.buildingId) {
        const authCheck = await authorizeBuildingAccess(session.user, validated.buildingId);
        if (!authCheck.allowed) {
          return apiForbidden(authCheck.error || 'Bạn không có quyền tạo căn hộ tại tòa nhà này');
        }
      }
    }
    const item = await apartmentService.createApartment(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name || undefined,
    });
    return apiSuccess(item, 'Thêm mới căn hộ thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới căn hộ thất bại', 'CREATE_FAILED', 400);
  }
}

