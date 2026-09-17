import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { isAdmin, ROLE_PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao (Admin) mới có quyền xem thông tin phân quyền hệ thống');
    }

    // Role definitions
    const roles = [
      {
        code: 'ADMIN',
        name: 'Quản trị viên Hệ thống (Platform Admin)',
        scope: 'GLOBAL',
        description: 'Toàn quyền cấu hình, quản lý tòa nhà, phân quyền, người dùng và báo cáo toàn hệ thống.',
        userCount: await prisma.user.count({ where: { role: 'ADMIN' } }),
      },
      {
        code: 'MANAGER',
        name: 'Quản lý Tòa nhà (Building Manager)',
        scope: 'BUILDING_SCOPED',
        description: 'Vận hành các tòa nhà được phân công. Quản lý căn hộ, cư dân, hợp đồng, hóa đơn, sự cố và nhân viên.',
        userCount: await prisma.user.count({ where: { role: 'MANAGER' } }),
      },
      {
        code: 'STAFF_TECHNICIAN',
        name: 'Kỹ thuật viên (Technician)',
        scope: 'OPERATIONAL',
        description: 'Xử lý phản ánh kỹ thuật, bảo trì định kỳ tài sản tòa nhà, kiểm tra thiết bị.',
        userCount: await prisma.user.count({ where: { role: 'STAFF_TECHNICIAN' } }),
      },
      {
        code: 'STAFF_SECURITY',
        name: 'Nhân viên An ninh (Security)',
        scope: 'OPERATIONAL',
        description: 'Kiểm soát phương tiện, thẻ gửi xe, cổng ra vào và check-in khách.',
        userCount: await prisma.user.count({ where: { role: 'STAFF_SECURITY' } }),
      },
      {
        code: 'STAFF_RECEPTIONIST',
        name: 'Lễ tân (Receptionist)',
        scope: 'OPERATIONAL',
        description: 'Tiếp nhận bưu kiện, hỗ trợ đón khách và tra cứu thông tin cơ bản cư dân.',
        userCount: await prisma.user.count({ where: { role: 'STAFF_RECEPTIONIST' } }),
      },
      {
        code: 'RESIDENT',
        name: 'Cư dân (Resident)',
        scope: 'SELF',
        description: 'Tra cứu thông tin căn hộ, nộp phí, báo sự cố và sử dụng tiện ích.',
        userCount: await prisma.user.count({ where: { role: 'RESIDENT' } }),
      },
    ];

    // Recent RBAC audit logs
    const rbacAuditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'CREATE_MANAGER',
            'UPDATE_MANAGER',
            'DEACTIVATE_MANAGER',
            'ASSIGN_MANAGER_BUILDINGS',
            'CHANGE_STAFF_ROLE',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return apiSuccess({
      roles,
      matrix: ROLE_PERMISSIONS,
      auditLogs: rbacAuditLogs,
    }, 'Lấy thông tin ma trận phân quyền thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải ma trận phân quyền', 'FETCH_FAILED', 500);
  }
}
