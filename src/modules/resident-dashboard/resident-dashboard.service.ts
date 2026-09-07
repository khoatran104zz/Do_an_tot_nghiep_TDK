import { prisma } from '@/lib/prisma';

export class ResidentDashboardService {
  /**
   * Aggregated Resident Dashboard Data
   * Strictly authorized using the verified authenticated user ID
   */
  async getResidentDashboard(userId: string) {
    // 1. Resolve Resident Profile from authenticated User ID
    const resident = await prisma.resident.findUnique({
      where: { userId },
      include: {
        apartment: {
          include: {
            residents: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                relationshipToOwner: true,
                status: true,
                gender: true,
              },
            },
            contracts: {
              where: { status: 'ACTIVE' },
              select: {
                contractCode: true,
                type: true,
                startDate: true,
                endDate: true,
                monthlyRent: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!resident || !resident.apartment) {
      // Return empty/unassigned state if resident profile has not been assigned an apartment yet
      return {
        hasApartment: false,
        resident: {
          fullName: resident?.fullName || 'Cư dân',
          phone: resident?.phone || '',
        },
      };
    }

    const apartmentId = resident.apartment.id;
    const now = new Date();

    // 2. Fetch Invoices, Feedbacks, and Notifications in parallel
    const [invoices, feedbacks, notifications] = await Promise.all([
      // Invoices for this apartment, sorted descending
      prisma.invoice.findMany({
        where: { apartmentId },
        include: {
          items: {
            include: {
              feeCategory: {
                select: {
                  code: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
        orderBy: { billingMonth: 'desc' },
        take: 3,
      }),

      // Feedbacks for this resident or apartment
      prisma.feedback.findMany({
        where: {
          OR: [{ residentId: resident.id }, { apartmentId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Notifications targeted to global or this apartment
      prisma.notification.findMany({
        where: {
          OR: [
            { isGlobal: true },
            { apartments: { some: { apartmentId } } },
          ],
        },
        include: {
          reads: {
            where: { userId },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // 3. Process Latest & Previous Invoices
    const latestInvoice = invoices[0] || null;
    const previousInvoice = invoices[1] || null;

    let isOverdue = false;
    let daysDiff = 0;
    if (latestInvoice && latestInvoice.status !== 'PAID') {
      const dueDate = new Date(latestInvoice.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysDiff < 0 || latestInvoice.status === 'OVERDUE') {
        isOverdue = true;
      }
    }

    // 4. Calculate Bill Breakdown from latest invoice items
    const breakdown = {
      management: 0,
      electric: 0,
      water: 0,
      parking: 0,
      others: 0,
    };

    if (latestInvoice?.items) {
      latestInvoice.items.forEach((item) => {
        const code = item.feeCategory?.code || '';
        const title = item.title.toLowerCase();

        if (code.includes('MGMT') || title.includes('quản lý')) {
          breakdown.management += item.amount;
        } else if (code.includes('ELECTRIC') || title.includes('điện')) {
          breakdown.electric += item.amount;
        } else if (code.includes('WATER') || title.includes('nước')) {
          breakdown.water += item.amount;
        } else if (code.includes('PARKING') || title.includes('xe')) {
          breakdown.parking += item.amount;
        } else {
          breakdown.others += item.amount;
        }
      });
    }

    const breakdownChartData = [
      { name: 'Phí quản lý', value: breakdown.management, fill: '#2563EB' },
      { name: 'Tiền điện', value: breakdown.electric, fill: '#F59E0B' },
      { name: 'Tiền nước', value: breakdown.water, fill: '#06B6D4' },
      { name: 'Phí gửi xe', value: breakdown.parking, fill: '#10B981' },
    ].filter((item) => item.value > 0);

    if (breakdown.others > 0) {
      breakdownChartData.push({ name: 'Phí khác', value: breakdown.others, fill: '#64748B' });
    }

    // 5. Calculate Smart Insights from real data
    const insights: string[] = [];

    if (latestInvoice && previousInvoice) {
      const diff = latestInvoice.totalAmount - previousInvoice.totalAmount;
      if (previousInvoice.totalAmount > 0) {
        const percent = Math.abs(Math.round((diff / previousInvoice.totalAmount) * 100));
        if (diff > 0) {
          insights.push(`Hóa đơn tháng này cao hơn tháng trước ${percent}%.`);
        } else if (diff < 0) {
          insights.push(`Hóa đơn tháng này tiết kiệm hơn tháng trước ${percent}%.`);
        }
      }
    }

    if (latestInvoice && latestInvoice.status !== 'PAID') {
      if (isOverdue) {
        insights.push(`Hóa đơn kỳ này đã quá hạn thanh toán. Vui lòng nộp sớm để tránh ngắt dịch vụ.`);
      } else if (daysDiff <= 3) {
        insights.push(`Hóa đơn sẽ đến hạn thanh toán trong ${daysDiff} ngày tới.`);
      } else {
        insights.push(`Hạn thanh toán hóa đơn là ngày ${new Intl.DateTimeFormat('vi-VN').format(new Date(latestInvoice.dueDate))}.`);
      }
    } else if (latestInvoice?.status === 'PAID') {
      insights.push('Bạn đã hoàn tất thanh toán hóa đơn phí dịch vụ kỳ này.');
    }

    const pendingTickets = feedbacks.filter((f) => f.status === 'NEW' || f.status === 'PROCESSING');
    if (pendingTickets.length > 0) {
      insights.push(`Bạn có ${pendingTickets.length} yêu cầu hỗ trợ kỹ thuật đang được BQL tiếp nhận xử lý.`);
    }

    const activeMembersCount = resident.apartment.residents.filter((r) => r.status === 'RESIDING').length;
    insights.push(`Căn hộ đang có ${activeMembersCount} thành viên đăng ký cư trú chính thức.`);

    // 6. Latest Ticket & Timeline Status
    const latestTicket = feedbacks[0] || null;
    let ticketTimelineStep = 0;
    if (latestTicket) {
      if (latestTicket.status === 'NEW') ticketTimelineStep = 1;
      else if (latestTicket.status === 'PROCESSING') ticketTimelineStep = 2;
      else if (latestTicket.status === 'RESOLVED') ticketTimelineStep = 3;
      else ticketTimelineStep = 0; // REJECTED
    }

    // 7. Building Facilities Information
    const facilities = [
      {
        id: 'pool',
        name: 'Bể bơi vô cực ngoài trời',
        location: 'Tầng 5 - Tháp A',
        hours: '06:00 - 21:00',
        status: 'OPEN',
        statusLabel: 'Đang mở cửa',
        notes: 'Cư dân xuất trình thẻ cư dân hoặc mã QR tại cổng',
      },
      {
        id: 'gym',
        name: 'Phòng Gym & Yoga Fitness',
        location: 'Tầng 4 - Tháp B',
        hours: '05:30 - 22:00',
        status: 'OPEN',
        statusLabel: 'Hoạt động bình thường',
        notes: 'Trang thiết bị Technogym cao cấp, miễn phí cho cư dân',
      },
      {
        id: 'community',
        name: 'Phòng sinh hoạt cộng đồng & Thư viện',
        location: 'Tầng 1 - Sảnh chính',
        hours: '08:00 - 21:30',
        status: 'OPEN',
        statusLabel: 'Sẵn sàng phục vụ',
        notes: 'Không gian đọc sách và họp gia đình yên tĩnh',
      },
      {
        id: 'parking',
        name: 'Hầm giữ xe thông minh 2 tầng',
        location: 'Tầng hầm B1 & B2',
        hours: '24/7',
        status: 'OPEN',
        statusLabel: 'Hoạt động 24/7',
        notes: 'Kiểm soát nhận diện biển số tự động và camera an ninh',
      },
    ];

    // 8. Format Notifications with unread indicator
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      createdAt: n.createdAt,
      isRead: n.reads.length > 0,
    }));

    return {
      hasApartment: true,
      resident: {
        id: resident.id,
        fullName: resident.fullName,
        phone: resident.phone,
        email: resident.email,
        relationshipToOwner: resident.relationshipToOwner,
        status: resident.status,
      },
      apartment: {
        id: resident.apartment.id,
        code: resident.apartment.code,
        building: resident.apartment.building,
        floor: resident.apartment.floor,
        area: resident.apartment.area,
        bedrooms: resident.apartment.bedrooms,
        bathrooms: resident.apartment.bathrooms,
        members: resident.apartment.residents,
        activeContract: resident.apartment.contracts[0] || null,
      },
      billing: {
        latestInvoice,
        isOverdue,
        daysUntilDue: daysDiff,
        breakdown,
        breakdownChartData,
      },
      maintenance: {
        latestTicket,
        timelineStep: ticketTimelineStep,
        totalTickets: feedbacks.length,
      },
      notifications: formattedNotifications,
      facilities,
      insights,
    };
  }
}

export const residentDashboardService = new ResidentDashboardService();
