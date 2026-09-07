import { invoiceRepository } from './invoice.repository';
import { feeCategoryRepository } from '../fee/fee.repository';
import { apartmentRepository } from '../apartment/apartment.repository';
import { InvoiceFilter, CreateInvoiceDto, GenerateMonthlyInvoicesDto, ProcessPaymentDto } from './invoice.types';
import { prisma } from '@/lib/prisma';
import { auditLogService } from '../audit/audit-log.service';

export interface AuditContext {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  ipAddress?: string | null;
}

export class InvoiceService {
  async getInvoices(filter: InvoiceFilter) {
    return invoiceRepository.findAll(filter);
  }

  async getInvoiceById(id: string) {
    const item = await invoiceRepository.findById(id);
    if (!item) {
      throw new Error('Không tìm thấy hóa đơn yêu cầu');
    }
    return item;
  }

  async createInvoice(data: CreateInvoiceDto, audit?: AuditContext) {
    const existing = await invoiceRepository.findByApartmentAndMonth(data.apartmentId, data.billingMonth);
    if (existing) {
      throw new Error(`Căn hộ này đã có hóa đơn kỳ ${data.billingMonth}`);
    }

    // Always calculate totalAmount strictly on server side
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const invoiceCode = `INV-${data.billingMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice = await invoiceRepository.create(data, invoiceCode, totalAmount);

    // Audit log
    await auditLogService.record({
      actorId: audit?.actorId,
      actorEmail: audit?.actorEmail,
      actorRole: audit?.actorRole,
      ipAddress: audit?.ipAddress,
      action: 'CREATE_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      metadata: {
        code: invoiceCode,
        apartmentId: data.apartmentId,
        billingMonth: data.billingMonth,
        totalAmount,
        itemCount: data.items.length,
      },
    });

    return invoice;
  }

  /**
   * Automatic Monthly Invoice Generator Engine wrapped in atomic database transaction
   */
  async generateMonthlyInvoices(dto: GenerateMonthlyInvoicesDto, audit?: AuditContext) {
    const { billingMonth, dueDate } = dto;

    // Fetch apartments and active fee categories
    const apartmentsRes = await apartmentRepository.findAll({ limit: 1000 });
    const feeCategories = await feeCategoryRepository.findAll();

    const result = await prisma.$transaction(async (tx) => {
      const createdInvoices = [];
      let skippedCount = 0;

      for (const apt of apartmentsRes.items) {
        const existing = await invoiceRepository.findByApartmentAndMonth(apt.id, billingMonth, tx);
        if (existing) {
          skippedCount++;
          continue;
        }

        const items = [];

        // Calculate items based on active Fee Categories
        for (const fee of feeCategories) {
          let quantity = 1;
          const unitPrice = fee.unitPrice;

          if (fee.unit === 'PER_M2') {
            quantity = apt.area;
          } else if (fee.unit === 'PER_VEHICLE') {
            quantity = 2; // Default 2 vehicles per apartment
          } else if (fee.unit === 'PER_KWH') {
            quantity = 150; // Standard nominal unit consumption
          } else if (fee.unit === 'PER_M3') {
            quantity = 15; // Standard nominal unit consumption
          }

          items.push({
            feeCategoryId: fee.id,
            title: fee.name,
            quantity,
            unitPrice,
            note: `${fee.unit === 'PER_M2' ? `Diện tích ${apt.area} m²` : ''}`,
          });
        }

        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const invoiceCode = `INV-${billingMonth.replace('-', '')}-${apt.code}`;

        const created = await invoiceRepository.create(
          {
            apartmentId: apt.id,
            billingMonth,
            dueDate,
            items,
          },
          invoiceCode,
          totalAmount,
          tx
        );
        createdInvoices.push(created);
      }

      return {
        generatedCount: createdInvoices.length,
        skippedCount,
        billingMonth,
      };
    });

    // Record batch generation audit log
    await auditLogService.record({
      actorId: audit?.actorId,
      actorEmail: audit?.actorEmail,
      actorRole: audit?.actorRole,
      ipAddress: audit?.ipAddress,
      action: 'GENERATE_MONTHLY_INVOICES',
      entity: 'INVOICE',
      metadata: {
        billingMonth,
        generatedCount: result.generatedCount,
        skippedCount: result.skippedCount,
      },
    });

    return result;
  }

  async processPayment(id: string, dto: ProcessPaymentDto, audit?: AuditContext) {
    const updated = await invoiceRepository.processPayment(id, dto);

    // Audit log
    await auditLogService.record({
      actorId: audit?.actorId,
      actorEmail: audit?.actorEmail,
      actorRole: audit?.actorRole,
      ipAddress: audit?.ipAddress,
      action: 'PROCESS_PAYMENT',
      entity: 'INVOICE',
      entityId: id,
      metadata: {
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
      },
    });

    return updated;
  }

  async deleteInvoice(id: string, audit?: AuditContext) {
    const invoice = await this.getInvoiceById(id);
    const deleted = await invoiceRepository.delete(id);

    await auditLogService.record({
      actorId: audit?.actorId,
      actorEmail: audit?.actorEmail,
      actorRole: audit?.actorRole,
      ipAddress: audit?.ipAddress,
      action: 'DELETE_INVOICE',
      entity: 'INVOICE',
      entityId: id,
      metadata: {
        code: invoice.code,
        apartmentId: invoice.apartmentId,
      },
    });

    return deleted;
  }
}

export const invoiceService = new InvoiceService();

