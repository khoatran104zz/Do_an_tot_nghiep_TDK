'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Receipt, CreditCard, Download, CheckCircle2, QrCode, ArrowRight } from 'lucide-react';
import { useInvoices, useProcessPayment } from '@/hooks/use-invoices';
import { formatCurrency, formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function ResidentInvoicesPage() {
  const { data: response, isLoading } = useInvoices();
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
      doc.text(`Can ho: ${inv.apartment?.code}`, 20, 45);
      doc.text(`Ky thanh toan: ${inv.billingMonth}`, 20, 55);
      doc.text(`Tong tien: ${formatCurrency(inv.totalAmount)}`, 20, 65);
      doc.text(`Trang thai: ${inv.status === 'PAID' ? 'DA THANH TOAN' : 'CHUA THANH TOAN'}`, 20, 75);

      doc.text('----------------------------------------------------', 20, 85);
      let y = 95;
      inv.items?.forEach((item: any) => {
        doc.text(`${item.title}: ${item.quantity} x ${item.unitPrice} = ${item.amount} VNĐ`, 20, y);
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
        title="Hóa đơn & Thanh toán"
        description="Tra cứu các hóa đơn dịch vụ hàng tháng và thanh toán trực tuyến qua cổng VNPay/MoMo."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Chưa có hóa đơn nào</p>
          <p className="text-xs text-slate-400 mt-1">Căn hộ của bạn hiện chưa phát sinh hóa đơn mới.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invoices.map((inv: any) => (
            <Card
              key={inv.id}
              className={`border transition-all hover:shadow-md ${
                inv.status === 'UNPAID' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    {inv.code}
                  </span>
                  {inv.status === 'PAID' ? (
                    <Badge variant="success">Đã thanh toán</Badge>
                  ) : (
                    <Badge variant="warning">Chưa thanh toán</Badge>
                  )}
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2">
                  Kỳ hóa đơn: Tháng {inv.billingMonth}
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Hạn thanh toán: <strong className="text-slate-700">{formatDate(inv.dueDate)}</strong>
                </p>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1.5 border border-slate-200">
                  {inv.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-slate-600">
                      <span>{item.title}</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-blue-900">
                    <span>TỔNG TIỀN:</span>
                    <span className="text-base text-blue-700">{formatCurrency(inv.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex gap-2">
                {inv.status === 'UNPAID' ? (
                  <Button
                    onClick={() => handleOpenPay(inv)}
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md"
                  >
                    <CreditCard className="mr-2 h-4 w-4" /> Thanh toán ngay
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleExportPDF(inv)}
                    className="w-full text-slate-700 border-slate-300"
                  >
                    <Download className="mr-2 h-4 w-4" /> Tải biên lai PDF
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Sandbox Gateway Modal */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        {selectedInvoice && (
          <div>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Cổng thanh toán Sandbox (Giả lập)
              </DialogTitle>
              <DialogDescription>
                Thanh toán hóa đơn <strong>{selectedInvoice.code}</strong> - Số tiền:{' '}
                <strong className="text-blue-700">{formatCurrency(selectedInvoice.totalAmount)}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('VNPAY')}
                  className={`p-3 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'VNPAY'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  VNPay Sandbox QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOMO')}
                  className={`p-3 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'MOMO'
                      ? 'border-pink-600 bg-pink-50 text-pink-700 ring-2 ring-pink-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  MoMo Wallet QR
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-xl bg-slate-50 text-center">
                <div className="h-40 w-40 bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center mb-3">
                  <QrCode className="h-32 w-32 text-slate-800" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Quét mã QR bằng ứng dụng {paymentMethod}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Hoặc bấm nút "Xác nhận giả lập" để hoàn tất nhanh</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSimulatePayment}
                disabled={payMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {payMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Đã thanh toán (Giả lập)'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
