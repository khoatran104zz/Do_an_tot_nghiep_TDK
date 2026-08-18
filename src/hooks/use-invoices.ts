import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceClientService } from '@/services/invoice.service';
import { InvoiceFilter, CreateInvoiceDto, GenerateMonthlyInvoicesDto, ProcessPaymentDto } from '@/modules/invoice/invoice.types';
import { toast } from 'sonner';

export function useInvoices(filter: InvoiceFilter = {}) {
  return useQuery({
    queryKey: ['invoices', filter],
    queryFn: () => invoiceClientService.getInvoices(filter),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceClientService.getInvoiceById(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceDto) => invoiceClientService.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Tạo hóa đơn thủ công thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Tạo hóa đơn thất bại!');
    },
  });
}

export function useGenerateMonthlyInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateMonthlyInvoicesDto) => invoiceClientService.generateMonthlyInvoices(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(res.message || 'Tạo hóa đơn hàng loạt thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Tạo hóa đơn hàng loạt thất bại!');
    },
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProcessPaymentDto }) =>
      invoiceClientService.processPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Thanh toán hóa đơn thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thanh toán thất bại!');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceClientService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Xóa hóa đơn thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Xóa hóa đơn thất bại!');
    },
  });
}
