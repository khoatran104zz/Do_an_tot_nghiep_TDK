import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { visitorService } from '@/modules/visitor/visitor.service';
import { createVisitorPassSchema } from '@/modules/visitor/visitor.schema';
import { VisitorStatus } from '@prisma/client';
import {
  getManagerAssignedBuildingIds,
  authorizeApartmentAccess,
} from '@/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const apartmentId = searchParams.get('apartmentId') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const status = (searchParams.get('status') as VisitorStatus) || undefined;
    const date = searchParams.get('date') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let finalBuildingId = buildingId;
    let finalBuildingIds: string[] | undefined = undefined;

    if (session.user.role === 'MANAGER') {
      const assignedIds = session.user.assignedBuildingIds?.length
        ? session.user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(session.user.id);

      if (assignedIds.length === 0) {
        return apiSuccess([], 'Lấy danh sách thẻ khách thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      if (buildingId) {
        if (!assignedIds.includes(buildingId)) {
          return apiForbidden('Bạn không có quyền truy cập thẻ khách của tòa nhà này');
        }
        finalBuildingId = buildingId;
      } else {
        finalBuildingIds = assignedIds;
      }
    }

    const result = await visitorService.getVisitorPasses(
      { search, apartmentId, buildingId: finalBuildingId, buildingIds: finalBuildingIds, status, date, page, limit },
      {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        fullName: session.user.name,
      }
    );

    return apiSuccess(result.items, 'Lấy danh sách thẻ khách thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách thẻ khách', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createVisitorPassSchema.parse(body);

    if (session.user.role === 'MANAGER' && validated.apartmentId) {
      const aptAuth = await authorizeApartmentAccess(session.user, validated.apartmentId);
      if (!aptAuth.allowed) {
        return apiForbidden(aptAuth.error || 'Bạn không có quyền cấp thẻ khách cho căn hộ thuộc tòa nhà khác');
      }
    }

    const pass = await visitorService.createVisitorPass(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(pass, 'Đăng ký thẻ khách thành công!', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi đăng ký thẻ khách', 'CREATE_FAILED', 500);
  }
}
