import { prisma } from '@/lib/prisma';
import { SmartAlert, AlertType, AlertSeverity, AlertSource, AlertStatus, SmartAlertFilter } from './smart-operations.types';
import { TicketPriority, TicketStatus, ContractStatus, InvoiceStatus, MaintenanceStatus, SmartAlertStatus, SmartAlertSource } from '@prisma/client';
import { SLA_HOURS_BY_PRIORITY } from '../feedback/ticket-workflow.service';
import { auditLogService } from '../audit/audit-log.service';

export class SmartAlertService {
  private cache: {
    timestamp: number;
    alerts: SmartAlert[];
  } | null = null;

  private readonly CACHE_TTL_MS = 15 * 1000; // 15 seconds fresh cache

  /**
   * Scans and aggregates all smart operational alerts from both real DB records & rule-based scanning
   */
  async getSmartAlerts(forceFresh = false): Promise<SmartAlert[]> {
    const now = Date.now();
    if (!forceFresh && this.cache && now - this.cache.timestamp < this.CACHE_TTL_MS) {
      return this.cache.alerts;
    }

    const currentDate = new Date();
    const alerts: SmartAlert[] = [];

    // 0. FETCH PERSISTED DB ALERTS (IoT and recorded operational events)
    const dbAlerts = await prisma.smartAlertRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    for (const record of dbAlerts) {
      alerts.push({
        id: record.id,
        type: record.type,
        severity: record.severity as AlertSeverity,
        source: record.source as AlertSource,
        status: record.status as AlertStatus,
        title: record.title,
        description: record.description,
        location: record.location,
        entityType: record.relatedEntityType as any,
        entityId: record.relatedEntityId,
        actionUrl: record.actionUrl || '/smart-operations/alerts',
        createdAt: record.createdAt,
        acknowledgedAt: record.acknowledgedAt,
        acknowledgedBy: record.acknowledgedById,
        resolvedAt: record.resolvedAt,
        resolvedBy: record.resolvedById,
      });
    }

    // Parallel DB Fetching for active resources
    const [activeContracts, unpaidInvoices, activeTickets, activeSchedules] = await Promise.all([
      prisma.contract.findMany({
        where: { status: ContractStatus.ACTIVE },
        include: {
          apartment: { select: { code: true, building: true } },
          resident: { select: { fullName: true, phone: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] } },
        include: {
          apartment: { select: { code: true, building: true } },
        },
      }),
      prisma.feedback.findMany({
        where: { status: { in: [TicketStatus.NEW, TicketStatus.ASSIGNED, TicketStatus.PROCESSING] } },
        include: {
          apartment: { select: { code: true, building: true } },
          assignedStaff: { select: { fullName: true } },
        },
      }),
      prisma.maintenanceSchedule.findMany({
        where: { status: MaintenanceStatus.PENDING },
        include: {
          asset: { select: { code: true, name: true, location: true } },
        },
      }),
    ]);

    // 1. SCAN CONTRACT ALERTS
    for (const contract of activeContracts) {
      const endMs = new Date(contract.endDate).getTime();
      const diffMs = endMs - currentDate.getTime();
      const diffDays = Math.ceil(diffMs / (24 * 3600 * 1000));

      if (diffDays < 0) {
        // Expired but status still ACTIVE
        alerts.push({
          id: `alert_contract_exp_${contract.id}`,
          type: 'CONTRACT_EXPIRED',
          severity: 'CRITICAL',
          source: 'CONTRACT',
          status: 'OPEN',
          title: `Hợp đồng đã hết hạn: ${contract.contractCode}`,
          description: `Căn hộ ${contract.apartment.code} (${contract.resident.fullName}) đã hết hạn ngày ${new Date(
            contract.endDate
          ).toLocaleDateString('vi-VN')} nhưng chưa được gia hạn hoặc thanh lý.`,
          entityType: 'CONTRACT',
          entityId: contract.id,
          actionUrl: `/contracts?search=${contract.contractCode}`,
          createdAt: contract.endDate,
          metadata: { diffDays, residentName: contract.resident.fullName, apartmentCode: contract.apartment.code },
        });
      } else if (diffDays <= 7) {
        // Critical: Expiring within 7 days
        alerts.push({
          id: `alert_contract_crit_${contract.id}`,
          type: 'CONTRACT_EXPIRING_CRITICAL',
          severity: 'CRITICAL',
          source: 'CONTRACT',
          status: 'OPEN',
          title: `Hợp đồng đáo hạn gấp (còn ${diffDays} ngày): ${contract.contractCode}`,
          description: `Căn hộ ${contract.apartment.code} (${contract.resident.fullName}) sẽ hết hạn vào ${new Date(
            contract.endDate
          ).toLocaleDateString('vi-VN')}. Cần liên hệ cư dân ngay.`,
          entityType: 'CONTRACT',
          entityId: contract.id,
          actionUrl: `/contracts?search=${contract.contractCode}`,
          createdAt: currentDate,
          metadata: { diffDays, residentName: contract.resident.fullName, apartmentCode: contract.apartment.code },
        });
      } else if (diffDays <= 30) {
        // Warning: Expiring within 30 days
        alerts.push({
          id: `alert_contract_soon_${contract.id}`,
          type: 'CONTRACT_EXPIRING_SOON',
          severity: 'WARNING',
          source: 'CONTRACT',
          status: 'OPEN',
          title: `Hợp đồng sắp hết hạn (${diffDays} ngày): ${contract.contractCode}`,
          description: `Căn hộ ${contract.apartment.code} (${contract.resident.fullName}) sẽ kết thúc thời hạn vào cuối tháng.`,
          entityType: 'CONTRACT',
          entityId: contract.id,
          actionUrl: `/contracts?search=${contract.contractCode}`,
          createdAt: currentDate,
          metadata: { diffDays, residentName: contract.resident.fullName, apartmentCode: contract.apartment.code },
        });
      }
    }

    // 2. SCAN INVOICE ALERTS
    for (const inv of unpaidInvoices) {
      const dueMs = new Date(inv.dueDate).getTime();
      const isPastDue = currentDate.getTime() > dueMs;
      const overdueDays = isPastDue ? Math.ceil((currentDate.getTime() - dueMs) / (24 * 3600 * 1000)) : 0;
      const formattedAmount = inv.totalAmount.toLocaleString('vi-VN') + ' đ';

      if (isPastDue && overdueDays >= 15) {
        // Chronic overdue (> 15 days)
        alerts.push({
          id: `alert_inv_chronic_${inv.id}`,
          type: 'INVOICE_OVERDUE_CHRONIC',
          severity: 'CRITICAL',
          source: 'INVOICE',
          status: 'OPEN',
          title: `Hóa đơn nợ đọng kéo dài (${overdueDays} ngày): ${inv.code}`,
          description: `Căn hộ ${inv.apartment.code} nợ ${formattedAmount}. Đã trễ hạn nộp hơn nửa tháng.`,
          entityType: 'INVOICE',
          entityId: inv.id,
          actionUrl: `/invoices?search=${inv.code}`,
          createdAt: inv.dueDate,
          metadata: { overdueDays, totalAmount: inv.totalAmount, apartmentCode: inv.apartment.code },
        });
      } else if (isPastDue) {
        // Normal overdue
        alerts.push({
          id: `alert_inv_overdue_${inv.id}`,
          type: 'INVOICE_OVERDUE',
          severity: 'WARNING',
          source: 'INVOICE',
          status: 'OPEN',
          title: `Hóa đơn quá hạn nộp phí: ${inv.code}`,
          description: `Căn hộ ${inv.apartment.code} chưa đóng ${formattedAmount} (quá hạn ${overdueDays} ngày).`,
          entityType: 'INVOICE',
          entityId: inv.id,
          actionUrl: `/invoices?search=${inv.code}`,
          createdAt: inv.dueDate,
          metadata: { overdueDays, totalAmount: inv.totalAmount, apartmentCode: inv.apartment.code },
        });
      } else if (inv.totalAmount >= 5_000_000) {
        // High debt amount even before overdue
        alerts.push({
          id: `alert_inv_highdebt_${inv.id}`,
          type: 'INVOICE_HIGH_DEBT',
          severity: 'WARNING',
          source: 'INVOICE',
          status: 'OPEN',
          title: `Hóa đơn giá trị cao cần thu: ${inv.code}`,
          description: `Căn hộ ${inv.apartment.code} phát sinh khoản thu ${formattedAmount}. Hạn nộp ${new Date(
            inv.dueDate
          ).toLocaleDateString('vi-VN')}.`,
          entityType: 'INVOICE',
          entityId: inv.id,
          actionUrl: `/invoices?search=${inv.code}`,
          createdAt: inv.createdAt,
          metadata: { totalAmount: inv.totalAmount, apartmentCode: inv.apartment.code },
        });
      }
    }

    // 3. SCAN TICKET ALERTS
    for (const ticket of activeTickets) {
      const hours = SLA_HOURS_BY_PRIORITY[ticket.priority] || 48;
      const dueAt =
        ticket.slaDueAt || new Date(new Date(ticket.createdAt).getTime() + hours * 3600 * 1000);
      const remainingMs = dueAt.getTime() - currentDate.getTime();
      const remainingHours = Math.round((remainingMs / (3600 * 1000)) * 10) / 10;
      const isUrgent =
        ticket.priority === TicketPriority.URGENT || ticket.priority === TicketPriority.CRITICAL;

      if (remainingMs < 0) {
        // SLA Breached
        const overdueHours = Math.abs(remainingHours);
        alerts.push({
          id: `alert_ticket_breach_${ticket.id}`,
          type: 'TICKET_SLA_BREACHED',
          severity: 'CRITICAL',
          source: 'SLA',
          status: 'OPEN',
          title: `Vi phạm cam kết SLA (${overdueHours}h quá hạn): ${ticket.code}`,
          description: `Sự vụ "${ticket.title}" (${ticket.apartment.code}) trễ hạn xử lý. Phụ trách: ${
            ticket.assignedStaff?.fullName || 'Chưa phân công'
          }.`,
          entityType: 'TICKET',
          entityId: ticket.id,
          actionUrl: `/feedbacks?search=${ticket.code}`,
          createdAt: dueAt,
          metadata: { overdueHours, priority: ticket.priority, apartmentCode: ticket.apartment.code },
        });
      } else if (remainingHours <= 4 && remainingHours > 0) {
        // SLA Approaching (<= 4h)
        alerts.push({
          id: `alert_ticket_appr_${ticket.id}`,
          type: 'TICKET_SLA_APPROACHING',
          severity: isUrgent ? 'CRITICAL' : 'WARNING',
          source: 'SLA',
          status: 'OPEN',
          title: `Sắp chạm ngưỡng trễ hạn SLA (còn ${remainingHours}h): ${ticket.code}`,
          description: `Sự vụ "${ticket.title}" cần xử lý dứt điểm trước ${dueAt.toLocaleTimeString('vi-VN')}.`,
          entityType: 'TICKET',
          entityId: ticket.id,
          actionUrl: `/feedbacks?search=${ticket.code}`,
          createdAt: currentDate,
          metadata: { remainingHours, priority: ticket.priority, apartmentCode: ticket.apartment.code },
        });
      } else if (isUrgent && ticket.status === TicketStatus.NEW) {
        // Urgent ticket unassigned
        alerts.push({
          id: `alert_ticket_crit_${ticket.id}`,
          type: 'TICKET_CRITICAL_PENDING',
          severity: 'CRITICAL',
          source: 'MAINTENANCE',
          status: 'OPEN',
          title: `Sự vụ mức độ KHẨN CẤP chưa được tiếp nhận: ${ticket.code}`,
          description: `Căn hộ ${ticket.apartment.code} báo sự cố khẩn: "${ticket.title}". Cần kỹ thuật viên vào cuộc ngay.`,
          entityType: 'TICKET',
          entityId: ticket.id,
          actionUrl: `/feedbacks?search=${ticket.code}`,
          createdAt: ticket.createdAt,
          metadata: { priority: ticket.priority, apartmentCode: ticket.apartment.code },
        });
      }
    }

    // 4. SCAN MAINTENANCE SCHEDULE ALERTS
    for (const schedule of activeSchedules) {
      const nextMs = new Date(schedule.nextMaintenance).getTime();
      const diffDays = Math.ceil((nextMs - currentDate.getTime()) / (24 * 3600 * 1000));

      if (diffDays < 0) {
        // Overdue maintenance
        alerts.push({
          id: `alert_maint_over_${schedule.id}`,
          type: 'MAINTENANCE_OVERDUE',
          severity: 'CRITICAL',
          source: 'MAINTENANCE',
          status: 'OPEN',
          title: `Quá hạn bảo dưỡng thiết bị: ${schedule.asset.name}`,
          description: `Lịch bảo dưỡng định kỳ "${schedule.title}" (${schedule.asset.code}) tại ${
            schedule.asset.location || 'khu vực chung'
          } đã quá hạn ${Math.abs(diffDays)} ngày.`,
          entityType: 'MAINTENANCE',
          entityId: schedule.id,
          actionUrl: `/maintenance-schedule?search=${schedule.code}`,
          createdAt: schedule.nextMaintenance,
          metadata: { overdueDays: Math.abs(diffDays), assetCode: schedule.asset.code, assetName: schedule.asset.name },
        });
      } else if (diffDays <= 3) {
        // Due soon
        alerts.push({
          id: `alert_maint_soon_${schedule.id}`,
          type: 'MAINTENANCE_DUE_SOON',
          severity: 'WARNING',
          source: 'MAINTENANCE',
          status: 'OPEN',
          title: `Lịch bảo dưỡng đến hạn (còn ${diffDays} ngày): ${schedule.asset.name}`,
          description: `Hạng mục "${schedule.title}" (${schedule.asset.code}) cần thực hiện bảo dưỡng vào ngày ${new Date(
            schedule.nextMaintenance
          ).toLocaleDateString('vi-VN')}.`,
          entityType: 'MAINTENANCE',
          entityId: schedule.id,
          actionUrl: `/maintenance-schedule?search=${schedule.code}`,
          createdAt: currentDate,
          metadata: { diffDays, assetCode: schedule.asset.code, assetName: schedule.asset.name },
        });
      }
    }

    // Sort: CRITICAL first, then HIGH, then WARNING, then INFO
    const severityScore: Record<AlertSeverity, number> = {
      CRITICAL: 4,
      HIGH: 3,
      WARNING: 2,
      INFO: 1,
    };

    alerts.sort((a, b) => {
      const scoreDiff = severityScore[b.severity] - severityScore[a.severity];
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Update Cache
    this.cache = {
      timestamp: now,
      alerts,
    };

    return alerts;
  }

  /**
   * Filtered & paginated query for Alert Dashboard
   */
  async queryAlerts(filter: SmartAlertFilter = {}) {
    const allAlerts = await this.getSmartAlerts(true);
    let filtered = allAlerts;

    if (filter.severity) {
      filtered = filtered.filter((a) => a.severity === filter.severity);
    }
    if (filter.source) {
      filtered = filtered.filter((a) => a.source === filter.source);
    }
    if (filter.status) {
      filtered = filtered.filter((a) => (a.status || 'OPEN') === filter.status);
    }
    if (filter.location) {
      const loc = filter.location.toLowerCase();
      filtered = filtered.filter((a) => a.location?.toLowerCase().includes(loc));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    const activeAlerts = allAlerts.filter((a) => a.status !== 'RESOLVED');
    const countsSource = filter.status ? filtered : activeAlerts;

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      top5Today: activeAlerts.slice(0, 5),
      counts: {
        total: countsSource.length,
        critical: countsSource.filter((a) => a.severity === 'CRITICAL').length,
        high: countsSource.filter((a) => a.severity === 'HIGH').length,
        warning: countsSource.filter((a) => a.severity === 'WARNING').length,
        info: countsSource.filter((a) => a.severity === 'INFO').length,
      },
    };
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string, actor: { id: string; email?: string; role?: string }) {
    const dbRecord = await prisma.smartAlertRecord.findUnique({ where: { id } });

    if (dbRecord) {
      await prisma.smartAlertRecord.update({
        where: { id },
        data: {
          status: SmartAlertStatus.ACKNOWLEDGED,
          acknowledgedAt: new Date(),
          acknowledgedById: actor.id,
        },
      });
    } else {
      // Dynamic alert acknowledged -> persist to DB
      const all = await this.getSmartAlerts();
      const target = all.find((a) => a.id === id);
      if (target) {
        await prisma.smartAlertRecord.create({
          data: {
            title: target.title,
            description: target.description,
            type: target.type,
            severity: target.severity as any,
            source: (target.source || SmartAlertSource.SLA) as any,
            status: SmartAlertStatus.ACKNOWLEDGED,
            location: target.location,
            relatedEntityType: target.entityType,
            relatedEntityId: target.entityId,
            actionUrl: target.actionUrl,
            acknowledgedAt: new Date(),
            acknowledgedById: actor.id,
          },
        });
      }
    }

    await auditLogService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SMART_ALERT_ACKNOWLEDGED',
      entity: 'SMART_ALERT',
      entityId: id,
    });

    this.cache = null; // Invalidate cache
    return { success: true, message: 'Đã tiếp nhận cảnh báo thành công' };
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(id: string, actor: { id: string; email?: string; role?: string }) {
    const dbRecord = await prisma.smartAlertRecord.findUnique({ where: { id } });

    if (dbRecord) {
      await prisma.smartAlertRecord.update({
        where: { id },
        data: {
          status: SmartAlertStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedById: actor.id,
        },
      });
    } else {
      const all = await this.getSmartAlerts();
      const target = all.find((a) => a.id === id);
      if (target) {
        await prisma.smartAlertRecord.create({
          data: {
            title: target.title,
            description: target.description,
            type: target.type,
            severity: target.severity as any,
            source: (target.source || SmartAlertSource.SLA) as any,
            status: SmartAlertStatus.RESOLVED,
            location: target.location,
            relatedEntityType: target.entityType,
            relatedEntityId: target.entityId,
            actionUrl: target.actionUrl,
            resolvedAt: new Date(),
            resolvedById: actor.id,
          },
        });
      }
    }

    await auditLogService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SMART_ALERT_RESOLVED',
      entity: 'SMART_ALERT',
      entityId: id,
    });

    this.cache = null;
    return { success: true, message: 'Đã giải quyết cảnh báo thành công' };
  }

  /**
   * Returns "5 việc cần chú ý hôm nay" - Top 5 prioritized action items
   */
  async getTop5Today(): Promise<SmartAlert[]> {
    const alerts = await this.getSmartAlerts();
    return alerts.filter((a) => a.status !== 'RESOLVED').slice(0, 5);
  }

  /**
   * Returns severity counts
   */
  async getCounts() {
    const alerts = await this.getSmartAlerts();
    const active = alerts.filter((a) => a.status !== 'RESOLVED');
    return {
      total: active.length,
      critical: active.filter((a) => a.severity === 'CRITICAL').length,
      high: active.filter((a) => a.severity === 'HIGH').length,
      warning: active.filter((a) => a.severity === 'WARNING').length,
      info: active.filter((a) => a.severity === 'INFO').length,
    };
  }
}

export const smartAlertService = new SmartAlertService();
