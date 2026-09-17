import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export interface InvoiceFilter {
  search?: string;
  apartmentId?: string;
  buildingId?: string;
  buildingIds?: string[];
  billingMonth?: string;
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceItemDto {
  feeCategoryId?: string;
  title: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface CreateInvoiceDto {
  apartmentId: string;
  billingMonth: string; // "YYYY-MM"
  dueDate: string;
  note?: string;
  items: CreateInvoiceItemDto[];
}

export interface GenerateMonthlyInvoicesDto {
  billingMonth: string; // "YYYY-MM"
  dueDate: string;
  buildingId?: string;
  buildingIds?: string[];
}

export interface ProcessPaymentDto {
  paymentMethod: PaymentMethod;
  transactionId?: string;
}
