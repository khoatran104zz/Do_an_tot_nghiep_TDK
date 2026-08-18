import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { createInvoiceSchema } from '@/modules/invoice/invoice.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    let apartmentId = searchParams.get('apartmentId') || undefined;
    const billingMonth = searchParams.get('billingMonth') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // If resident user, filter by resident's apartment
    if (session.user.role === 'RESIDENT' && session.user.apartmentId) {
      apartmentId = session.user.apartmentId;
    }

    const result = await invoiceService.getInvoices({
      search,
      apartmentId,
      billingMonth,
      status,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách hóa đơn thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách hóa đơn', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = createInvoiceSchema.parse(body);
    const item = await invoiceService.createInvoice(validated);
    return apiSuccess(item, 'Tạo hóa đơn thủ công thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Tạo hóa đơn thất bại', 'CREATE_FAILED', 400);
  }
}
