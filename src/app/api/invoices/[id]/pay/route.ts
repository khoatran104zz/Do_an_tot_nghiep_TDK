import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { processPaymentSchema } from '@/modules/invoice/invoice.schema';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const validated = processPaymentSchema.parse(body);

    const paidInvoice = await invoiceService.processPayment(id, validated);
    return apiSuccess(paidInvoice, 'Thanh toán hóa đơn dịch vụ thành công!');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Phương thức thanh toán không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thanh toán thất bại', 'PAYMENT_FAILED', 400);
  }
}
