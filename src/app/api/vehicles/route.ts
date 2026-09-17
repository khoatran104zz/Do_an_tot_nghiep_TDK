import { NextRequest } from 'next/server';
import { vehicleService } from '@/modules/vehicle/vehicle.service';
import { createVehicleSchema } from '@/modules/vehicle/vehicle.schema';
import { VehicleError } from '@/modules/vehicle/vehicle.types';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    const building = searchParams.get('building') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
    const apartmentId = searchParams.get('apartmentId') || undefined;
    const residentId = searchParams.get('residentId') || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const parkingCardStatus = (searchParams.get('parkingCardStatus') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let finalBuildingId = buildingId;
    let finalBuildingIds: string[] | undefined = undefined;

    if (session.user.role === 'MANAGER') {
      const assignedIds = session.user.assignedBuildingIds?.length
        ? session.user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(session.user.id);

      if (assignedIds.length === 0) {
        return apiSuccess([], 'Lấy danh sách phương tiện thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      if (buildingId) {
        if (!assignedIds.includes(buildingId)) {
          return apiForbidden('Bạn không có quyền truy cập phương tiện của tòa nhà này');
        }
        finalBuildingId = buildingId;
      } else {
        finalBuildingIds = assignedIds;
      }
    }

    const result = await vehicleService.getVehicles(
      {
        search,
        building,
        buildingId: finalBuildingId,
        buildingIds: finalBuildingIds,
        apartmentId,
        residentId,
        type,
        status,
        parkingCardStatus,
        page,
        limit,
      },
      session.user as any
    );

    return apiSuccess(result.items, 'Lấy danh sách phương tiện thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Lỗi lấy danh sách phương tiện', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const body = await req.json();
    const validated = createVehicleSchema.parse(body);

    if (session.user.role === 'MANAGER' && validated.apartmentId) {
      const aptAuth = await authorizeApartmentAccess(session.user, validated.apartmentId);
      if (!aptAuth.allowed) {
        return apiForbidden(aptAuth.error || 'Bạn không có quyền đăng ký xe cho căn hộ thuộc tòa nhà khác');
      }
    }

    const created = await vehicleService.createVehicle(validated, session.user as any);

    return apiSuccess(created, 'Đăng ký phương tiện thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    if (error instanceof VehicleError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError(error.message || 'Đăng ký phương tiện thất bại', 'CREATE_FAILED', 400);
  }
}
