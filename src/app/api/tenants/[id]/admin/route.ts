import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { tenantService } from '@/modules/tenant/tenant.service';
import { createTenantAdminSchema } from '@/modules/tenant/tenant.schema';
import { isSuperAdmin } from '@/lib/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY PLATFORM ADMIN ONLY
    if (!isSuperAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao Nền tảng mới có quyền cấp tài khoản Tenant Admin');
    }

    const { id } = await params;
    const body = await req.json();
    const validated = createTenantAdminSchema.parse(body);

    const createdAdmin = await tenantService.createTenantAdmin(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(
      createdAdmin,
      'Khởi tạo tài khoản Quản trị viên Khách hàng (Tenant Admin) thành công',
      undefined,
      201
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Khởi tạo Tenant Admin thất bại', 'CREATE_FAILED', 400);
  }
}
