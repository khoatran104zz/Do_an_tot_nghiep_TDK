import { NextRequest } from 'next/server';
import { invoiceService } from '@/modules/invoice/invoice.service';
import { createInvoiceSchema } from '@/modules/invoice/invoice.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getVerifiedResidentInfo,
  requirePermission,
  getManagerAssignedBuildingIds,
  authorizeApartmentAccess,
} from '@/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    let apartmentId = searchParams.get('apartmentId') || undefined;
    const buildingId = searchParams.get('buildingId') || undefined;
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
    } else {
      const permCheck = requirePermission(session.user, 'invoice:read');
      if (!permCheck.allowed) return apiForbidden(permCheck.error);
    }

    let finalBuildingId = buildingId;
    let finalBuildingIds: string[] | undefined = undefined;

    if (session.user.role === 'MANAGER') {
      const assignedIds = session.user.assignedBuildingIds?.length
        ? session.user.assignedBuildingIds
        : await getManagerAssignedBuildingIds(session.user.id);

      if (assignedIds.length === 0) {
        return apiSuccess([], 'Lấy danh sách hóa đơn thành công', {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }

      if (buildingId) {
        if (!assignedIds.includes(buildingId)) {
          return apiForbidden('Bạn không có quyền truy cập hóa đơn của tòa nhà này');
        }
        finalBuildingId = buildingId;
      } else {
        finalBuildingIds = assignedIds;
      }
    }

    const result = await invoiceService.getInvoices({
      search,
      apartmentId,
      buildingId: finalBuildingId,
      buildingIds: finalBuildingIds,
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

    const permCheck = requirePermission(session.user, 'invoice:create');
    if (!permCheck.allowed) return apiForbidden(permCheck.error);

    const body = await req.json();
    const validated = createInvoiceSchema.parse(body);

    if (session.user.role === 'MANAGER') {
      const aptAuth = await authorizeApartmentAccess(session.user, validated.apartmentId);
      if (!aptAuth.allowed) {
        return apiForbidden(aptAuth.error || 'Bạn không có quyền tạo hóa đơn cho căn hộ thuộc tòa nhà khác');
      }
    }

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

