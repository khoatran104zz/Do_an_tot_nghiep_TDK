import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { generateMonthlyInvoicesSchema } from '@/modules/invoice/invoice.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = generateMonthlyInvoicesSchema.parse(body);
    const result = await invoiceService.generateMonthlyInvoices(validated);

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
