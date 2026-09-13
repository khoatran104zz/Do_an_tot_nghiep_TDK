'use client';

import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';
import { Settings, ShieldAlert, BellRing, Database, Sliders, KeyRound } from 'lucide-react';

export default function SettingsPage() {
    return (
        <SmartModulePlaceholder
            title="Cài đặt hệ thống tòa nhà (Building Settings)"
            description="Cấu hình thông số tòa nhà, định mức bảng giá điện nước dịch vụ, hạn ngạch SLA kỹ thuật, cổng thanh toán và tích hợp bên thứ ba."
            category="Hệ thống & Cấu hình"
            badgeText="System Configuration"
            stats={[
                { label: 'Phiên bản hệ thống', value: 'v2.4.0', change: 'Build 2026-09-13', icon: Settings, color: 'text-blue-500' },
                { label: 'Cổng thanh toán kết nối', value: 'VNPay, MoMo, QR Pay', change: 'Hoạt động ổn định', icon: KeyRound, color: 'text-emerald-500' },
                { label: 'Kênh cảnh báo cư dân', value: 'SMS, Email, App Push', change: 'Đang bật tự động', icon: BellRing, color: 'text-amber-500' },
                { label: 'Bản sao lưu dữ liệu tự động', value: 'Hàng ngày 02:00', change: 'Bảo mật AES-256', icon: Database, color: 'text-purple-500' },
            ]}
            tableTitle="Các phân hệ cấu hình chính"
            tableHeaders={['Phân hệ cấu hình', 'Mô tả', 'Người chỉnh sửa gần nhất', 'Thời gian thay đổi', 'Trạng thái', 'Hành động']}
            sampleRows={[
                ['Bảng giá dịch vụ & Định mức phí 2026', 'Phí quản lý, tiền xe máy, ô tô, phí dọn rác', 'Ban Quản Trị (ADMIN)', '01/08/2026', 'Đang áp dụng', 'Cấu hình'],
                ['Quy tắc xử lý SLA & Cảnh báo phản ánh', 'Thời gian phản hồi tiêu chuẩn cho từng loại sự cố', 'Quản lý vận hành (MANAGER)', '15/08/2026', 'Đang áp dụng', 'Cấu hình'],
                ['Kết nối Cổng thanh toán & Ngân hàng đối tác', 'VietQR, MoMo sandbox, VNPay API', 'Ban Quản Trị (ADMIN)', '20/07/2026', 'Đang kết nối', 'Cấu hình'],
                ['Tài khoản & Phân quyền Role-based Access Control', 'Phân quyền Kỹ thuật, Bảo vệ, Lễ tân', 'Ban Quản Trị (ADMIN)', '13/09/2026', 'Đang áp dụng', 'Cấu hình'],
            ]}
            actionButtonText="Lưu cấu hình hệ thống"
        />
    );
}
