import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { processPaymentSchema } from '@/modules/invoice/invoice.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authorizeInvoiceAccess } from '@/lib/authorization';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Rate Limiting: max 5 payment attempts per minute
    const rateLimitResult = rateLimiter.apply(req, {
      maxRequests: 5,
      windowMs: 60 * 1000,
      keyPrefix: 'pay_invoice',
    });

    if (!rateLimitResult.allowed) {
      return apiError(
        'Bạn đã thực hiện quá nhiều giao dịch thanh toán trong thời gian ngắn. Vui lòng thử lại sau 1 phút.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const invoice = await invoiceService.getInvoiceById(id);

    // 3. IDOR Ownership Authorization check
    const authCheck = await authorizeInvoiceAccess(session.user, invoice.apartmentId);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error);
    }

    // 4. Input Validation
    const body = await req.json().catch(() => ({}));
    const validated = processPaymentSchema.parse(body);

    // 5. Process Payment with Audit Context
    const paidInvoice = await invoiceService.processPayment(id, validated, {
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return apiSuccess(paidInvoice, 'Thanh toán hóa đơn dịch vụ thành công!');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Phương thức thanh toán không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thanh toán thất bại', 'PAYMENT_FAILED', 400);
  }
}

