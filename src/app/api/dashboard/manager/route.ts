import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';
import { isManagementRole } from '@/lib/permissions';
import { authorizeBuildingAccess, getManagerAssignedBuildingIds } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiUnauthorized();

    if (!isManagementRole(session.user.role)) {
      return apiForbidden('Chỉ Ban Quản Lý (Admin / Manager) mới có quyền truy cập');
    }

    const { searchParams } = new URL(req.url);
    let buildingId = searchParams.get('buildingId');

    // 1. Resolve active building for manager
    if (!buildingId) {
      if (session.user.role === 'ADMIN') {
        const firstBuilding = await prisma.building.findFirst({
          orderBy: { name: 'asc' },
          select: { id: true },
        });
        buildingId = firstBuilding?.id || null;
      } else {
        const assignedIds = await getManagerAssignedBuildingIds(session.user.id);
        buildingId = assignedIds[0] || null;
      }
    }

    if (!buildingId) {
      return apiSuccess({
        building: null,
        kpis: { totalApartments: 0, occupied: 0, debt: 0, openTickets: 0 },
        message: 'Bạn chưa được phân công quản lý tòa nhà nào.',
      });
    }

    // Verify building scope
    const authCheck = await authorizeBuildingAccess(session.user, buildingId);
    if (!authCheck.allowed) {
      return apiForbidden(authCheck.error || 'Bạn không có quyền truy cập tòa nhà này');
    }

    // 2. Fetch Building Details
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        blocks: {
          select: { id: true, code: true, name: true, totalFloors: true },
        },
      },
    });

    // 3. Compute building-scoped metrics
    const [
      totalApartments,
      occupiedApartments,
      vacantApartments,
      maintenanceApartments,
      totalResidents,
      activeContracts,
      unpaidInvoicesAgg,
      openTickets,
      criticalTickets,
      todayVisitors,
      pendingParcels,
      activeBookings,
    ] = await Promise.all([
      prisma.apartment.count({ where: { buildingId } }),
      prisma.apartment.count({ where: { buildingId, status: 'OCCUPIED' } }),
      prisma.apartment.count({ where: { buildingId, status: 'VACANT' } }),
      prisma.apartment.count({ where: { buildingId, status: 'UNDER_MAINTENANCE' } }),
      prisma.resident.count({
        where: { apartment: { buildingId }, status: 'RESIDING' },
      }),
      prisma.contract.count({
        where: { apartment: { buildingId }, status: 'ACTIVE' },
      }),
      prisma.invoice.aggregate({
        where: {
          apartment: { buildingId },
          status: { in: ['UNPAID', 'OVERDUE'] },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.feedback.count({
        where: {
          apartment: { buildingId },
          status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] },
        },
      }),
      prisma.feedback.findMany({
        where: {
          apartment: { buildingId },
          status: { in: ['NEW', 'ASSIGNED', 'PROCESSING'] },
          priority: { in: ['URGENT', 'CRITICAL'] },
        },
        include: {
          apartment: { select: { code: true } },
          resident: { select: { fullName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.visitorPass.count({
        where: {
          apartment: { buildingId },
          visitDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.parcelDelivery.count({
        where: {
          apartment: { buildingId },
          status: { in: ['RECEIVED', 'NOTIFIED'] },
        },
      }),
      prisma.facilityBooking.count({
        where: {
          facility: { buildingId },
          status: 'CONFIRMED',
          bookingDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const occupancyRate =
      totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;

    return apiSuccess({
      building,
      kpis: {
        totalApartments,
        occupiedApartments,
        vacantApartments,
        maintenanceApartments,
        occupancyRate,
        totalResidents,
        activeContracts,
        outstandingDebt: unpaidInvoicesAgg._sum.totalAmount || 0,
        unpaidInvoicesCount: unpaidInvoicesAgg._count,
        openTicketsCount: openTickets,
        todayVisitors,
        pendingParcels,
        activeBookings,
      },
      criticalTickets,
    }, 'Lấy dữ liệu vận hành tòa nhà thành công');
  } catch (error: any) {
    return apiError(error.message || 'Lỗi khi tải dữ liệu Manager Dashboard', 'FETCH_FAILED', 500);
  }
}
