import { prisma } from '@/lib/prisma';

export class DashboardRepository {
  /**
   * Legacy basic stats method for backward compatibility
   */
  async getStats() {
    const [
      totalApartments,
      occupiedApartments,
      vacantApartments,
      maintenanceApartments,
      totalResidents,
      activeContracts,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      totalTickets,
      newTickets,
      processingTickets,
      resolvedTickets,
    ] = await Promise.all([
      prisma.apartment.count(),
      prisma.apartment.count({ where: { status: 'OCCUPIED' } }),
      prisma.apartment.count({ where: { status: 'VACANT' } }),
      prisma.apartment.count({ where: { status: 'UNDER_MAINTENANCE' } }),
      prisma.resident.count({ where: { status: 'RESIDING' } }),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'UNPAID' } }),
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: 'NEW' } }),
      prisma.feedback.count({ where: { status: 'PROCESSING' } }),
      prisma.feedback.count({ where: { status: 'RESOLVED' } }),
    ]);

    const occupancyRate = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;
    const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

    return {
      overview: {
        totalApartments,
        occupiedApartments,
        occupancyRate,
        totalResidents,
        activeContracts,
        totalInvoices,
        paidInvoices,
        collectionRate,
        totalTickets,
        pendingTickets: newTickets + processingTickets,
        resolvedTickets,
      },
    };
  }

  /**
   * Enterprise Management Dashboard Aggregation API
   * Fetches real, database-computed operational metrics in parallel
   */
  async getManagementDashboard(monthsCount: number = 6) {
    // 1. Determine timeline window based on latest billing month or current date
    const latestInvoice = await prisma.invoice.findFirst({
      select: { billingMonth: true },
      orderBy: { billingMonth: 'desc' },
    });

    let anchorYear: number;
    let anchorMonth: number; // 1-12

    if (latestInvoice?.billingMonth && /^\d{4}-\d{2}$/.test(latestInvoice.billingMonth)) {
      const [y, m] = latestInvoice.billingMonth.split('-').map(Number);
      anchorYear = y;
      anchorMonth = m;
    } else {
      const now = new Date();
      anchorYear = now.getFullYear();
      anchorMonth = now.getMonth() + 1;
    }

    // Build array of YYYY-MM strings for the required duration (6 or 12 months)
    const monthKeys: string[] = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(anchorYear, anchorMonth - 1 - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(ym);
    }

    const currentMonthKey = monthKeys[monthKeys.length - 1];
    const prevMonthKey = monthKeys[monthKeys.length - 2] || currentMonthKey;

    const startOfCurrentMonth = new Date(anchorYear, anchorMonth - 1, 1);

    // 2. Parallel Database Aggregation Queries
    const [
      // KPI 1: Apartments
      totalApartments,
      prevApartmentsCount,

      // KPI 2: Occupancy breakdown
      occupancyGroupBy,

      // KPI 3: Residents
      totalResidents,
      prevResidentsCount,

      // KPI 4: Monthly revenue (current month billed & prev month billed)
      currentMonthBilled,
      currentMonthCollected,
      prevMonthBilled,

      // KPI 5: Outstanding debt
      totalOutstanding,
      prevMonthOutstanding,

      // KPI 6: Maintenance tickets
      activeTicketsCount,
      resolvedTicketsCount,
      prevActiveTicketsCount,

      // SECTION 3: Revenue analytics by month
      revenueGroupBy,

      // SECTION 5: Maintenance operations breakdown
      ticketStatusGroupBy,
      ticketPriorityGroupBy,
      criticalTickets,

      // SECTION 7: Real activity events
      recentPaidInvoices,
      recentTicketEvents,
      recentAnnouncements,

      // SECTION 8: Alerts
      overdueInvoicesAgg,
      urgentPendingTicketsCount,
      expiringContractsCount,

      // SECTION 9: Parking & Vehicle Operations
      totalVehiclesCount,
      activeCarsCount,
      activeMotorbikesCount,
      activeParkingCardsCount,
      pendingApprovalsCount,
      parkingFeeCategories,
    ] = await Promise.all([
      // 1. Total apartments & previous month count
      prisma.apartment.count(),
      prisma.apartment.count({ where: { createdAt: { lt: startOfCurrentMonth } } }),

      // 2. Occupancy by status
      prisma.apartment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // 3. Total active residents & previous month count
      prisma.resident.count({ where: { status: 'RESIDING' } }),
      prisma.resident.count({ where: { status: 'RESIDING', createdAt: { lt: startOfCurrentMonth } } }),

      // 4. Current month revenue (Billed & Collected)
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { billingMonth: currentMonthKey, status: { not: 'CANCELLED' } },
      }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { billingMonth: currentMonthKey, status: 'PAID' },
      }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { billingMonth: prevMonthKey, status: { not: 'CANCELLED' } },
      }),

      // 5. Total outstanding debt
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['UNPAID', 'OVERDUE'] } },
      }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { billingMonth: prevMonthKey, status: { in: ['UNPAID', 'OVERDUE'] } },
      }),

      // 6. Tickets
      prisma.feedback.count({ where: { status: { in: ['NEW', 'PROCESSING'] } } }),
      prisma.feedback.count({ where: { status: 'RESOLVED' } }),
      prisma.feedback.count({
        where: { status: { in: ['NEW', 'PROCESSING'] }, createdAt: { lt: startOfCurrentMonth } },
      }),

      // Section 3: Revenue grouping over target months
      prisma.invoice.groupBy({
        by: ['billingMonth', 'status'],
        _sum: { totalAmount: true },
        where: {
          billingMonth: { in: monthKeys },
          status: { not: 'CANCELLED' },
        },
      }),

      // Section 5: Ticket distribution
      prisma.feedback.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.feedback.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
      prisma.feedback.findMany({
        where: {
          status: { in: ['NEW', 'PROCESSING'] },
          priority: { in: ['URGENT', 'HIGH'] },
        },
        include: {
          apartment: { select: { code: true, building: true } },
          resident: { select: { fullName: true, phone: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),

      // Section 7: Activity feed events
      prisma.invoice.findMany({
        where: { status: 'PAID', paidAt: { not: null } },
        select: {
          id: true,
          code: true,
          totalAmount: true,
          paidAt: true,
          paymentMethod: true,
          apartment: { select: { code: true } },
        },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),
      prisma.feedback.findMany({
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
          resident: { select: { fullName: true } },
          apartment: { select: { code: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.notification.findMany({
        select: {
          id: true,
          title: true,
          createdAt: true,
          sender: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),

      // Section 8: Alerts
      prisma.invoice.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
        where: { status: 'OVERDUE' },
      }),
      prisma.feedback.count({
        where: { status: { in: ['NEW', 'PROCESSING'] }, priority: 'URGENT' },
      }),
      prisma.contract.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Section 9: Parking & Vehicle Operations
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { type: 'CAR', status: 'ACTIVE' } }),
      prisma.vehicle.count({ where: { type: 'MOTORBIKE', status: 'ACTIVE' } }),
      prisma.parkingCard.count({ where: { status: 'ACTIVE' } }),
      prisma.vehicle.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.feeCategory.findMany({
        where: { code: { in: ['PARKING_CAR', 'PARKING_MOTO'] } },
        select: { code: true, unitPrice: true },
      }),
    ]);

    // 3. Process Occupancy Numbers
    let occupiedCount = 0;
    let vacantCount = 0;
    let maintenanceCount = 0;

    occupancyGroupBy.forEach((g) => {
      if (g.status === 'OCCUPIED') occupiedCount = g._count.id;
      if (g.status === 'VACANT') vacantCount = g._count.id;
      if (g.status === 'UNDER_MAINTENANCE') maintenanceCount = g._count.id;
    });

    const totalApts = totalApartments || (occupiedCount + vacantCount + maintenanceCount);
    const occupancyRate = totalApts > 0 ? (occupiedCount / totalApts) * 100 : 0;

    // 4. Process KPI Trends
    const aptsDiff = totalApartments - prevApartmentsCount;
    const aptsPercentChange = prevApartmentsCount > 0 ? (aptsDiff / prevApartmentsCount) * 100 : 0;

    const residentsDiff = totalResidents - prevResidentsCount;
    const residentsPercentChange = prevResidentsCount > 0 ? (residentsDiff / prevResidentsCount) * 100 : 0;

    const currentRev = currentMonthBilled._sum.totalAmount || 0;
    const prevRev = prevMonthBilled._sum.totalAmount || 0;
    const revDiff = currentRev - prevRev;
    const revPercentChange = prevRev > 0 ? (revDiff / prevRev) * 100 : 0;

    const currentDebt = totalOutstanding._sum.totalAmount || 0;
    const prevDebt = prevMonthOutstanding._sum.totalAmount || 0;
    const debtDiff = currentDebt - prevDebt;
    const debtPercentChange = prevDebt > 0 ? (debtDiff / prevDebt) * 100 : 0;

    const ticketsDiff = activeTicketsCount - prevActiveTicketsCount;
    const ticketsPercentChange = prevActiveTicketsCount > 0 ? (ticketsDiff / prevActiveTicketsCount) * 100 : 0;

    // 5. Build Monthly Revenue Analytics Structure
    const revenueAnalytics = monthKeys.map((mKey) => {
      let billed = 0;
      let collected = 0;

      revenueGroupBy.forEach((row) => {
        if (row.billingMonth === mKey) {
          const amt = row._sum.totalAmount || 0;
          billed += amt;
          if (row.status === 'PAID') {
            collected += amt;
          }
        }
      });

      const outstanding = Math.max(0, billed - collected);
      const collectionRate = billed > 0 ? (collected / billed) * 100 : 0;

      return {
        month: mKey,
        monthLabel: `T${mKey.slice(5)}/${mKey.slice(2, 4)}`,
        billed,
        collected,
        outstanding,
        collectionRate: Math.round(collectionRate),
      };
    });

    // 6. Build Maintenance Breakdown Structure
    const ticketStatusMap: Record<string, number> = {
      NEW: 0,
      PROCESSING: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };
    ticketStatusGroupBy.forEach((g) => {
      ticketStatusMap[g.status] = g._count.id;
    });

    const ticketPriorityMap: Record<string, number> = {
      URGENT: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    ticketPriorityGroupBy.forEach((g) => {
      ticketPriorityMap[g.priority] = g._count.id;
    });

    // 7. Compose Live Activity Feed
    const activities: Array<{
      id: string;
      type: 'PAYMENT' | 'TICKET' | 'ANNOUNCEMENT';
      title: string;
      description: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    }> = [];

    recentPaidInvoices.forEach((inv) => {
      if (inv.paidAt) {
        activities.push({
          id: `pay_${inv.id}`,
          type: 'PAYMENT',
          title: `Căn hộ ${inv.apartment.code} thanh toán hóa đơn`,
          description: `Đã nộp thành công ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.totalAmount)} (${inv.code})`,
          timestamp: inv.paidAt,
          metadata: { amount: inv.totalAmount, code: inv.code },
        });
      }
    });

    recentTicketEvents.forEach((t) => {
      activities.push({
        id: `ticket_${t.id}`,
        type: 'TICKET',
        title: `Sự cố: ${t.title}`,
        description: `Căn hộ ${t.apartment?.code || ''} (${t.resident?.fullName || 'Cư dân'}) - Trạng thái: ${t.status}`,
        timestamp: t.updatedAt,
        metadata: { code: t.code, status: t.status, priority: t.priority },
      });
    });

    recentAnnouncements.forEach((n) => {
      activities.push({
        id: `notif_${n.id}`,
        type: 'ANNOUNCEMENT',
        title: `Đã phát thông báo: ${n.title}`,
        description: `Bởi ${n.sender?.fullName || 'Ban Quản Lý'} tới toàn thể cư dân`,
        timestamp: n.createdAt,
      });
    });

    // Sort activities descending by time and take top 8
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const activityFeed = activities.slice(0, 8);

    // 8. Overall collection rate for this current month
    const currentMonthCollectedAmount = currentMonthCollected._sum.totalAmount || 0;
    const currentCollectionRate = currentRev > 0 ? (currentMonthCollectedAmount / currentRev) * 100 : 0;

    // 9. Parking & Vehicle metrics calculation
    const carFeePrice = parkingFeeCategories.find((f) => f.code === 'PARKING_CAR')?.unitPrice || 1200000;
    const motoFeePrice = parkingFeeCategories.find((f) => f.code === 'PARKING_MOTO')?.unitPrice || 100000;
    const estimatedParkingRevenue = (activeCarsCount * carFeePrice) + (activeMotorbikesCount * motoFeePrice);

    return {
      timeContext: {
        anchorMonth: currentMonthKey,
        prevMonth: prevMonthKey,
        today: new Date().toISOString(),
      },
      kpis: {
        totalApartments: {
          value: totalApartments,
          prevValue: prevApartmentsCount,
          changePercent: Number(aptsPercentChange.toFixed(1)),
          isPositive: aptsPercentChange >= 0,
          description: 'Tổng số căn hộ được khởi tạo trên toàn bộ tòa nhà',
        },
        occupancyRate: {
          value: Number(occupancyRate.toFixed(1)),
          occupiedCount,
          vacantCount,
          maintenanceCount,
          totalApartments: totalApts,
          changePercent: 0,
          isPositive: true,
          description: 'Tỷ lệ căn hộ đang có cư dân sinh sống trên tổng số căn',
        },
        totalResidents: {
          value: totalResidents,
          prevValue: prevResidentsCount,
          changePercent: Number(residentsPercentChange.toFixed(1)),
          isPositive: residentsPercentChange >= 0,
          description: 'Tổng số cư dân có hồ sơ đang cư trú chính thức',
        },
        monthlyRevenue: {
          value: currentRev,
          collectedValue: currentMonthCollectedAmount,
          prevValue: prevRev,
          changePercent: Number(revPercentChange.toFixed(1)),
          isPositive: revPercentChange >= 0,
          description: 'Tổng tiền phí dịch vụ phát hành trong kỳ tháng này',
        },
        outstandingDebt: {
          value: currentDebt,
          prevValue: prevDebt,
          changePercent: Number(debtPercentChange.toFixed(1)),
          // For debt, a decrease (negative) is good, increase is negative for the business
          isPositive: debtPercentChange <= 0,
          description: 'Tổng công nợ các hóa đơn chưa thanh toán hoặc quá hạn',
        },
        activeTickets: {
          value: activeTicketsCount,
          resolvedValue: resolvedTicketsCount,
          prevValue: prevActiveTicketsCount,
          changePercent: Number(ticketsPercentChange.toFixed(1)),
          isPositive: ticketsPercentChange <= 0,
          description: 'Số lượng phản ánh kỹ thuật đang ở trạng thái mới hoặc đang xử lý',
        },
      },
      revenueAnalytics,
      occupancy: {
        total: totalApts,
        occupied: occupiedCount,
        occupiedPercent: Number(occupancyRate.toFixed(1)),
        vacant: vacantCount,
        vacantPercent: totalApts > 0 ? Number(((vacantCount / totalApts) * 100).toFixed(1)) : 0,
        maintenance: maintenanceCount,
        maintenancePercent: totalApts > 0 ? Number(((maintenanceCount / totalApts) * 100).toFixed(1)) : 0,
      },
      maintenance: {
        statusDistribution: ticketStatusMap,
        priorityDistribution: ticketPriorityMap,
        criticalTickets,
      },
      parking: {
        totalVehicles: totalVehiclesCount,
        cars: activeCarsCount,
        motorbikes: activeMotorbikesCount,
        activeParkingCards: activeParkingCardsCount,
        pendingApprovals: pendingApprovalsCount,
        estimatedRevenue: estimatedParkingRevenue,
      },
      activityFeed,
      alerts: {
        overdueInvoices: {
          count: overdueInvoicesAgg._count.id || 0,
          totalAmount: overdueInvoicesAgg._sum.totalAmount || 0,
          hasAlert: (overdueInvoicesAgg._count.id || 0) > 0,
        },
        urgentTickets: {
          count: urgentPendingTicketsCount,
          hasAlert: urgentPendingTicketsCount > 0,
        },
        expiringContracts: {
          count: expiringContractsCount,
          hasAlert: expiringContractsCount > 0,
        },
        lowCollectionRate: {
          rate: Number(currentCollectionRate.toFixed(1)),
          hasAlert: currentCollectionRate < 70 && currentRev > 0,
        },
      },
    };
  }
}

export const dashboardRepository = new DashboardRepository();
