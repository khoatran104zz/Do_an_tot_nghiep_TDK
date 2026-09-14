'use client';

import React from 'react';
import { CreditCard, QrCode, Banknote } from 'lucide-react';
import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';

export default function PaymentsManagementPage() {
  return (
    <SmartModulePlaceholder
      title="Quản lý Giao dịch & Cổng Thanh toán"
      description="Giám sát đối soát thanh toán trực tuyến qua Napas 247 VietQR, VNPay và MoMo"
      categoryBadge="Financial Operations"
      icon={CreditCard}
      primaryActionLabel="Đối soát ngân hàng"
      primaryActionIcon={QrCode}
      stats={[
        { label: 'Tổng thu tháng này', value: '478.500.000 đ', subtext: '+12.4% so với tháng trước', trend: 'up' },
        { label: 'Giao dịch Napas 247', value: '312 giao dịch', subtext: '98.5% thành công', trend: 'up' },
        { label: 'Giao dịch MoMo / VNPay', value: '145 giao dịch', subtext: 'Tự động gạch nợ', trend: 'up' },
        { label: 'Thanh toán tiền mặt', value: '18 giao dịch', subtext: 'Tại quầy BQL', trend: 'neutral' },
      ]}
      tableTitle="Lịch sử Giao dịch Gạch nợ Thời gian thực"
      tableHeaders={['Mã giao dịch', 'Căn hộ', 'Phương thức', 'Số tiền (VNĐ)', 'Thời gian', 'Trạng thái']}
      mockData={[
        { id: 'TXN-202609-001', apt: 'Căn A-1001', method: 'VietQR Banking', amount: '1.250.000 đ', time: '10:45 Hôm nay', status: 'badge:ĐÃ GẠCH NỢ' },
        { id: 'TXN-202609-002', apt: 'Căn B-2001', method: 'Ví MoMo', amount: '890.000 đ', time: '09:15 Hôm nay', status: 'badge:ĐÃ GẠCH NỢ' },
        { id: 'TXN-202609-003', apt: 'Căn A-1201', method: 'VNPay QR', amount: '2.450.000 đ', time: 'Hôm qua', status: 'badge:ĐÃ GẠCH NỢ' },
        { id: 'TXN-202609-004', apt: 'Căn C-0501', method: 'Tiền mặt tại quầy', amount: '1.100.000 đ', time: 'Hôm qua', status: 'badge:ĐÃ GẠCH NỢ' },
      ]}
    />
  );
}
