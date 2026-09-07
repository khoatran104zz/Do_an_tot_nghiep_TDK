import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { createInvoiceSchema } from '@/modules/invoice/invoice.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVerifiedResidentInfo } from '@/lib/authorization';

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

    // IDOR Protection: If resident user, strictly force filter to their verified apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo?.apartmentId) {
        return apiSuccess([], 'Lấy danh sách hóa đơn thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      apartmentId = residentInfo.apartmentId;
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

    const item = await invoiceService.createInvoice(validated, {
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return apiSuccess(item, 'Tạo hóa đơn thủ công thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Tạo hóa đơn thất bại', 'CREATE_FAILED', 400);
  }
}

