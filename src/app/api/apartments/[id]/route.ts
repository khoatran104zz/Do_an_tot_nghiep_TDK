import { NextRequest } from 'next/server';
import { apartmentService } from '@/modules/apartment/apartment.service';
import { apartmentSchema } from '@/modules/apartment/apartment.schema';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { prisma } from '@/lib/prisma';
import { authorizeApartmentAccess } from '@/lib/authorization';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const { id } = await params;

    // Check ownership for Resident
    const authCheck = await authorizeApartmentAccess(session.user, id);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error);
    }

    const item = await apartmentService.getApartmentById(id);
    return apiSuccess(item, 'Chi tiết căn hộ');
  } catch (error: any) {
    return apiNotFound(error.message || 'Không tìm thấy căn hộ');
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
    const validated = apartmentSchema.partial().parse(body);
    const updated = await apartmentService.updateApartment(id, validated);
    return apiSuccess(updated, 'Cập nhật thông tin căn hộ thành công');
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
    await apartmentService.deleteApartment(id);
    return apiSuccess(null, 'Xóa căn hộ thành công');
  } catch (error: any) {
    return apiError(error.message || 'Xóa căn hộ thất bại', 'DELETE_FAILED', 400);
  }
}
