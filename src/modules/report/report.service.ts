import { prisma } from '@/lib/prisma';
import { ReportFilter, ReportDataResult, ReportColumn } from './report.types';
import { InvoiceStatus, TicketStatus, Role } from '@prisma/client';

export class ReportService {
  async getReportData(filter: ReportFilter): Promise<ReportDataResult> {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    switch (filter.type) {
      case 'APARTMENT':
        return this.getApartmentReport(filter, skip, limit, page);
      case 'RESIDENT':
        return this.getResidentReport(filter, skip, limit, page);
      case 'REVENUE':
        return this.getRevenueReport(filter, skip, limit, page);
      case 'OUTSTANDING_DEBT':
        return this.getOutstandingDebtReport(filter, skip, limit, page);
      case 'PAYMENT':
        return this.getPaymentReport(filter, skip, limit, page);
      case 'MAINTENANCE':
        return this.getMaintenanceReport(filter, skip, limit, page);
      case 'SLA_PERFORMANCE':
        return this.getSlaPerformanceReport(filter, skip, limit, page);
      case 'PARKING':
        return this.getParkingReport(filter, skip, limit, page);
      case 'VISITOR':
        return this.getVisitorReport(filter, skip, limit, page);
      case 'PARCEL':
        return this.getParcelReport(filter, skip, limit, page);
      case 'FACILITY':
        return this.getFacilityReport(filter, skip, limit, page);
      case 'POLL':
        return this.getPollReport(filter, skip, limit, page);
      case 'STAFF':
        return this.getStaffReport(filter, skip, limit, page);
      case 'SMART_ALERT':
        return this.getSmartAlertReport(filter, skip, limit, page);
      default:
        throw new Error('Loại báo cáo không hợp lệ');
    }
  }

  // 1. APARTMENT REPORT
  private async getApartmentReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const where: any = {};
    if (filter.building) where.building = filter.building;
    if (filter.floor) where.floor = filter.floor;

