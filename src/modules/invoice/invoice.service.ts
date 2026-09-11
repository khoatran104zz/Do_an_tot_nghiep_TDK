import { invoiceRepository } from './invoice.repository';
import { feeCategoryRepository } from '../fee/fee.repository';
import { apartmentRepository } from '../apartment/apartment.repository';
import { InvoiceFilter, CreateInvoiceDto, GenerateMonthlyInvoicesDto, ProcessPaymentDto } from './invoice.types';
import { prisma } from '@/lib/prisma';
import { auditLogService } from '../audit/audit-log.service';
import { VehicleType, VehicleStatus } from '@prisma/client';

export interface AuditContext {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  ipAddress?: string | null;
}

/**
 * Filter vehicles matching a parking fee category.
 * If dedicated electric bike fee exists, MOTORBIKE fee won't include electric bikes.
 */
export function getMatchingVehiclesForFee(
  vehicles: Array<{ type: VehicleType; licensePlate: string }>,
  fee: { code: string; name: string },
  allFeeCategories: Array<{ code: string; name: string }>
) {
  const hasSpecificElectricBikeFee = allFeeCategories.some(
    (f) =>
      f.code.toUpperCase().includes('ELECTRIC_BIKE') ||
      f.name.toLowerCase().includes('xe máy điện') ||
      f.name.toLowerCase().includes('xe điện')
  );

  return vehicles.filter((v) => {
    const code = fee.code.toUpperCase();
    const name = fee.name.toLowerCase();

    if (code.includes('CAR') || name.includes('ô tô') || name.includes('xe hơi')) {
      return v.type === VehicleType.CAR;
    }
    if (code.includes('BICYCLE') || name.includes('xe đạp')) {
      return v.type === VehicleType.BICYCLE;
    }
    if (code.includes('ELECTRIC_BIKE') || name.includes('xe điện') || name.includes('xe máy điện')) {
      return v.type === VehicleType.ELECTRIC_BIKE;
    }
    if (code.includes('MOTO') || code.includes('MOTORBIKE') || name.includes('xe máy')) {
      if (v.type === VehicleType.MOTORBIKE) return true;
      if (v.type === VehicleType.ELECTRIC_BIKE && !hasSpecificElectricBikeFee) return true;
      return false;
    }
    // Generic vehicle fee
    return true;
  });
}

/**
 * Helper to compute [startOfMonth, endOfMonth] from "YYYY-MM"
 */
