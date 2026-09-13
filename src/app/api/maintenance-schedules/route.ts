import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { assetService } from '@/modules/asset/asset.service';
import { createMaintenanceScheduleSchema } from '@/modules/asset/asset.schema';
import { MaintenanceCycle, MaintenanceStatus } from '@prisma/client';

const ALLOWED_VIEW_ROLES = ['ADMIN', 'MANAGER', 'STAFF_TECHNICIAN'];
const ALLOWED_MANAGE_ROLES = ['ADMIN', 'MANAGER'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_VIEW_ROLES.includes(session.user.role)) {
      return apiForbidden('Không có quyền truy cập lịch bảo trì định kỳ');
    }

    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('assetId') || undefined;
    const status = (searchParams.get('status') as MaintenanceStatus) || undefined;
    const cycle = (searchParams.get('cycle') as MaintenanceCycle) || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // If STAFF_TECHNICIAN, scope to assigned technician
    const technicianId = session.user.role === 'STAFF_TECHNICIAN' ? session.user.id : (searchParams.get('technicianId') || undefined);

    const result = await assetService.getMaintenanceSchedules(
      {
        assetId,
        technicianId,
        status,
        cycle,
        startDate,
        endDate,
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

    return apiSuccess(result.items, 'Lấy danh sách lịch bảo trì thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách lịch bảo trì', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_MANAGE_ROLES.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền lập kế hoạch bảo trì');
    }

    const body = await req.json();
    const validated = createMaintenanceScheduleSchema.parse(body);

    const schedule = await assetService.createSchedule(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(schedule, 'Tạo lịch bảo trì định kỳ thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Lỗi khi tạo lịch bảo trì', 'CREATE_FAILED', 500);
  }
}
