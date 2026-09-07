import { prisma } from '@/lib/prisma';
import { SmartAlert, AlertType, AlertSeverity } from './smart-operations.types';
import { TicketPriority, TicketStatus, ContractStatus, InvoiceStatus } from '@prisma/client';
import { SLA_HOURS_BY_PRIORITY } from '../feedback/ticket-workflow.service';

export class SmartAlertService {
  private cache: {
    timestamp: number;
    alerts: SmartAlert[];
  } | null = null;

  private readonly CACHE_TTL_MS = 30 * 1000; // 30 seconds fresh cache

  /**
   * Scans and aggregates all smart operational alerts from real DB data
   */
  async getSmartAlerts(forceFresh = false): Promise<SmartAlert[]> {
    const now = Date.now();
    if (!forceFresh && this.cache && now - this.cache.timestamp < this.CACHE_TTL_MS) {
      return this.cache.alerts;
    }

    const currentDate = new Date();
    const alerts: SmartAlert[] = [];

    // Parallel DB Fetching for active resources
    const [activeContracts, unpaidInvoices, activeTickets] = await Promise.all([
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
        where: {
          status: { in: [TicketStatus.NEW, TicketStatus.ASSIGNED, TicketStatus.PROCESSING] },
        },
        include: {
          apartment: { select: { code: true, building: true } },
          assignedStaff: { select: { fullName: true } },
        },
      }),
    ]);

    // 1. SCAN CONTRACT ALERTS
    for (const contract of activeContracts) {
      const endMs = new Date(contract.endDate).getTime();
      const diffDays = Math.ceil((endMs - currentDate.getTime()) / (24 * 3600 * 1000));

      if (diffDays < 0) {
        // Expired but still marked active
        alerts.push({
          id: `alert_contract_exp_${contract.id}`,
          type: 'CONTRACT_EXPIRED',
          severity: 'CRITICAL',
          title: `Hợp đồng đã quá hạn: ${contract.contractCode}`,
          description: `Căn hộ ${contract.apartment.code} (${contract.resident.fullName}) đã quá hạn ${Math.abs(
            diffDays
          )} ngày. Cần gia hạn hoặc làm thủ tục thanh lý.`,
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
        alerts.push({
          id: `alert_ticket_breached_${ticket.id}`,
          type: 'TICKET_SLA_BREACHED',
          severity: 'CRITICAL',
          title: `Sự cố trễ hạn cam kết SLA (${Math.abs(remainingHours)}h): ${ticket.code}`,
          description: `Sự cố "${ticket.title}" tại căn hộ ${ticket.apartment.code} đã vượt khung cam kết SLA (${hours}h) mà chưa hoàn tất.`,
          entityType: 'TICKET',
          entityId: ticket.id,
          actionUrl: `/feedbacks/${ticket.id}`,
          createdAt: dueAt,
          metadata: { priority: ticket.priority, hoursOverdue: Math.abs(remainingHours), apartmentCode: ticket.apartment.code },
        });
      } else if (remainingHours <= 4) {
        // SLA Approaching (< 4 hours left)
        alerts.push({
          id: `alert_ticket_appr_${ticket.id}`,
          type: 'TICKET_SLA_APPROACHING',
          severity: 'WARNING',
          title: `Sự cố sắp chạm mốc SLA (còn ${remainingHours}h): ${ticket.code}`,
          description: `Sự cố "${ticket.title}" tại căn hộ ${ticket.apartment.code} sắp hết hạn SLA. Nhân sự: ${
            ticket.assignedStaff?.fullName || 'Chưa phân công'
          }.`,
          entityType: 'TICKET',
          entityId: ticket.id,
          actionUrl: `/feedbacks/${ticket.id}`,
          createdAt: currentDate,
          metadata: { priority: ticket.priority, remainingHours, apartmentCode: ticket.apartment.code },
        });
      } else if (isUrgent && ticket.status === TicketStatus.NEW) {
        // Critical pending without assignment
        alerts.push({
          id: `alert_ticket_crit_new_${ticket.id}`,
          type: 'TICKET_CRITICAL_PENDING',
          severity: 'CRITICAL',
          title: `Sự cố khẩn cấp cấp độ 1 chưa phân công: ${ticket.code}`,
          description: `Yêu cầu khẩn cấp "${ticket.title}" tại căn hộ ${ticket.apartment.code} chưa được phân công kỹ thuật viên.`,
          entityType: 'TICKET',
          entityId: ticket.id,
          actionUrl: `/feedbacks/${ticket.id}`,
          createdAt: ticket.createdAt,
          metadata: { priority: ticket.priority, apartmentCode: ticket.apartment.code },
        });
      }
    }

    // Sort: CRITICAL first, then WARNING, then INFO
    const severityScore: Record<AlertSeverity, number> = {
      CRITICAL: 3,
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
   * Returns "5 việc cần chú ý hôm nay" - Top 5 prioritized action items
   */
  async getTop5Today(): Promise<SmartAlert[]> {
    const alerts = await this.getSmartAlerts();
    return alerts.slice(0, 5);
  }

  /**
   * Returns severity counts
   */
  async getCounts() {
    const alerts = await this.getSmartAlerts();
    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
      warning: alerts.filter((a) => a.severity === 'WARNING').length,
      info: alerts.filter((a) => a.severity === 'INFO').length,
    };
  }
}

export const smartAlertService = new SmartAlertService();
