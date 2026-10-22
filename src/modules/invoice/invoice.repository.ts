import { prisma } from '@/lib/prisma';
import { InvoiceFilter, CreateInvoiceDto, ProcessPaymentDto } from './invoice.types';
import { Prisma, InvoiceStatus } from '@prisma/client';

export class InvoiceRepository {
  async findAll(filter: InvoiceFilter) {
    const { search, apartmentId, buildingId, buildingIds, billingMonth, status, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const andClauses: Prisma.InvoiceWhereInput[] = [];

    if (search) {
      andClauses.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { apartment: { code: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (apartmentId) {
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

    if (billingMonth) {
      andClauses.push({ billingMonth });
    }

    if (status) {
      andClauses.push({ status });
    }

    const where: Prisma.InvoiceWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

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
              occupancies: {
                where: { isLivingHere: true },
                include: {
                  resident: { select: { fullName: true, phone: true, email: true } },
                },
              },
              ownerships: {
                where: { isCurrent: true },
                include: {
                  ownerResident: { select: { fullName: true, phone: true, email: true } },
                },
              },
            },
          },
          items: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const formattedItems = items.map((inv: any) => {
      const apt = inv.apartment;
      if (!apt) return inv;
      const residents = [
        ...(apt.occupancies || []).map((o: any) => o.resident),
        ...(apt.ownerships || []).map((o: any) => o.ownerResident),
      ];
      return {
        ...inv,
        apartment: {
          ...apt,
          residents,
        },
      };
    });

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, client: Prisma.TransactionClient = prisma) {
    const invoice = await client.invoice.findUnique({
      where: { id },
      include: {
        apartment: {
          include: {
            occupancies: {
              where: { isLivingHere: true },
              include: { resident: true },
            },
            ownerships: {
              where: { isCurrent: true },
              include: { ownerResident: true },
            },
          },
        },
        items: {
          include: { feeCategory: true },
        },
        payments: {
          orderBy: { transactedAt: 'desc' },
        },
      },
    });

    if (!invoice) return null;

    const apt = invoice.apartment;
    const residents = [
      ...(apt.occupancies || []).map((o: any) => o.resident),
      ...(apt.ownerships || []).map((o: any) => o.ownerResident),
    ];

    return {
      ...invoice,
      apartment: {
        ...apt,
        residents,
      },
    };
  }

  async findByApartmentAndMonth(apartmentId: string, billingMonth: string, tx: Prisma.TransactionClient = prisma) {
    return tx.invoice.findFirst({
      where: { apartmentId, billingMonth },
    });
  }

  async create(data: CreateInvoiceDto, invoiceCode: string, totalAmount: number, tx: Prisma.TransactionClient = prisma) {
    return tx.invoice.create({
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

  async processPayment(id: string, data: ProcessPaymentDto, tx?: Prisma.TransactionClient) {
    const execute = async (client: Prisma.TransactionClient) => {
      const invoice = await client.invoice.findUnique({ where: { id } });
      if (!invoice) {
        throw new Error('Hóa đơn không tồn tại');
      }

      const transactionId = data.transactionId || `PAY-${Date.now()}`;

      const updated = await client.invoice.updateMany({
        where: {
          id,
          status: { not: InvoiceStatus.PAID },
        },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
          paymentMethod: data.paymentMethod,
          transactionId,
        },
      });

      if (updated.count === 0) {
        throw new Error('Hóa đơn không tồn tại hoặc đã được thanh toán trước đó');
      }

      // Dual-write: Tạo bản ghi nhật ký thanh toán thực tế vào payment_transactions trong cùng transaction
      const existingTxn = await client.paymentTransaction.findFirst({
        where: { transactionCode: transactionId },
      });

      if (!existingTxn) {
        await client.paymentTransaction.create({
          data: {
            invoiceId: id,
            transactionCode: transactionId,
            amount: invoice.totalAmount,
            paymentMethod: data.paymentMethod,
            status: 'SUCCESS',
            transactedAt: new Date(),
          },
        });
      }

      return this.findById(id, client);
    };

    if (tx) {
      return execute(tx);
    }
    return prisma.$transaction((innerTx) => execute(innerTx));
  }

  async updateStatus(id: string, status: InvoiceStatus, tx: Prisma.TransactionClient = prisma) {
    return tx.invoice.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.invoice.delete({
      where: { id },
    });
  }
}

export const invoiceRepository = new InvoiceRepository();

