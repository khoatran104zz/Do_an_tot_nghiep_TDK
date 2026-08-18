import { apiClient } from '@/lib/api-client';
import { InvoiceFilter, CreateInvoiceDto, GenerateMonthlyInvoicesDto, ProcessPaymentDto } from '@/modules/invoice/invoice.types';

export const invoiceClientService = {
  async getInvoices(filter: InvoiceFilter = {}) {
    return apiClient('/invoices', { params: filter as any });
  },

  async getInvoiceById(id: string) {
    return apiClient(`/invoices/${id}`);
  },

  async createInvoice(data: CreateInvoiceDto) {
    return apiClient('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateMonthlyInvoices(data: GenerateMonthlyInvoicesDto) {
    return apiClient('/invoices/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async processPayment(id: string, data: ProcessPaymentDto) {
    return apiClient(`/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteInvoice(id: string) {
    return apiClient(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },
};
