import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { tenantService } from '@/modules/tenant/tenant.service';
import { updateTenantSchema } from '@/modules/tenant/tenant.schema';
import { isPlatformAdmin } from '@/lib/permissions';
import { authorizeTenantAccess } from '@/lib/authorization';
import { Role } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;

    // Verify tenant access: Platform Admin or Tenant Admin of this tenant
    const authCheck = await authorizeTenantAccess(session.user, id);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error || 'Bạn không có quyền truy cập thông tin tổ hợp này');
    }

    const tenant = await tenantService.getTenantById(id);
    if (!tenant) return apiNotFound('Không tìm thấy thông tin tổ hợp');

    return apiSuccess(tenant, 'Lấy thông tin tổ hợp thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thông tin tổ hợp', 'FETCH_FAILED', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;

    // Verify tenant access
    const authCheck = await authorizeTenantAccess(session.user, id);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error || 'Bạn không có quyền cập nhật tổ hợp này');
    }

    const body = await req.json();
    const validated = updateTenantSchema.parse(body);

    // Only Platform Admin can change tenant status (ACTIVE, SUSPENDED)
    if (validated.status && !isPlatformAdmin(session.user.role) && session.user.role !== Role.ADMIN) {
      delete validated.status;
    }

    const updated = await tenantService.updateTenant(id, validated, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(updated, 'Cập nhật thông tin tổ hợp thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật tổ hợp thất bại', 'UPDATE_FAILED', 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY PLATFORM ADMIN ONLY
    if (!isPlatformAdmin(session.user.role) && session.user.role !== Role.ADMIN) {
      return apiForbidden('Chỉ Quản trị viên cấp cao Nền tảng mới có quyền xóa tổ hợp');
    }

    const { id } = await params;
    const deleted = await tenantService.deleteTenant(id, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return apiSuccess(deleted, 'Xóa tổ hợp thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa tổ hợp thất bại', 'DELETE_FAILED', 400);
  }
}
