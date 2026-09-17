import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { staffService } from '@/modules/staff/staff.service';
import { createStaffSchema } from '@/modules/staff/staff.schema';
import { Role, StaffShift, StaffStatus } from '@prisma/client';

const ALLOWED_STAFF_MANAGERS = ['ADMIN', 'MANAGER'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_STAFF_MANAGERS.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền truy cập danh sách nhân sự');
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const role = (searchParams.get('role') as Role) || undefined;
    const shift = (searchParams.get('shift') as StaffShift) || undefined;
    const status = (searchParams.get('status') as StaffStatus) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await staffService.getStaffList({
      search,
      role,
      shift,
      status,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách nhân viên thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách nhân viên', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!ALLOWED_STAFF_MANAGERS.includes(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) có quyền thêm mới nhân sự');
    }

    const body = await req.json();
    const validated = createStaffSchema.parse(body);

    // Business rule: Manager CANNOT create another Manager or Admin
    if (
      session.user.role === 'MANAGER' &&
      (validated.role === Role.MANAGER || (validated.role as string) === 'ADMIN')
    ) {
      return apiForbidden('Quản lý tòa nhà không có quyền tạo tài khoản Quản lý hoặc Quản trị viên');
    }

    const staff = await staffService.createStaff(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      fullName: session.user.name,
    });

    return apiSuccess(staff, 'Thêm mới nhân sự thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm nhân sự thất bại', 'CREATE_FAILED', 400);
  }
}
