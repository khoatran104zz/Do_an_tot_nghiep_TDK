import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';
import { z } from 'zod';

const updateManagerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự').optional(),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Admin mới có quyền xem thông tin chi tiết Manager');
    }

    const { id } = await params;
    const manager = await prisma.user.findUnique({
      where: { id, role: 'MANAGER' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managedBuildings: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!manager) {
      return apiNotFound('Không tìm thấy Quản lý tòa nhà');
    }

    return apiSuccess(manager, 'Chi tiết Quản lý tòa nhà');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải thông tin Manager', 'FETCH_FAILED', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Admin mới có quyền cập nhật tài khoản Manager');
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateManagerSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id, role: 'MANAGER' },
      data: validated,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        action: 'UPDATE_MANAGER',
        entity: 'USER',
        entityId: id,
        metadata: validated,
      },
    });

    return apiSuccess(updated, 'Cập nhật thông tin Quản lý thành công');
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

    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Admin mới có quyền vô hiệu hóa Manager');
    }

    const { id } = await params;

    // Safety check: Cannot delete self
    if (id === session.user.id) {
      return apiError('Bạn không thể tự xóa hoặc vô hiệu hóa tài khoản của chính mình', 'CANNOT_DELETE_SELF', 400);
    }

    // Soft disable for safety
    const updated = await prisma.user.update({
      where: { id, role: 'MANAGER' },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        action: 'DEACTIVATE_MANAGER',
        entity: 'USER',
        entityId: id,
        metadata: { managerEmail: updated.email },
      },
    });

    return apiSuccess(null, 'Đã vô hiệu hóa tài khoản Quản lý tòa nhà');
  } catch (error: any) {
    return apiError(error.message || 'Thao tác thất bại', 'DELETE_FAILED', 400);
  }
}
