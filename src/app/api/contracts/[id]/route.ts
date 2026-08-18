import { NextRequest } from 'next/server';
import { contractService } from '@/modules/contract/contract.service';
import { contractSchema } from '@/modules/contract/contract.schema';
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
    const item = await contractService.getContractById(id);
    return apiSuccess(item, 'Chi tiết hợp đồng');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy hợp đồng');
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const { id } = await params;
    const body = await req.json();
    const validated = contractSchema.partial().parse(body);
    const updated = await contractService.updateContract(id, validated);
    return apiSuccess(updated, 'Cập nhật hợp đồng thành công');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Cập nhật thất bại', 'UPDATE_FAILED', 400);
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
    await contractService.deleteContract(id);
    return apiSuccess(null, 'Xóa hợp đồng thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa hợp đồng thất bại', 'DELETE_FAILED', 400);
  }
}
