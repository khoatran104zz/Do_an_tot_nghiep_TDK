import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();
    if (session.user.role === Role.RESIDENT) return apiForbidden();

    const staffList = await prisma.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.MANAGER] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return apiSuccess(staffList, 'Danh sách nhân sự quản lý & kỹ thuật');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi tải danh sách nhân sự', 'FETCH_STAFF_FAILED', 500);
  }
}
