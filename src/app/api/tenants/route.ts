import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { tenantService } from '@/modules/tenant/tenant.service';
import { createTenantSchema } from '@/modules/tenant/tenant.schema';
import { isSuperAdmin } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY PLATFORM ADMIN ONLY (or legacy ADMIN for backward-compatibility)
    if (!isSuperAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao Nền tảng (Platform Admin) mới có quyền truy cập danh sách khách hàng');
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await tenantService.getTenants({ search, status, page, limit });
    return apiSuccess(result, 'Lấy danh sách tổ hợp / khách hàng thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách tổ hợp', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY PLATFORM ADMIN ONLY
    if (!isSuperAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao Nền tảng mới có quyền khởi tạo khách hàng / tổ hợp mới');
    }

    const body = await req.json();
    const validated = createTenantSchema.parse(body);

    const created = await tenantService.createTenant(validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(created, 'Khởi tạo tổ hợp / khách hàng thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Khởi tạo tổ hợp thất bại', 'CREATE_FAILED', 400);
  }
}