export function parseBillingMonthRange(billingMonth: string): { startOfMonth: Date; endOfMonth: Date } {
  const [yearStr, monthStr] = billingMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Định dạng kỳ thanh toán không hợp lệ: ${billingMonth} (yêu cầu dạng YYYY-MM)`);
  }

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { startOfMonth, endOfMonth };
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

    const apt = await prisma.apartment.findUnique({
      where: { id: data.apartmentId },
    });
    if (!apt) {
      throw new Error('Không tìm thấy căn hộ');
    }

    const { startOfMonth, endOfMonth } = parseBillingMonthRange(data.billingMonth);

    // Fetch active billable vehicles for this apartment
    const rawVehicles = await prisma.vehicle.findMany({
      where: {
        apartmentId: data.apartmentId,
        status: VehicleStatus.ACTIVE,
        createdAt: { lt: endOfMonth },
        OR: [
          { residentId: null },
          { resident: { status: { not: 'MOVED_OUT' } } },
        ],
      },
      include: {
        parkingCards: {
          where: { status: { in: ['ACTIVE', 'PENDING'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const activeVehicles = rawVehicles.filter((v) => {
      if (v.parkingCards && v.parkingCards.length > 0) {
        const card = v.parkingCards[0];
        if (card.expiresAt && card.expiresAt < startOfMonth) {
          return false;
        }
      }
      return true;
    });

    const allFeeCategories = await prisma.feeCategory.findMany();
    const feeCatMap = new Map(allFeeCategories.map((f) => [f.id, f]));

    // Strictly re-verify and calculate items on the backend - never trust frontend input
    const validatedItems: Array<{
      feeCategoryId?: string;
      title: string;
      quantity: number;
      unitPrice: number;
      note?: string;
    }> = [];
    const parkingAuditItems: Array<{
      title: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      note?: string;
    }> = [];

    for (const item of data.items) {
      let quantity = item.quantity;
      let unitPrice = item.unitPrice;
      let note = item.note || '';

      if (item.feeCategoryId && feeCatMap.has(item.feeCategoryId)) {
        const fee = feeCatMap.get(item.feeCategoryId)!;
        unitPrice = fee.unitPrice; // Enforce official fee price

        if (fee.unit === 'PER_VEHICLE') {
          const matchingVehicles = getMatchingVehiclesForFee(activeVehicles, fee, allFeeCategories);
          quantity = matchingVehicles.length;

          // Zero-quantity rule: do not add parking fee item if apartment has 0 matching vehicles
          if (quantity === 0) {
            continue;
          }

          const plates = matchingVehicles.map((v) => v.licensePlate).join(', ');
          note = `${quantity} phương tiện: ${plates}`;
        } else if (fee.unit === 'PER_M2') {
          quantity = apt.area;
          note = `Diện tích ${apt.area} m²`;
        }
      }

      if (quantity > 0) {
        const lineItem = {
          feeCategoryId: item.feeCategoryId || undefined,
          title: item.title,
          quantity,
          unitPrice,
          note: note || undefined,
        };
        validatedItems.push(lineItem);

        if (item.feeCategoryId && feeCatMap.get(item.feeCategoryId)?.unit === 'PER_VEHICLE') {
          parkingAuditItems.push({
            title: item.title,
            quantity,
            unitPrice,
            amount: quantity * unitPrice,
            note,
          });
        }
      }
    }

    if (validatedItems.length === 0) {
      throw new Error('Hóa đơn không có khoản phí nào hợp lệ để phát hành');
    }

    const totalAmount = validatedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const invoiceCode = `INV-${data.billingMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice = await prisma.$transaction(async (tx) => {
      return invoiceRepository.create(
        {
          apartmentId: data.apartmentId,
          billingMonth: data.billingMonth,
          dueDate: data.dueDate,
          note: data.note,
          items: validatedItems as any,
        },
        invoiceCode,
        totalAmount,
        tx
      );
    });

    // Audit log
    await auditLogService.record({
      actorId: audit?.actorId,
      actorEmail: audit?.actorEmail,
      actorRole: audit?.actorRole,
      ipAddress: audit?.ipAddress,
      action: 'GENERATE_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      metadata: {
        code: invoiceCode,
        apartmentId: data.apartmentId,
        billingMonth: data.billingMonth,
        totalAmount,
        itemCount: validatedItems.length,
      },
    });

    if (parkingAuditItems.length > 0) {
      await auditLogService.record({
        actorId: audit?.actorId,
        actorEmail: audit?.actorEmail,
        actorRole: audit?.actorRole,
        ipAddress: audit?.ipAddress,
        action: 'GENERATE_PARKING_FEE',
        entity: 'INVOICE',
        entityId: invoice.id,
        metadata: {
          apartmentId: data.apartmentId,
          billingMonth: data.billingMonth,
          parkingItems: parkingAuditItems,
          totalParkingAmount: parkingAuditItems.reduce((sum, it) => sum + it.amount, 0),
        },
      });
    }

    return invoice;
  }

  /**
   * Automatic Monthly Invoice Generator Engine wrapped in atomic database transaction.
   * Dynamically calculates parking fee quantities from actual active vehicles.
   */
  async generateMonthlyInvoices(dto: GenerateMonthlyInvoicesDto, audit?: AuditContext) {
    const { billingMonth, dueDate } = dto;
    const { startOfMonth, endOfMonth } = parseBillingMonthRange(billingMonth);

    // Fetch apartments and active fee categories
    const apartmentsRes = await apartmentRepository.findAll({ limit: 1000 });
    const feeCategories = await feeCategoryRepository.findAll();

    const parkingAuditRecords: Array<{
      apartmentId: string;
      apartmentCode: string;
      invoiceId: string;
      parkingItems: Array<{ title: string; quantity: number; unitPrice: number; amount: number; note?: string }>;
    }> = [];

    const result = await prisma.$transaction(async (tx) => {
      const createdInvoices = [];
      let skippedCount = 0;

      for (const apt of apartmentsRes.items) {
        // Idempotency: Skip if invoice already exists for this apartment and billing month
        const existing = await invoiceRepository.findByApartmentAndMonth(apt.id, billingMonth, tx);
        if (existing) {
          skippedCount++;
          continue;
        }

        // Fetch active billable vehicles for this apartment
        const rawVehicles = await tx.vehicle.findMany({
          where: {
            apartmentId: apt.id,
            status: VehicleStatus.ACTIVE,
            createdAt: { lt: endOfMonth },
            OR: [
              { residentId: null },
              { resident: { status: { not: 'MOVED_OUT' } } },
            ],
          },
          include: {
            parkingCards: {
              where: { status: { in: ['ACTIVE', 'PENDING'] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        // Exclude vehicles whose latest parking card expired prior to the billing month
        const activeVehicles = rawVehicles.filter((v) => {
          if (v.parkingCards && v.parkingCards.length > 0) {
            const card = v.parkingCards[0];
            if (card.expiresAt && card.expiresAt < startOfMonth) {
              return false;
            }
          }
          return true;
        });

        const items: Array<{
          feeCategoryId?: string;
          title: string;
          quantity: number;
          unitPrice: number;
          note?: string;
        }> = [];
        const aptParkingAuditItems: Array<{
          title: string;
          quantity: number;
          unitPrice: number;
          amount: number;
          note?: string;
        }> = [];

        // Calculate items based on active Fee Categories
        for (const fee of feeCategories) {
          let quantity = 1;
          const unitPrice = fee.unitPrice;
          let note = '';

          if (fee.unit === 'PER_M2') {
            quantity = apt.area;
            note = `Diện tích ${apt.area} m²`;
          } else if (fee.unit === 'PER_VEHICLE') {
            // DYNAMIC CALCULATION: count active vehicles matching this fee category
            const matchingVehicles = getMatchingVehiclesForFee(activeVehicles, fee, feeCategories);
            quantity = matchingVehicles.length;

            // Zero-Quantity Rule: Do NOT create an invoice line item if apartment has 0 matching vehicles
            if (quantity === 0) {
              continue;
            }

            const plates = matchingVehicles.map((v) => v.licensePlate).join(', ');
            note = `${quantity} phương tiện: ${plates}`;
          } else if (fee.unit === 'PER_KWH') {
            quantity = 150; // Standard nominal unit consumption
          } else if (fee.unit === 'PER_M3') {
            quantity = 15; // Standard nominal unit consumption
          }

          const lineItem = {
            feeCategoryId: fee.id || undefined,
            title: fee.name,
            quantity,
            unitPrice,
            note: note || undefined,
          };

          items.push(lineItem);

          if (fee.unit === 'PER_VEHICLE') {
            aptParkingAuditItems.push({
              title: fee.name,
              quantity,
              unitPrice,
              amount: quantity * unitPrice,
              note,
            });
          }
        }

        // Calculate total amount strictly on server side
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

        if (aptParkingAuditItems.length > 0) {
          parkingAuditRecords.push({
            apartmentId: apt.id,
            apartmentCode: apt.code,
            invoiceId: created.id,
            parkingItems: aptParkingAuditItems,
          });
        }
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

    // Record GENERATE_PARKING_FEE audit logs
    for (const record of parkingAuditRecords) {
      await auditLogService.record({
        actorId: audit?.actorId,
        actorEmail: audit?.actorEmail,
        actorRole: audit?.actorRole,
        ipAddress: audit?.ipAddress,
        action: 'GENERATE_PARKING_FEE',
        entity: 'INVOICE',
        entityId: record.invoiceId,
        metadata: {
          apartmentId: record.apartmentId,
          apartmentCode: record.apartmentCode,
          billingMonth,
          parkingItems: record.parkingItems,
          totalParkingAmount: record.parkingItems.reduce((sum, it) => sum + it.amount, 0),
        },
      });
    }

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

