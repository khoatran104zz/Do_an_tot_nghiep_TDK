import { prisma } from '@/lib/prisma';

export class DashboardRepository {
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

    // Monthly revenue chart data (Sample last 6 months)
    const revenueTrend = [
      { month: 'T03', revenue: 45000000, collected: 42000000 },
      { month: 'T04', revenue: 52000000, collected: 49000000 },
      { month: 'T05', revenue: 58000000, collected: 55000000 },
      { month: 'T06', revenue: 61000000, collected: 58000000 },
      { month: 'T07', revenue: 64000000, collected: 62000000 },
      { month: 'T08', revenue: 70000000, collected: 54000000 },
    ];

    // Apartment Status Pie Chart Data
    const apartmentStatusChart = [
      { name: 'Đang ở', value: occupiedApartments || 12, fill: '#16A34A' },
      { name: 'Đang trống', value: vacantApartments || 5, fill: '#94A3B8' },
      { name: 'Đang sửa chữa', value: maintenanceApartments || 2, fill: '#F59E0B' },
    ];

    // Ticket Categories Pie Chart Data
    const ticketCategoryChart = [
      { name: 'Điện', value: 8, fill: '#2563EB' },
      { name: 'Nước', value: 12, fill: '#06B6D4' },
      { name: 'Thang máy', value: 5, fill: '#8B5CF6' },
      { name: 'An ninh', value: 3, fill: '#F59E0B' },
      { name: 'Khác', value: 4, fill: '#64748B' },
    ];

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
      charts: {
        revenueTrend,
        apartmentStatusChart,
        ticketCategoryChart,
      },
    };
  }
}

export const dashboardRepository = new DashboardRepository();
