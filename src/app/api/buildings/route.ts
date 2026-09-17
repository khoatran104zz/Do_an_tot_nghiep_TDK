import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { buildingSchema } from '@/modules/apartment/apartment.schema';
import { prisma } from '@/lib/prisma';
import { isAdmin, isManager } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const user = session.user;
    const { searchParams } = new URL(req.url);
    const namesOnly = searchParams.get('namesOnly') === 'true';

    // 1. ADMIN sees ALL buildings
    if (isAdmin(user.role)) {
      if (namesOnly) {
        const names = await apartmentService.getBuildings();
        return apiSuccess(names, 'Lấy danh sách tên tòa nhà thành công');
      }
      const buildings = await apartmentService.getBuildingsList();
      return apiSuccess(buildings, 'Lấy danh sách tòa nhà thành công');
    }

    // 2. MANAGER sees ONLY assigned buildings
    if (isManager(user.role)) {
      const assignedBuildings = await prisma.building.findMany({
        where: {
          managers: {
            some: { managerId: user.id },
          },
        },
        include: {
          blocks: {
            include: {
              _count: { select: { floors: true, apartments: true } },
            },
          },
          _count: {
            select: { apartments: true, facilities: true, assets: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      if (namesOnly) {
        const names = assignedBuildings.map((b) => b.name);
        return apiSuccess(names, 'Lấy danh sách tên tòa nhà thành công');
      }

      return apiSuccess(assignedBuildings, 'Lấy danh sách tòa nhà phân công thành công');
    }

    // Operational staff or resident trying to query building list
    return apiForbidden('Bạn không có quyền truy cập danh mục tòa nhà');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách tòa nhà', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY ADMIN ONLY
    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao (Admin) mới có quyền tạo mới tòa nhà');
    }

    const body = await req.json();
    const validated = buildingSchema.parse(body);
    const created = await apartmentService.createBuilding(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(created, 'Thêm mới tòa nhà thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới tòa nhà thất bại', 'CREATE_FAILED', 400);
  }
}