    const [items, total] = await Promise.all([
      prisma.apartment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          residents: { select: { fullName: true, relationshipToOwner: true } },
        },
      }),
      prisma.apartment.count({ where }),
    ]);

    const columns: ReportColumn[] = [
      { key: 'code', label: 'Mã Căn Hộ' },
      { key: 'building', label: 'Tòa Nhà' },
      { key: 'floor', label: 'Tầng' },
      { key: 'area', label: 'Diện Tích (m²)' },
      { key: 'status', label: 'Trạng Thái' },
      { key: 'hostName', label: 'Chủ Hộ / Đại Diện' },
      { key: 'residentCount', label: 'Số Cư Dân' },
    ];

    const rows = items.map((a: any) => {
      const host = a.residents.find((r: any) => r.relationshipToOwner === 'OWNER') || a.residents[0];
      return {
        code: a.code,
        building: a.building,
        floor: a.floor,
        area: a.area,
        status: a.status === 'OCCUPIED' ? 'Đang ở' : a.status === 'VACANT' ? 'Trống' : 'Bảo trì',
        hostName: host ? host.fullName : 'Chưa có',
        residentCount: a.residents.length,
      };
    });

    return {
      type: 'APARTMENT',
      title: 'Báo Cáo Tình Trạng Căn Hộ',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: {
        'Tổng số căn hộ': total,
        'Căn đang ở': rows.filter((r) => r.status === 'Đang ở').length,
        'Căn trống': rows.filter((r) => r.status === 'Trống').length,
      },
    };
  }

  // 2. RESIDENT REPORT
  private async getResidentReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const where: any = {};
    if (filter.building || filter.floor) {
      where.apartment = {};
      if (filter.building) where.apartment.building = filter.building;
      if (filter.floor) where.apartment.floor = filter.floor;
    }

    const [items, total] = await Promise.all([
      prisma.resident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        include: { apartment: { select: { code: true, building: true } } },
      }),
      prisma.resident.count({ where }),
    ]);

    const columns: ReportColumn[] = [
      { key: 'fullName', label: 'Họ Và Tên' },
      { key: 'apartment', label: 'Căn Hộ' },
      { key: 'phone', label: 'Số Điện Thoại' },
      { key: 'role', label: 'Quan Hệ Chủ Hộ' },
      { key: 'status', label: 'Trạng Thái Cư Trú' },
    ];

    const rows = items.map((r: any) => ({
      fullName: r.fullName,
      apartment: r.apartment ? `${r.apartment.code} (${r.apartment.building})` : 'Chưa liên kết',
      phone: r.phone || 'Chưa cập nhật',
      role: r.relationshipToOwner === 'OWNER' ? 'Chủ sở hữu' : r.relationshipToOwner === 'TENANT' ? 'Khách thuê' : 'Thành viên gia đình',
      status: r.status === 'RESIDING' ? 'Đang sinh sống' : r.status === 'TEMPORARY_ABSENT' ? 'Tạm vắng' : 'Đã chuyển đi',
    }));

    return {
      type: 'RESIDENT',
      title: 'Báo Cáo Danh Sách Cư Dân',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: {
        'Tổng cư dân': total,
        'Chủ hộ': rows.filter((r) => r.role === 'Chủ sở hữu').length,
      },
    };
  }

  // 3. REVENUE REPORT
  private async getRevenueReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const where: any = { status: InvoiceStatus.PAID };
    if (filter.startDate) where.paidAt = { gte: new Date(filter.startDate) };
    if (filter.endDate) where.paidAt = { ...(where.paidAt || {}), lte: new Date(filter.endDate) };

    const [items, total, agg] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: { apartment: { select: { code: true } } },
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
    ]);

    const columns: ReportColumn[] = [
      { key: 'code', label: 'Mã Hóa Đơn' },
      { key: 'apartment', label: 'Căn Hộ' },
      { key: 'billingMonth', label: 'Kỳ Phí' },
      { key: 'totalAmount', label: 'Số Tiền' },
      { key: 'paidAt', label: 'Thời Gian Đóng' },
      { key: 'paymentMethod', label: 'Hình Thức' },
    ];

    const rows = items.map((i: any) => ({
      code: i.code,
      apartment: i.apartment?.code || 'N/A',
      billingMonth: i.billingMonth,
      totalAmount: (i.totalAmount || 0).toLocaleString('vi-VN') + ' đ',
      paidAt: i.paidAt ? new Date(i.paidAt).toLocaleDateString('vi-VN') : '',
      paymentMethod: i.paymentMethod || 'Chuyển khoản',
    }));

    return {
      type: 'REVENUE',
      title: 'Báo Cáo Doanh Thu Thu Phí Tòa Nhà',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: {
        'Tổng tiền thu': (agg._sum.totalAmount || 0).toLocaleString('vi-VN') + ' đ',
        'Tổng số giao dịch': total,
      },
    };
  }

  // 4. OUTSTANDING DEBT REPORT
  private async getOutstandingDebtReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const where: any = {
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] },
    };

    const [items, total, agg] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: { apartment: { select: { code: true, building: true } } },
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
    ]);

    const columns: ReportColumn[] = [
      { key: 'code', label: 'Mã Hóa Đơn' },
      { key: 'apartment', label: 'Căn Hộ' },
      { key: 'billingMonth', label: 'Kỳ Phí' },
      { key: 'totalAmount', label: 'Công Nợ' },
      { key: 'dueDate', label: 'Hạn Nộp' },
      { key: 'status', label: 'Tình Trạng' },
    ];

    const rows = items.map((i: any) => ({
      code: i.code,
      apartment: i.apartment?.code || 'N/A',
      billingMonth: i.billingMonth,
      totalAmount: (i.totalAmount || 0).toLocaleString('vi-VN') + ' đ',
      dueDate: new Date(i.dueDate).toLocaleDateString('vi-VN'),
      status: i.status === InvoiceStatus.OVERDUE ? 'Quá hạn' : 'Chưa đóng',
    }));

    return {
      type: 'OUTSTANDING_DEBT',
      title: 'Báo Cáo Công Nợ & Khoản Phí Chưa Thu',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: {
        'Tổng nợ tồn đọng': (agg._sum.totalAmount || 0).toLocaleString('vi-VN') + ' đ',
        'Số hóa đơn nợ': total,
      },
    };
  }

  // 5. PAYMENT REPORT
  private async getPaymentReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const where: any = { status: InvoiceStatus.PAID };
    if (filter.startDate) where.paidAt = { gte: new Date(filter.startDate) };
    if (filter.endDate) where.paidAt = { ...(where.paidAt || {}), lte: new Date(filter.endDate) };

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: { apartment: { select: { code: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    const columns: ReportColumn[] = [
      { key: 'transactionId', label: 'Mã Giao Dịch' },
      { key: 'invoiceCode', label: 'Hóa Đơn' },
      { key: 'apartment', label: 'Căn Hộ' },
      { key: 'amount', label: 'Số Tiền' },
      { key: 'method', label: 'Hình Thức' },
      { key: 'status', label: 'Trạng Thái' },
      { key: 'time', label: 'Thời Gian' },
    ];

    const rows = items.map((p: any) => ({
      transactionId: p.transactionId || p.id,
      invoiceCode: p.code,
      apartment: p.apartment?.code || 'N/A',
      amount: (p.totalAmount || 0).toLocaleString('vi-VN') + ' đ',
      method: p.paymentMethod || 'Chuyển khoản',
      status: 'Thành công',
      time: p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '',
    }));

    return {
      type: 'PAYMENT',
      title: 'Báo Cáo Lịch Sử Giao Dịch Thanh Toán',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng số giao dịch': total },
    };
  }

  // 6. MAINTENANCE REPORT
  private async getMaintenanceReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const where: any = {};
    if (filter.startDate) where.createdAt = { gte: new Date(filter.startDate) };
    if (filter.endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(filter.endDate) };

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: { select: { code: true } },
          assignedStaff: { select: { fullName: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const columns: ReportColumn[] = [
      { key: 'code', label: 'Mã Phiếu' },
      { key: 'title', label: 'Tiêu Đề Sự Cố' },
      { key: 'category', label: 'Danh Mục' },
      { key: 'priority', label: 'Mức Độ' },
      { key: 'apartment', label: 'Căn Hộ' },
      { key: 'assignedStaff', label: 'Kỹ Thuật Viên' },
      { key: 'status', label: 'Trạng Thái' },
      { key: 'createdAt', label: 'Thời Gian Tạo' },
    ];

    const rows = items.map((t: any) => ({
      code: t.code,
      title: t.title,
      category: t.category,
      priority: t.priority,
      apartment: t.apartment?.code || 'Khu công cộng',
      assignedStaff: t.assignedStaff?.fullName || 'Chưa gán',
      status: t.status === TicketStatus.RESOLVED ? 'Đã hoàn thành' : t.status === TicketStatus.PROCESSING ? 'Đang xử lý' : 'Mới tạo',
      createdAt: new Date(t.createdAt).toLocaleDateString('vi-VN'),
    }));

    return {
      type: 'MAINTENANCE',
      title: 'Báo Cáo Hoạt Động Bảo Trì & Sửa Chữa',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: {
        'Tổng yêu cầu': total,
        'Đã hoàn thành': rows.filter((r) => r.status === 'Đã hoàn thành').length,
      },
    };
  }

  // 7. SLA PERFORMANCE REPORT
  private async getSlaPerformanceReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const where: any = {};
    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: { select: { code: true } },
          assignedStaff: { select: { fullName: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const now = Date.now();
    const columns: ReportColumn[] = [
      { key: 'code', label: 'Mã Phiếu' },
      { key: 'title', label: 'Sự Cố' },
      { key: 'priority', label: 'Mức Độ' },
      { key: 'slaDueAt', label: 'Hạn Chót SLA' },
      { key: 'slaStatus', label: 'Tuân Thủ SLA' },
      { key: 'assignedStaff', label: 'Kỹ Thuật Viên' },
    ];

    const rows = items.map((t: any) => {
      const isBreached = t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED && t.slaDueAt && new Date(t.slaDueAt).getTime() < now;
      return {
        code: t.code,
        title: t.title,
        priority: t.priority,
        slaDueAt: t.slaDueAt ? new Date(t.slaDueAt).toLocaleString('vi-VN') : 'Không áp dụng',
        slaStatus: isBreached ? '⚠️ Vi phạm SLA' : 'Trong hạn',
        assignedStaff: t.assignedStaff?.fullName || 'Chưa gán',
      };
    });

    return {
      type: 'SLA_PERFORMANCE',
      title: 'Báo Cáo Hiệu Suất & Cam Kết Thời Gian Xử Lý (SLA)',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: {
        'Tổng sự cố': total,
        'Vi phạm SLA': rows.filter((r) => r.slaStatus.includes('Vi phạm')).length,
      },
    };
  }

  // 8. PARKING REPORT
  private async getParkingReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: { select: { code: true } },
          resident: { select: { fullName: true } },
        },
      }),
      prisma.vehicle.count(),
    ]);

    const columns: ReportColumn[] = [
      { key: 'plateNumber', label: 'Biển Số' },
      { key: 'type', label: 'Loại Phương Tiện' },
      { key: 'apartment', label: 'Căn Hộ' },
      { key: 'owner', label: 'Chủ Xe' },
      { key: 'status', label: 'Trạng Thái' },
    ];

    const rows = items.map((v: any) => ({
      plateNumber: v.licensePlate,
      type: v.type === 'CAR' ? 'Ô tô' : v.type === 'MOTORBIKE' ? 'Xe máy' : 'Xe đạp điện',
      apartment: v.apartment?.code || 'N/A',
      owner: v.resident?.fullName || 'N/A',
      status: v.status === 'ACTIVE' ? 'Đang hoạt động' : v.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : 'Ngừng hoạt động',
    }));

    return {
      type: 'PARKING',
      title: 'Báo Cáo Đăng Ký Phương Tiện & Bãi Đỗ Xe',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng phương tiện': total },
    };
  }

  // 9. VISITOR REPORT
  private async getVisitorReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const [items, total] = await Promise.all([
      prisma.visitorPass.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { apartment: { select: { code: true } } },
      }),
      prisma.visitorPass.count(),
    ]);

    const columns: ReportColumn[] = [
      { key: 'code', label: 'Mã Khách' },
      { key: 'visitorName', label: 'Tên Khách' },
      { key: 'apartment', label: 'Căn Hộ Thăm' },
      { key: 'expectedArrival', label: 'Giờ Dự Kiến' },
      { key: 'status', label: 'Trạng Thái' },
    ];

    const rows = items.map((v: any) => ({
      code: v.passCode,
      visitorName: v.visitorName,
      apartment: v.apartment?.code || 'N/A',
      expectedArrival: `${new Date(v.visitDate).toLocaleDateString('vi-VN')} (${v.expectedTime})`,
      status: v.status === 'CHECKED_IN' ? 'Đang trong tòa nhà' : v.status === 'CHECKED_OUT' ? 'Đã rời đi' : 'Đã đăng ký',
    }));

    return {
      type: 'VISITOR',
      title: 'Báo Cáo Lượt Khách Ra Vào Tòa Nhà',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng lượt đăng ký khách': total },
    };
  }

  // 10. PARCEL REPORT
  private async getParcelReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const [items, total] = await Promise.all([
      prisma.parcelDelivery.findMany({
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: { apartment: { select: { code: true } } },
      }),
      prisma.parcelDelivery.count(),
    ]);

    const columns: ReportColumn[] = [
      { key: 'trackingNumber', label: 'Mã Vận Đơn' },
      { key: 'apartment', label: 'Căn Hộ' },
      { key: 'recipientName', label: 'Người Nhận' },
      { key: 'carrier', label: 'Đơn Vị VC' },
      { key: 'receivedAt', label: 'Giờ Nhận' },
      { key: 'status', label: 'Trạng Thái' },
    ];

    const rows = items.map((p: any) => ({
      trackingNumber: p.trackingNumber || p.id,
      apartment: p.apartment?.code || 'N/A',
      recipientName: p.recipientName,
      carrier: p.carrier,
      receivedAt: new Date(p.receivedAt).toLocaleString('vi-VN'),
      status: p.status === 'COLLECTED' ? 'Đã lấy hàng' : 'Đang chờ lấy',
    }));

    return {
      type: 'PARCEL',
      title: 'Báo Cáo Giao Nhận Bưu Kiện Lễ Tân',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng kiện hàng tiếp nhận': total },
    };
  }

  // 11. FACILITY REPORT
  private async getFacilityReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const [items, total] = await Promise.all([
      prisma.facilityBooking.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          facility: { select: { name: true } },
          apartment: { select: { code: true } },
        },
      }),
      prisma.facilityBooking.count(),
    ]);

    const columns: ReportColumn[] = [
      { key: 'facility', label: 'Tiện Ích' },
      { key: 'apartment', label: 'Căn Hộ Đặt' },
      { key: 'date', label: 'Ngày Sử Dụng' },
      { key: 'timeSlot', label: 'Khung Giờ' },
      { key: 'status', label: 'Trạng Thái' },
    ];

    const rows = items.map((b: any) => ({
      facility: b.facility.name,
      apartment: b.apartment?.code || 'N/A',
      date: new Date(b.bookingDate).toLocaleDateString('vi-VN'),
      timeSlot: `${b.startTime} - ${b.endTime}`,
      status: b.status === 'CONFIRMED' ? 'Đã duyệt' : b.status === 'PENDING' ? 'Chờ duyệt' : 'Đã hủy',
    }));

    return {
      type: 'FACILITY',
      title: 'Báo Cáo Tần Suất Đặt Tiện Ích Công Cộng',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng lượt đặt tiện ích': total },
    };
  }

  // 12. POLL REPORT
  private async getPollReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const [items, total] = await Promise.all([
      prisma.poll.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { votes: true },
      }),
      prisma.poll.count(),
    ]);

    const columns: ReportColumn[] = [
      { key: 'question', label: 'Tiêu Đề Khảo Sát' },
      { key: 'startAt', label: 'Bắt Đầu' },
      { key: 'endAt', label: 'Kết Thúc' },
      { key: 'votesCount', label: 'Số Lượt Bình Chọn' },
      { key: 'status', label: 'Trạng Thái' },
    ];

    const rows = items.map((p: any) => ({
      question: p.title,
      startAt: new Date(p.startAt).toLocaleDateString('vi-VN'),
      endAt: new Date(p.endAt).toLocaleDateString('vi-VN'),
      votesCount: p.votes.length,
      status: p.status === 'ACTIVE' ? 'Đang diễn ra' : p.status === 'CLOSED' ? 'Đã đóng' : 'Bản nháp',
    }));

    return {
      type: 'POLL',
      title: 'Báo Cáo Khảo Sát & Ý Kiến Cư Dân',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng số cuộc khảo sát': total },
    };
  }

  // 13. STAFF REPORT
  private async getStaffReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: {
            in: [
              Role.STAFF_TECHNICIAN,
              Role.STAFF_SECURITY,
              Role.STAFF_RECEPTIONIST,
              Role.MANAGER,
            ],
          },
        },
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        include: { staffProfile: true },
      }),
      prisma.user.count({
        where: {
          role: {
            in: [
              Role.STAFF_TECHNICIAN,
              Role.STAFF_SECURITY,
              Role.STAFF_RECEPTIONIST,
              Role.MANAGER,
            ],
          },
        },
      }),
    ]);

    const columns: ReportColumn[] = [
      { key: 'fullName', label: 'Họ Và Tên' },
      { key: 'role', label: 'Vị Trí Chuyên Môn' },
      { key: 'email', label: 'Email' },
      { key: 'shift', label: 'Ca Trực' },
      { key: 'status', label: 'Trạng Thái' },
    ];

    const rows = items.map((s: any) => ({
      fullName: s.fullName,
      role: s.role === 'STAFF_TECHNICIAN' ? 'Kỹ thuật viên' : s.role === 'STAFF_SECURITY' ? 'An ninh / Bảo vệ' : s.role === 'STAFF_RECEPTIONIST' ? 'Lễ tân' : 'Quản lý',
      email: s.email,
      shift: s.staffProfile?.currentShift || 'Hành chính',
      status: s.isActive ? 'Đang làm việc' : 'Nghỉ việc',
    }));

    return {
      type: 'STAFF',
      title: 'Báo Cáo Nhân Sự & Đội Ngũ Vận Hành',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng nhân sự vận hành': total },
    };
  }

  // 14. SMART ALERT REPORT
  private async getSmartAlertReport(filter: ReportFilter, skip: number, limit: number, page: number): Promise<ReportDataResult> {
    const [items, total] = await Promise.all([
      prisma.smartAlertRecord.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.smartAlertRecord.count(),
    ]);

    const columns: ReportColumn[] = [
      { key: 'title', label: 'Tiêu Đề Cảnh Báo' },
      { key: 'severity', label: 'Mức Độ' },
      { key: 'source', label: 'Nguồn' },
      { key: 'status', label: 'Tình Trạng' },
      { key: 'location', label: 'Vị Trí' },
      { key: 'createdAt', label: 'Thời Gian' },
    ];

    const rows = items.map((a: any) => ({
      title: a.title,
      severity: a.severity,
      source: a.source,
      status: a.status,
      location: a.location || 'Toàn tòa nhà',
      createdAt: new Date(a.createdAt).toLocaleString('vi-VN'),
    }));

    return {
      type: 'SMART_ALERT',
      title: 'Báo Cáo Sự Cố & Cảnh Báo Thông Minh',
      generatedAt: new Date().toLocaleString('vi-VN'),
      columns,
      rows,
      totalRows: total,
      page,
      limit,
      summary: { 'Tổng số cảnh báo': total },
    };
  }
}

export const reportService = new ReportService();
