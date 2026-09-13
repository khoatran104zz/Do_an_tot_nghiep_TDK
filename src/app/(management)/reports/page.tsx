'use client';

import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';
import { FileBarChart2, TrendingUp, DollarSign, Wrench, ShieldAlert, Download } from 'lucide-react';

export default function ReportsPage() {
    return (
        <SmartModulePlaceholder
            title="Báo cáo & Thống kê vận hành (Reports & Analytics)"
            description="Tổng hợp báo cáo tài chính, tỷ lệ thu phí, hiệu suất giải quyết sự vụ SLA, tiêu thụ năng lượng và độ thỏa dụng tiện ích toàn khu."
            category="Dữ liệu & Báo cáo BQL"
            badgeText="Executive Intelligence"
            stats={[
                { label: 'Doanh thu tháng 9/2026', value: '458.5 tr', change: '+8.4% so với cùng kỳ', icon: DollarSign, color: 'text-emerald-500' },
                { label: 'Tỷ lệ thu phí đúng hạn', value: '94.2%', change: '+3.1% sau thông báo QR', icon: TrendingUp, color: 'text-blue-500' },
                { label: 'Sự vụ bảo trì hoàn thành', value: '142', change: 'Đạt chuẩn SLA 97.8%', icon: Wrench, color: 'text-amber-500' },
                { label: 'Cảnh báo an ninh đã xử lý', value: '18', change: '100% thời gian phản hồi < 5p', icon: ShieldAlert, color: 'text-purple-500' },
            ]}
            tableTitle="Danh mục mẫu báo cáo định kỳ"
            tableHeaders={['Tên báo cáo', 'Kỳ báo cáo', 'Phạm vi dữ liệu', 'Người tạo gần nhất', 'Ngày cập nhật', 'Định dạng', 'Thao tác']}
            sampleRows={[
                ['Báo cáo Tài chính & Dòng tiền thu phí', 'Tháng 08/2026', 'Toàn bộ cư dân & hợp đồng thuê', 'Kế toán trưởng', '05/09/2026', 'PDF / Excel', 'Tải xuống'],
                ['Báo cáo Tuân thủ SLA Kỹ thuật & Bảo trì', 'Quý 2/2026', 'Hệ thống thang máy, bơm, điện áp', 'Trưởng ban vận hành', '01/07/2026', 'PDF', 'Tải xuống'],
                ['Báo cáo Tỷ lệ Lấp đầy Căn hộ & Biến động Dân cư', 'Tháng 08/2026', 'Tháp A & Tháp B (450 căn)', 'Bộ phận CSKH', '02/09/2026', 'Excel', 'Tải xuống'],
                ['Báo cáo Tiêu thụ Điện/Nước Khối tiện ích & Công cộng', 'Tháng 08/2026', 'Hồ bơi, sảnh, chiếu sáng hành lang', 'Kỹ thuật viên trưởng', '04/09/2026', 'PDF / Excel', 'Tải xuống'],
            ]}
            actionButtonText="Tạo báo cáo tùy chỉnh"
        />
    );
}
