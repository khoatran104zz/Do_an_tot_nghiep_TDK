import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { isAdmin, isPlatformAdmin, isTenantAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    const user = session.user;
    if (!isAdmin(user.role)) {
      return apiForbidden('Chỉ Quản trị viên mới có quyền truy cập Bảng điều khiển quản trị');
    }

    const isPlatform = isPlatformAdmin(user.role) || (user.role === Role.ADMIN && !user.tenantId);
    const tenantId = user.tenantId;

    // Filter clauses based on role
    const buildingWhere: any = isPlatform ? {} : { tenantId };
    const apartmentWhere: any = isPlatform
      ? {}
      : {
          OR: [
            { buildingRef: { tenantId } },
            { block: { building: { tenantId } } },
          ],
        };
    const managerWhere: any = isPlatform ? { role: 'MANAGER' } : { role: 'MANAGER', tenantId };
    const staffWhere: any = isPlatform
      ? { role: { in: ['STAFF_TECHNICIAN', 'STAFF_SECURITY', 'STAFF_RECEPTIONIST'] } }
      : {
          role: { in: ['STAFF_TECHNICIAN', 'STAFF_SECURITY', 'STAFF_RECEPTIONIST'] },
          tenantId,
        };
    const invoiceWhere: any = isPlatform
      ? {}
      : {
          apartment: {
            OR: [
              { buildingRef: { tenantId } },
              { block: { building: { tenantId } } },
            ],
          },
        };
    const ticketWhere: any = isPlatform
      ? {}
      : {
          apartment: {
            OR: [
              { buildingRef: { tenantId } },
              { block: { building: { tenantId } } },
            ],
          },
        };

    // 1. High-level counts
    const [
      totalTenants,
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
      isPlatform ? prisma.tenant.count() : 1,
      prisma.building.count({ where: buildingWhere }),
      prisma.user.count({ where: managerWhere }),
      prisma.user.count({ where: staffWhere }),
      prisma.apartment.count({ where: apartmentWhere }),
      prisma.apartment.count({ where: { ...apartmentWhere, status: 'OCCUPIED' } }),
      prisma.resident.count({
        where: isPlatform
          ? { status: 'RESIDING' }
          : {
              status: 'RESIDING',
              occupancies: {
                some: {
                  isLivingHere: true,
                  apartment: apartmentWhere,
                },
              },
            },
      }),
      prisma.invoice.aggregate({
        where: { ...invoiceWhere, status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...invoiceWhere, status: { in: ['UNPAID', 'OVERDUE'] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.feedback.count({
        where: { ...ticketWhere, status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] } },
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
      where: buildingWhere,
      include: {
        tenant: {
          select: { id: true, code: true, name: true },
        },
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
          tenant: b.tenant,
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
          totalTenants,
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
        tenantContext: {
          isPlatformAdmin: isPlatform,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
          tenantCode: user.tenantCode,
        },
        crossBuildingStats,
        recentAuditLogs,
      },
      'Lấy dữ liệu Admin Dashboard thành công'
    );
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải dữ liệu Admin Dashboard', 'FETCH_FAILED', 500);
  }
}
