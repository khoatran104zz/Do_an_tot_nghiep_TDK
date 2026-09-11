'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Receipt, CreditCard, Download, CheckCircle2, QrCode, ArrowRight, Calendar, Building, DollarSign } from 'lucide-react';
import { useInvoices, useProcessPayment } from '@/hooks/use-invoices';
import { formatCurrency, formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function ResidentInvoicesPage() {
  const { data: response, isLoading, isError, error, refetch } = useInvoices();
  const invoices = response?.data || [];

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO'>('VNPAY');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const payMutation = useProcessPayment();

  const handleOpenPay = (inv: any) => {
    setSelectedInvoice(inv);
    setIsPayModalOpen(true);
  };

  const handleSimulatePayment = () => {
    if (!selectedInvoice) return;
    payMutation.mutate(
      {
        id: selectedInvoice.id,
        data: {
          paymentMethod,
          transactionId: `TXN-${Date.now()}`,
        },
      },
      {
        onSuccess: () => {
          setIsPayModalOpen(false);
          setSelectedInvoice(null);
          toast.success('Thanh toán thành công! Trạng thái hóa đơn đã được cập nhật.');
        },
      }
    );
  };

  const handleExportPDF = (inv: any) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('HOA DON THANH TOAN DICH VU CHUNG CU', 20, 20);
      doc.setFontSize(12);
      doc.text(`Ma hoa don: ${inv.code}`, 20, 35);
      doc.text(`Can ho: ${inv.apartment?.code || 'Can ho'}`, 20, 45);
      doc.text(`Ky thanh toan: ${inv.billingMonth}`, 20, 55);
      doc.text(`Tong tien: ${formatCurrency(inv.totalAmount)}`, 20, 65);
      doc.text(`Trang thai: ${inv.status === 'PAID' ? 'DA THANH TOAN' : 'CHUA THANH TOAN'}`, 20, 75);

      doc.text('----------------------------------------------------', 20, 85);
      let y = 95;
      inv.items?.forEach((item: any) => {
        doc.text(`${item.title}: ${item.quantity} x ${item.unitPrice} = ${item.amount} VND`, 20, y);
        y += 10;
      });

      doc.save(`HoaDon_${inv.code}.pdf`);
      toast.success('Đã tải xuống biên lai PDF!');
    } catch (err) {
      toast.error('Lỗi khi xuất file PDF');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn & Thanh toán Phí"
        description="Tra cứu lịch sử thu phí dịch vụ căn hộ, chi tiết điện nước và thanh toán trực tuyến qua mã QR."
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/40">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Không thể tải danh sách hóa đơn</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Thử lại
          </Button>
        </Card>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center border-slate-200/80 dark:border-slate-800">
          <EmptyState
            icon={Receipt}
            title="Căn hộ chưa có hóa đơn nào"
            description="Hiện tại chưa phát sinh hóa đơn phí dịch vụ cho kỳ này."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invoices.map((inv: any) => {
            const isPaid = inv.status === 'PAID';
            return (
              <Card
                key={inv.id}
                className="overflow-hidden border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded">
                        {inv.code}
                      </span>
                      <StatusBadge type="invoice" status={inv.status} />
                      <span className="text-xs text-slate-400">
                        Kỳ tháng {inv.billingMonth}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        (Hạn nộp: {formatDate(inv.dueDate)})
                      </span>
                    </div>

                    {inv.items && inv.items.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {inv.items.map((item: any) => (
                          <span
                            key={item.id}
                            title={item.note || undefined}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700"
                          >
                            {item.quantity > 1 ? (
                              <span className="font-bold text-blue-600 dark:text-blue-400">{item.quantity} ×</span>
                            ) : null}
                            <span>{item.title}:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.amount)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(inv)}
                      className="text-xs font-semibold gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Biên lai PDF
                    </Button>

                    {!isPaid ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPay(inv)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 gap-1.5"
                      >
                        <QrCode className="h-3.5 w-3.5" /> Thanh toán QR
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                        <CheckCircle2 className="h-4 w-4" /> Đã hoàn tất
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Modal with Sandbox QR Code */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogHeader>
          <DialogTitle>Thanh toán Hóa đơn qua Mã QR</DialogTitle>
          <DialogDescription>
            Quét mã để thanh toán tức thời phí dịch vụ căn hộ {selectedInvoice?.apartment?.code}
          </DialogDescription>
        </DialogHeader>

        {selectedInvoice && (
          <div className="space-y-4 py-2">
            {/* Amount Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-center space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Tổng số tiền cần thanh toán</span>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatCurrency(selectedInvoice.totalAmount)}
              </p>
              <p className="text-[11px] text-slate-400">Nội dung: {selectedInvoice.code}</p>
            </div>

            {/* Method switch */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('VNPAY')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'VNPAY'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                VietQR / VNPay
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('MOMO')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'MOMO'
                    ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <QrCode className="h-4 w-4" />
                Ví MoMo
              </button>
            </div>

            {/* QR Simulation Box */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 mb-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `SMART_APT_PAY_${selectedInvoice.code}_${selectedInvoice.totalAmount}`
                  )}`}
                  alt="QR Code Payment"
                  className="w-36 h-36 mx-auto"
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Mã thanh toán Sandbox tự động khớp lệnh
              </span>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPayModalOpen(false)}
                disabled={payMutation.isPending}
              >
                Đóng lại
              </Button>
              <Button
                onClick={handleSimulatePayment}
                isLoading={payMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Xác nhận đã quét mã
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
