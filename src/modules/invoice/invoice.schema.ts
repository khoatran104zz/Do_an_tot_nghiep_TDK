import { z } from 'zod';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export const createInvoiceItemSchema = z.object({
  feeCategoryId: z.string().optional(),
  title: z.string().min(1, 'Tên mục phí là bắt buộc'),
  quantity: z.coerce.number().min(0.01, 'Số lượng phải lớn hơn 0'),
  unitPrice: z.coerce.number().min(0, 'Đơn giá không được âm'),
  note: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  apartmentId: z.string().min(1, 'Vui lòng chọn căn hộ'),
  billingMonth: z.string().min(6, 'Tháng billing dạng YYYY-MM (VD: 2026-08)'),
  dueDate: z.string().min(1, 'Hạn thanh toán là bắt buộc'),
  note: z.string().optional(),
  items: z.array(createInvoiceItemSchema).min(1, 'Hóa đơn phải có ít nhất 1 mục phí'),
});

export const generateMonthlyInvoicesSchema = z.object({
  billingMonth: z.string().min(6, 'Tháng dạng YYYY-MM'),
  dueDate: z.string().min(1, 'Hạn thanh toán là bắt buộc'),
});

export const processPaymentSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.VNPAY),
  transactionId: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
