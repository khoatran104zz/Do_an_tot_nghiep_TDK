import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { facilityService } from '@/modules/facility/facility.service';
import { createFacilitySchema } from '@/modules/facility/facility.schema';
import { FacilityType, FacilityStatus } from '@prisma/client';

import {
  getManagerAssignedBuildingIds,
  authorizeBuildingAccess,
} from '@/lib/authorization';

const ALLOWED_MANAGE_ROLES = ['ADMIN', 'MANAGER'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const type = (searchParams.get('type') as FacilityType) || undefined;
    const status = (searchParams.get('status') as FacilityStatus) || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let finalBuildingId = buildingId;
    let finalBuildingIds: string[] | undefined = undefined;

    if (session.user.role === 'MANAGER') {
      const assignedIds = session.user.assignedBuildingIds?.length
        ? session.user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(session.user.id);

      if (assignedIds.length === 0) {
        return apiSuccess([], 'Lấy danh sách tiện ích thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      if (buildingId) {
        if (!assignedIds.includes(buildingId)) {
          return apiForbidden('Bạn không có quyền truy cập tiện ích của tòa nhà này');
        }
        finalBuildingId = buildingId;
      } else {
        finalBuildingIds = assignedIds;
      }
    }

    const result = await facilityService.getFacilities(
      { search, type, status, buildingId: finalBuildingId, buildingIds: finalBuildingIds, page, limit },
      {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        fullName: session.user.name,
      }
    );

    return apiSuccess(result.items, 'Lấy danh sách tiện ích thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách tiện ích', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_MANAGE_ROLES.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý có quyền thêm mới tiện ích');
    }

    const body = await req.json();
    const validated = createFacilitySchema.parse(body);

    if (session.user.role === 'MANAGER' && validated.buildingId) {
      const bAuth = await authorizeBuildingAccess(session.user, validated.buildingId);
      if (!bAuth.allowed) {
        return apiForbidden(bAuth.error || 'Bạn không có quyền tạo tiện ích cho tòa nhà khác');
      }
    }

    const facility = await facilityService.createFacility(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(facility, 'Tạo tiện ích mới thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi tạo tiện ích', 'CREATE_FAILED', 500);
  }
}
