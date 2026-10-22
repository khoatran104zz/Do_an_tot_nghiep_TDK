import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { isAdmin, isPlatformAdmin, isTenantAdmin } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@prisma/client';

const createManagerSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').optional().nullable(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  tenantId: z.string().optional().nullable(),
  buildingIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const user = session.user;

    // STRICTLY ADMIN ONLY
    if (!isAdmin(user.role)) {
      return apiForbidden('Chỉ Quản trị viên (Admin) mới có quyền quản lý danh sách Manager');
    }

    const whereClause: any = { role: 'MANAGER' };

    // Tenant Admin only sees managers of their own tenant
    if (isTenantAdmin(user.role) || (user.role === Role.ADMIN && user.tenantId)) {
      if (!user.tenantId) {
        return apiForbidden('Tài khoản chưa được liên kết với tổ hợp');
      }
      whereClause.tenantId = user.tenantId;
    } else if (isPlatformAdmin(user.role)) {
      const { searchParams } = new URL(req.url);
      const queryTenantId = searchParams.get('tenantId');
      if (queryTenantId) {
        whereClause.tenantId = queryTenantId;
      }
    }

    const managers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        tenantId: true,
        tenant: {
          select: { id: true, code: true, name: true },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
        managedBuildings: {
          include: {
            building: {
              select: { id: true, code: true, name: true, tenantId: true },
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
      tenantId: m.tenantId,
      tenant: m.tenant,
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

    const user = session.user;

    // STRICTLY ADMIN ONLY
    if (!isAdmin(user.role)) {
      return apiForbidden('Chỉ Quản trị viên (Admin) mới có quyền tạo tài khoản Manager');
    }

    const body = await req.json();
    const validated = createManagerSchema.parse(body);

    let targetTenantId = user.tenantId;

    if (isTenantAdmin(user.role) || (user.role === Role.ADMIN && user.tenantId)) {
      if (!user.tenantId) {
        return apiForbidden('Tài khoản quản trị chưa được liên kết với tổ hợp');
      }
      targetTenantId = user.tenantId;
    } else if (isPlatformAdmin(user.role)) {
      if (!validated.tenantId) {
        return apiError('Vui lòng chỉ định tổ hợp (tenantId) cho tài khoản Manager', 'MISSING_TENANT_ID', 400);
      }
      targetTenantId = validated.tenantId;
    }

    // Verify building assignment belongs strictly to targetTenantId
    if (validated.buildingIds && validated.buildingIds.length > 0) {
      const invalidBuildings = await prisma.building.findMany({
        where: {
          id: { in: validated.buildingIds },
          NOT: { tenantId: targetTenantId },
        },
        select: { id: true, name: true },
      });

      if (invalidBuildings.length > 0) {
        return apiForbidden(
          `Không thể phân công Manager vào tòa nhà (${invalidBuildings.map((b) => b.name).join(', ')}) thuộc tổ hợp khác!`
        );
      }
    }

    // Check unique email
    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });
    if (existing) {
      return apiError('Email này đã được sử dụng trong hệ thống', 'DUPLICATE_EMAIL', 400);
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const newManager = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: validated.email.toLowerCase().trim(),
          passwordHash,
          fullName: validated.fullName,
          phone: validated.phone || null,
          role: 'MANAGER',
          tenantId: targetTenantId,
          isActive: true,
        },
      });

      if (validated.buildingIds && validated.buildingIds.length > 0) {
        await tx.managerBuilding.createMany({
          data: validated.buildingIds.map((bId) => ({
            managerId: createdUser.id,
            buildingId: bId,
          })),
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'CREATE_MANAGER',
          entity: 'USER',
          entityId: createdUser.id,
          metadata: {
            managerName: createdUser.fullName,
            tenantId: targetTenantId,
            assignedBuildingIds: validated.buildingIds || [],
          },
        },
      });

      return createdUser;
    });

    return apiSuccess(
      {
        id: newManager.id,
        email: newManager.email,
        fullName: newManager.fullName,
        role: newManager.role,
        tenantId: newManager.tenantId,
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
