import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createManagerSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  buildingIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY ADMIN ONLY
    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao (Admin) mới có quyền quản lý danh sách Manager');
    }

    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
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
            building: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = managers.map((m) => ({
      id: m.id,
      email: m.email,
      fullName: m.fullName,
      phone: m.phone,
      avatarUrl: m.avatarUrl,
      role: m.role,
      isActive: m.isActive,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      assignedBuildings: m.managedBuildings.map((mb) => mb.building),
    }));

    return apiSuccess(formatted, 'Lấy danh sách Quản lý tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải danh sách Manager', 'FETCH_FAILED', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    // STRICTLY ADMIN ONLY
    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao (Admin) mới có quyền tạo tài khoản Manager');
    }

    const body = await req.json();
    const validated = createManagerSchema.parse(body);

    // Check unique email
    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });
    if (existing) {
      return apiError('Email này đã được sử dụng trong hệ thống', 'DUPLICATE_EMAIL', 400);
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const newManager = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validated.email.toLowerCase().trim(),
          passwordHash,
          fullName: validated.fullName,
          phone: validated.phone || null,
          role: 'MANAGER',
          isActive: true,
        },
      });

      if (validated.buildingIds && validated.buildingIds.length > 0) {
        await tx.managerBuilding.createMany({
          data: validated.buildingIds.map((bId) => ({
            managerId: user.id,
            buildingId: bId,
          })),
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          actorRole: session.user.role,
          action: 'CREATE_MANAGER',
          entity: 'USER',
          entityId: user.id,
          metadata: {
            managerName: user.fullName,
            assignedBuildingIds: validated.buildingIds || [],
          },
        },
      });

      return user;
    });

    return apiSuccess(
      {
        id: newManager.id,
        email: newManager.email,
        fullName: newManager.fullName,
        role: newManager.role,
      },
      'Tạo tài khoản Quản lý tòa nhà thành công',
      undefined,
      201
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(error.errors[0]?.message || 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', 400);
    }
    return apiError(error.message || 'Tạo tài khoản Manager thất bại', 'CREATE_FAILED', 400);
  }
}
