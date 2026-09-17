import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { generateMonthlyInvoicesSchema } from '@/modules/invoice/invoice.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { requirePermission } from '@/lib/authorization';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const permCheck = requirePermission(session.user, 'invoice:generate');
    if (!permCheck.allowed) return apiForbidden(permCheck.error);

    const body = await req.json();
    const validated = generateMonthlyInvoicesSchema.parse(body);

    let assignedBuildingIds: string[] | undefined = undefined;
    if (session.user.role === 'MANAGER') {
      const { getUserAssignedBuildingIds } = await import('@/lib/building-scope');
      assignedBuildingIds = await getUserAssignedBuildingIds(session.user.id);
      if (assignedBuildingIds.length === 0) {
        return apiForbidden('Bạn chưa được phân công quản lý tòa nhà nào');
      }
      if (validated.buildingId && !assignedBuildingIds.includes(validated.buildingId)) {
        return apiForbidden('Bạn không có quyền phát hành hóa đơn cho tòa nhà này');
      }
    }

    const result = await invoiceService.generateMonthlyInvoices(
      {
        ...validated,
        buildingIds: assignedBuildingIds,
      },
      {
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      }
    );

    return apiSuccess(
      result,
      `Tự động tạo ${result.generatedCount} hóa đơn cho kỳ ${result.billingMonth} (${result.skippedCount} căn đã có hóa đơn)`
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Tạo hóa đơn hàng loạt thất bại', 'GENERATE_FAILED', 400);
  }
}
