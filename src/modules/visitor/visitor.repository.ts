import { prisma } from '@/lib/prisma';
import { VisitorStatus, Prisma } from '@prisma/client';
import {
  VisitorPassFilter,
  CreateVisitorPassDto,
  ScanValidationResult,
  VisitorDashboardStats,
} from './visitor.types';

export class VisitorRepository {
  async findPasses(filter: VisitorPassFilter = {}, scopedApartmentId?: string) {
    const { search, apartmentId, buildingId, buildingIds, status, date, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const andClauses: Prisma.VisitorPassWhereInput[] = [];

    // IDOR Protection: If scopedApartmentId provided (for residents), enforce it
    if (scopedApartmentId) {
      andClauses.push({ apartmentId: scopedApartmentId });
    } else if (apartmentId) {
      andClauses.push({ apartmentId });
    }

    if (buildingIds && buildingIds.length > 0) {
      andClauses.push({
        apartment: {
          OR: [
            { buildingId: { in: buildingIds } },
            { block: { buildingId: { in: buildingIds } } },
          ],
        },
      });
    } else if (buildingId) {
      andClauses.push({
        apartment: {
          OR: [
            { buildingId },
            { block: { buildingId } },
          ],
        },
      });
    }

    if (status) andClauses.push({ status });

    if (date) {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      andClauses.push({
        visitDate: {
          gte: new Date(`${dateStr}T00:00:00.000Z`),
          lte: new Date(`${dateStr}T23:59:59.999Z`),
        },
      });
    }

    if (search && search.trim()) {
      const q = search.trim();
      andClauses.push({
        OR: [
          { passCode: { contains: q, mode: 'insensitive' } },
          { visitorName: { contains: q, mode: 'insensitive' } },
          { visitorPhone: { contains: q, mode: 'insensitive' } },
          { licensePlate: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.VisitorPassWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [items, total] = await Promise.all([
      prisma.visitorPass.findMany({
        where,
        include: {
          apartment: { select: { id: true, code: true, building: true } },
          resident: { select: { id: true, fullName: true, phone: true } },
          createdBy: { select: { id: true, fullName: true } },
          checkedInBy: { select: { id: true, fullName: true } },
          checkedOutBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.visitorPass.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findPassById(id: string) {
    return prisma.visitorPass.findUnique({
      where: { id },
      include: {
        apartment: { select: { id: true, code: true, building: true } },
        resident: { select: { id: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
        checkedInBy: { select: { id: true, fullName: true } },
        checkedOutBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async findPassByCodeOrQR(codeOrQr: string) {
    const trimmed = codeOrQr.trim();
    return prisma.visitorPass.findFirst({
      where: {
        OR: [
          { passCode: { equals: trimmed, mode: 'insensitive' } },
          { qrCode: { equals: trimmed } },
        ],
      },
      include: {
        apartment: { select: { id: true, code: true, building: true } },
        resident: { select: { id: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
        checkedInBy: { select: { id: true, fullName: true } },
        checkedOutBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async scanAndValidate(codeOrQr: string): Promise<ScanValidationResult> {
    const pass = await this.findPassByCodeOrQR(codeOrQr);

    if (!pass) {
      return {
        isValid: false,
        message: 'Mã thẻ khách hoặc mã QR không tồn tại trong hệ thống!',
        canCheckIn: false,
        canCheckOut: false,
        pass: null,
      };
    }

    if (pass.status === VisitorStatus.CANCELLED) {
      return {
        isValid: false,
        message: 'Thẻ khách đã bị hủy bởi cư dân!',
        canCheckIn: false,
        canCheckOut: false,
        pass,
      };
    }

    if (pass.status === VisitorStatus.EXPIRED) {
      return {
        isValid: false,
        message: 'Thẻ khách đã hết hạn đăng ký!',
        canCheckIn: false,
        canCheckOut: false,
        pass,
      };
    }

    if (pass.status === VisitorStatus.CHECKED_OUT) {
      return {
        isValid: false,
        message: 'Khách đã Check-out và rời khỏi tòa nhà trước đó!',
        canCheckIn: false,
        canCheckOut: false,
        pass,
      };
    }

    if (pass.status === VisitorStatus.PENDING) {
      return {
        isValid: true,
        message: 'Thẻ hợp lệ! Sẵn sàng Check-in cho khách vào tòa nhà.',
        canCheckIn: true,
        canCheckOut: false,
        pass,
      };
    }

    if (pass.status === VisitorStatus.CHECKED_IN) {
      return {
        isValid: true,
        message: 'Khách đang ở trong tòa nhà. Sẵn sàng Check-out khi khách rời đi.',
        canCheckIn: false,
        canCheckOut: true,
        pass,
      };
    }

    return {
      isValid: false,
      message: 'Trạng thái thẻ không xác định',
      canCheckIn: false,
      canCheckOut: false,
      pass,
    };
  }

  async createPass(data: CreateVisitorPassDto, userId: string, apartmentId: string, residentId?: string) {
    const year = new Date().getFullYear();
    const count = await prisma.visitorPass.count();
    const seq = (count + 1).toString().padStart(4, '0');

    const passCode = `VP-${year}-${seq}`;
    const qrToken = `QR-PASS-${year}-${seq}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const visitDate = new Date(`${data.visitDate}T00:00:00.000Z`);

    return prisma.visitorPass.create({
      data: {
        passCode,
        qrCode: qrToken,
        visitorName: data.visitorName,
        visitorPhone: data.visitorPhone || '',
        visitDate,
        expectedTime: data.expectedTime,
        licensePlate: data.licensePlate || null,
        note: data.note || null,
        status: VisitorStatus.PENDING,
        apartmentId,
        residentId: residentId || null,
        createdById: userId,
      },
      include: {
        apartment: { select: { id: true, code: true, building: true } },
        resident: { select: { id: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async checkIn(id: string, securityUserId: string) {
    const pass = await this.findPassById(id);
    if (!pass) {
      throw new Error('Thẻ khách không tồn tại');
    }

    if (pass.status !== VisitorStatus.PENDING) {
      throw new Error(`Không thể Check-in thẻ đang ở trạng thái [${pass.status}]`);
    }

    return prisma.visitorPass.update({
      where: { id },
      data: {
        status: VisitorStatus.CHECKED_IN,
        checkInAt: new Date(),
        checkedInById: securityUserId,
      },
      include: {
        apartment: { select: { id: true, code: true, building: true } },
        resident: { select: { id: true, fullName: true, phone: true } },
        checkedInBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async checkOut(id: string, securityUserId: string) {
    const pass = await this.findPassById(id);
    if (!pass) {
      throw new Error('Thẻ khách không tồn tại');
    }

    if (pass.status !== VisitorStatus.CHECKED_IN) {
      throw new Error(`Không thể Check-out thẻ đang ở trạng thái [${pass.status}]`);
    }

    return prisma.visitorPass.update({
      where: { id },
      data: {
        status: VisitorStatus.CHECKED_OUT,
        checkOutAt: new Date(),
        checkedOutById: securityUserId,
      },
      include: {
        apartment: { select: { id: true, code: true, building: true } },
        resident: { select: { id: true, fullName: true, phone: true } },
        checkedOutBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async cancelPass(id: string, reason?: string) {
    const pass = await this.findPassById(id);
    if (!pass) {
      throw new Error('Thẻ khách không tồn tại');
    }

    if (pass.status !== VisitorStatus.PENDING) {
      throw new Error(`Chỉ có thể hủy thẻ đang ở trạng thái Chờ khách tới (PENDING)`);
    }

    return prisma.visitorPass.update({
      where: { id },
      data: {
        status: VisitorStatus.CANCELLED,
        note: reason ? `${pass.note ? pass.note + ' | ' : ''}Lý do hủy: ${reason}` : pass.note,
      },
    });
  }

  async getStats(buildingIds?: string[]): Promise<VisitorDashboardStats> {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

    const buildingScope: Prisma.VisitorPassWhereInput =
      buildingIds && buildingIds.length > 0
        ? {
            apartment: {
              OR: [
                { buildingId: { in: buildingIds } },
                { block: { buildingId: { in: buildingIds } } },
              ],
            },
          }
        : {};

    const [activeVisitors, todayTotal, pendingToday, checkedOutToday] = await Promise.all([
      // Currently inside building
      prisma.visitorPass.count({
        where: { ...buildingScope, status: VisitorStatus.CHECKED_IN },
      }),
      // Scheduled / visited today
      prisma.visitorPass.count({
        where: {
          ...buildingScope,
          visitDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Expected today but not arrived yet
      prisma.visitorPass.count({
        where: {
          ...buildingScope,
          visitDate: { gte: todayStart, lte: todayEnd },
          status: VisitorStatus.PENDING,
        },
      }),
      // Checked out today
      prisma.visitorPass.count({
        where: {
          ...buildingScope,
          checkOutAt: { gte: todayStart, lte: todayEnd },
          status: VisitorStatus.CHECKED_OUT,
        },
      }),
    ]);

    return {
      activeVisitors,
      todayTotal,
      pendingToday,
      checkedOutToday,
    };
  }
}

export const visitorRepository = new VisitorRepository();
