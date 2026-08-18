import { invoiceRepository } from './invoice.repository';
import { feeCategoryRepository } from '../fee/fee.repository';
import { apartmentRepository } from '../apartment/apartment.repository';
import { InvoiceFilter, CreateInvoiceDto, GenerateMonthlyInvoicesDto, ProcessPaymentDto } from './invoice.types';

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

  async createInvoice(data: CreateInvoiceDto) {
    const existing = await invoiceRepository.findByApartmentAndMonth(data.apartmentId, data.billingMonth);
    if (existing) {
      throw new Error(`Căn hộ này đã có hóa đơn kỳ ${data.billingMonth}`);
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const invoiceCode = `INV-${data.billingMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return invoiceRepository.create(data, invoiceCode, totalAmount);
  }

  /**
   * Automatic Monthly Invoice Generator Engine
   */
  async generateMonthlyInvoices(dto: GenerateMonthlyInvoicesDto) {
    const { billingMonth, dueDate } = dto;

    // Fetch apartments and active fee categories
    const apartmentsRes = await apartmentRepository.findAll({ limit: 1000 });
    const feeCategories = await feeCategoryRepository.findAll();

    const createdInvoices = [];
    let skippedCount = 0;

    for (const apt of apartmentsRes.items) {
      const existing = await invoiceRepository.findByApartmentAndMonth(apt.id, billingMonth);
      if (existing) {
        skippedCount++;
        continue;
      }

      const items = [];

      // Calculate items based on Fee Categories
      for (const fee of feeCategories) {
        let quantity = 1;
        let unitPrice = fee.unitPrice;

        if (fee.unit === 'PER_M2') {
          quantity = apt.area;
        } else if (fee.unit === 'PER_VEHICLE') {
          quantity = 2; // Default sample 2 vehicles per apartment
        } else if (fee.unit === 'PER_KWH') {
          quantity = Math.floor(120 + Math.random() * 80); // Sample 120-200 kWh
        } else if (fee.unit === 'PER_M3') {
          quantity = Math.floor(10 + Math.random() * 15); // Sample 10-25 m3 water
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
        totalAmount
      );
      createdInvoices.push(created);
    }

    return {
      generatedCount: createdInvoices.length,
      skippedCount,
      billingMonth,
    };
  }

  async processPayment(id: string, dto: ProcessPaymentDto) {
    const invoice = await this.getInvoiceById(id);
    if (invoice.status === 'PAID') {
      throw new Error('Hóa đơn này đã được thanh toán trước đó');
    }
    return invoiceRepository.processPayment(id, dto);
  }

  async deleteInvoice(id: string) {
    await this.getInvoiceById(id);
    return invoiceRepository.delete(id);
  }
}

export const invoiceService = new InvoiceService();
