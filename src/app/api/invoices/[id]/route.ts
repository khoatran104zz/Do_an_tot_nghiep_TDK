import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;
    const item = await invoiceService.getInvoiceById(id);
    return apiSuccess(item, 'Chi tiết hóa đơn');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy hóa đơn');
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const { id } = await params;
    await invoiceService.deleteInvoice(id);
    return apiSuccess(null, 'Xóa hóa đơn thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa hóa đơn thất bại', 'DELETE_FAILED', 400);
  }
}
