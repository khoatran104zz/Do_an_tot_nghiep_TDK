import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!isAdmin(session.user.role)) {
      return apiForbidden('Chỉ Quản trị viên cấp cao (Admin) mới có quyền truy cập Bảng điều khiển hệ thống');
    }

    // 1. Platform-wide high-level counts
    const [
      totalBuildings,
      totalManagers,
      totalStaff,
      totalApartments,
      occupiedApartments,
      totalResidents,
      invoicesAggregate,
      overdueInvoices,
      openTicketsCount,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.building.count(),
      prisma.user.count({ where: { role: 'MANAGER' } }),
      prisma.user.count({
        where: {
          role: { in: ['STAFF_TECHNICIAN', 'STAFF_SECURITY', 'STAFF_RECEPTIONIST'] },
        },
      }),
      prisma.apartment.count(),
      prisma.apartment.count({ where: { status: 'OCCUPIED' } }),
      prisma.resident.count({ where: { status: 'RESIDING' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['UNPAID', 'OVERDUE'] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.feedback.count({
        where: { status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] } },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const totalRevenue = invoicesAggregate._sum.totalAmount || 0;
    const outstandingDebt = overdueInvoices._sum.totalAmount || 0;
    const globalOccupancyRate =
      totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;

    // 2. Cross-building comparison table
    const buildings = await prisma.building.findMany({
      include: {
        managers: {
          include: {
            manager: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        _count: {
          select: {
            apartments: true,
            facilities: true,
            assets: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute occupancy & revenue per building
    const crossBuildingStats = await Promise.all(
      buildings.map(async (b) => {
        const [occupied, debtAgg] = await Promise.all([
          prisma.apartment.count({
            where: { buildingId: b.id, status: 'OCCUPIED' },
          }),
          prisma.invoice.aggregate({
            where: {
              apartment: { buildingId: b.id },
              status: { in: ['UNPAID', 'OVERDUE'] },
            },
            _sum: { totalAmount: true },
          }),
        ]);

        const occRate =
          b._count.apartments > 0
            ? Math.round((occupied / b._count.apartments) * 100)
            : 0;

        return {
          id: b.id,
          code: b.code,
          name: b.name,
          address: b.address,
          totalApartments: b._count.apartments,
          occupiedApartments: occupied,
          occupancyRate: occRate,
          outstandingDebt: debtAgg._sum.totalAmount || 0,
          managers: b.managers.map((m) => m.manager),
        };
      })
    );

    return apiSuccess(
      {
        kpis: {
          totalBuildings,
          totalManagers,
          totalStaff,
          totalApartments,
          occupiedApartments,
          globalOccupancyRate,
          totalResidents,
          totalRevenue,
          outstandingDebt,
          unpaidInvoicesCount: overdueInvoices._count,
          openTicketsCount,
        },
        crossBuildingStats,
        recentAuditLogs,
      },
      'Lấy dữ liệu Admin Platform Dashboard thành công'
    );
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải dữ liệu Admin Dashboard', 'FETCH_FAILED', 500);
  }
}
