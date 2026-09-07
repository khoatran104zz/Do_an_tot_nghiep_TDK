import { NextRequest } from 'next/server';
import { contractService } from '@/modules/contract/contract.service';
import { contractSchema } from '@/modules/contract/contract.schema';
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
    const type = (searchParams.get('type') as any) || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const expiringSoon = searchParams.get('expiringSoon') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // IDOR Protection: If resident user, strictly force filter to their verified apartment
    if (session.user.role === 'RESIDENT') {
      const residentInfo = await getVerifiedResidentInfo(session.user.id);
      if (!residentInfo?.apartmentId) {
        return apiSuccess([], 'Lấy danh sách hợp đồng thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      apartmentId = residentInfo.apartmentId;
    }

    const result = await contractService.getContracts({
      search,
      apartmentId,
      type,
      status,
      expiringSoon,
      page,
      limit,
    });

    return apiSuccess(result.items, 'Lấy danh sách hợp đồng thành công', {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    return apiError(error.message || 'Lỗi lấy danh sách hợp đồng', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === 'RESIDENT') return apiForbidden();

    const body = await req.json();
    const validated = contractSchema.parse(body);
    const item = await contractService.createContract(validated);
    return apiSuccess(item, 'Thêm mới hợp đồng thành công', undefined, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Thêm mới hợp đồng thất bại', 'CREATE_FAILED', 400);
  }
}

