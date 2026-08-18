import { prisma } from '@/lib/prisma';
import { InvoiceFilter, CreateInvoiceDto, ProcessPaymentDto } from './invoice.types';
import { Prisma, InvoiceStatus } from '@prisma/client';

export class InvoiceRepository {
  async findAll(filter: InvoiceFilter) {
    const { search, apartmentId, billingMonth, status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { apartment: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (apartmentId) {
      where.apartmentId = apartmentId;
    }

    if (billingMonth) {
      where.billingMonth = billingMonth;
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          apartment: {
            select: {
              id: true,
              code: true,
              building: true,
              area: true,
              residents: { select: { fullName: true, phone: true, email: true } },
            },
          },
          items: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        apartment: {
          include: {
            residents: true,
          },
        },
        items: {
          include: { feeCategory: true },
        },
      },
    });
  }

  async findByApartmentAndMonth(apartmentId: string, billingMonth: string) {
    return prisma.invoice.findFirst({
      where: { apartmentId, billingMonth },
    });
  }

  async create(data: CreateInvoiceDto, invoiceCode: string, totalAmount: number) {
    return prisma.invoice.create({
      data: {
        code: invoiceCode,
        apartmentId: data.apartmentId,
        billingMonth: data.billingMonth,
        dueDate: new Date(data.dueDate),
        totalAmount,
        status: InvoiceStatus.UNPAID,
        note: data.note || null,
        items: {
          create: data.items.map((item) => ({
            feeCategoryId: item.feeCategoryId || null,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            note: item.note || null,
          })),
        },
      },
      include: { items: true },
    });
  }

  async processPayment(id: string, data: ProcessPaymentDto) {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId || `PAY-${Date.now()}`,
      },
    });
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    return prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    return prisma.invoice.delete({
      where: { id },
    });
  }
}

export const invoiceRepository = new InvoiceRepository();
