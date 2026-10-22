import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { buildingSchema } from '@/modules/apartment/apartment.schema';
import { prisma } from '@/lib/prisma';
import { isPlatformAdmin, isTenantAdmin, isManager, isAdmin } from '@/lib/permissions';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const user = session.user;
    const { searchParams } = new URL(req.url);
    const namesOnly = searchParams.get('namesOnly') === 'true';

    // 1. PLATFORM ADMIN: Can see all buildings across all tenants, or filter by tenantId query
    if (isPlatformAdmin(user.role) || (user.role === Role.ADMIN && !user.tenantId)) {
      const targetTenantId = searchParams.get('tenantId') || undefined;
      if (namesOnly) {
        const names = await apartmentService.getBuildings(targetTenantId);
        return apiSuccess(names, 'Lấy danh sách tên tòa nhà thành công');
      }
      const buildings = await apartmentService.getBuildingsList(targetTenantId);
      return apiSuccess(buildings, 'Lấy danh sách tòa nhà thành công');
    }

    // 2. TENANT ADMIN: Strictly limited to buildings belonging to their own Tenant
    if (isTenantAdmin(user.role) || (user.role === Role.ADMIN && user.tenantId)) {
      if (!user.tenantId) {
        return apiForbidden('Tài khoản quản trị chưa được liên kết với tổ hợp / khách hàng');
      }

      if (namesOnly) {
        const names = await apartmentService.getBuildings(user.tenantId);
        return apiSuccess(names, 'Lấy danh sách tên tòa nhà tổ hợp thành công');
      }
      const buildings = await apartmentService.getBuildingsList(user.tenantId);
      return apiSuccess(buildings, 'Lấy danh sách tòa nhà tổ hợp thành công');
    }

    // 3. MANAGER: Strictly limited to assigned buildings within their tenant
    if (isManager(user.role)) {
      const whereClause: any = {
        managers: {
          some: { managerId: user.id },
        },
      };
      if (user.tenantId) {
        whereClause.tenantId = user.tenantId;
      }

      const assignedBuildings = await prisma.building.findMany({
        where: whereClause,
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

    const user = session.user;

    // Only Platform Admin or Tenant Admin can create buildings
    if (!isAdmin(user.role)) {
      return apiForbidden('Chỉ Quản trị viên (Admin) mới có quyền tạo mới tòa nhà');
    }

    const body = await req.json();
    const validated = buildingSchema.parse(body);

    // If Tenant Admin, enforce tenantId from session (cannot create building in another tenant!)
    if (isTenantAdmin(user.role) || (user.role === Role.ADMIN && user.tenantId)) {
      if (!user.tenantId) {
        return apiForbidden('Tài khoản quản trị chưa được liên kết với tổ hợp');
      }
      validated.tenantId = user.tenantId;
    } else if (isPlatformAdmin(user.role)) {
      // Platform Admin can specify tenantId in request body
      if (!validated.tenantId) {
        return apiError('Vui lòng chỉ định tổ hợp (tenantId) khi tạo tòa nhà từ tài khoản Nền tảng', 'MISSING_TENANT_ID', 400);
      }
    }

    const created = await apartmentService.createBuilding(validated, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return apiSuccess(created, 'Thêm mới tòa nhà thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới tòa nhà thất bại', 'CREATE_FAILED', 400);
  }
}
