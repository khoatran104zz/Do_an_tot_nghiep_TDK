'use client';

import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';
import { Wrench, CheckCircle2, Clock, AlertCircle, Camera, MessageSquare } from 'lucide-react';

export default function TechnicianTasksPage() {
    return (
        <SmartModulePlaceholder
            title="Nhiệm vụ của tôi"
            description="Danh sách sự vụ kỹ thuật, sửa chữa và bảo dưỡng được giao riêng cho kỹ thuật viên. Hỗ trợ cập nhật tiến độ, ảnh Before/After và phản hồi."
            category="Nhiệm vụ kỹ thuật viên"
            badgeText="Technician Assignments"
            stats={[
                { label: 'Nhiệm vụ đang xử lý', value: '3', change: '2 sự vụ ưu tiên cao', icon: Clock, color: 'text-amber-500' },
                { label: 'Đã hoàn thành hôm nay', value: '4', change: 'Được đánh giá 5 sao', icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Cần cập nhật ảnh nghiệm thu', value: '1', change: 'Chưa có ảnh After', icon: Camera, color: 'text-blue-500' },
                { label: 'Sắp chạm hạn SLA (còn 20p)', value: '1', change: 'Căn A.1204 vòi rỉ nước', icon: AlertCircle, color: 'text-rose-500' },
            ]}
            tableTitle="Nhiệm vụ sửa chữa & bảo dưỡng được giao"
            tableHeaders={['Mã task / Tên sự vụ', 'Căn hộ / Vị trí', 'Thời gian hẹn', 'Mức độ ưu tiên', 'Trạng thái', 'Hành động']}
            sampleRows={[
                ['TASK-4019: Vòi nước bồn rửa rỉ nước', 'Căn hộ A.1204 (Tháp A)', 'Hôm nay - 15:30 (Đang làm)', 'Ưu tiên cao', 'Đang xử lý', 'Cập nhật ảnh & Hoàn thành'],
                ['TASK-4015: Đèn chiếu sáng ban công chớp tắt', 'Căn hộ B.0802 (Tháp B)', 'Hôm nay - 16:30', 'Trung bình', 'Chờ xử lý', 'Bắt đầu xử lý'],
                ['TASK-4008: Kiểm tra áp lực nước tầng 15', 'Trục kỹ thuật tầng 15A', 'Hôm nay - 14:00', 'Bình thường', 'Đã xong (Đạt 3.2 bar)', 'Xem ảnh nghiệm thu'],
                ['TASK-3990: Thay công tắc aptomat điều hòa', 'Căn hộ A.0305 (Tháp A)', 'Hôm qua - 16:00', 'Ưu tiên cao', 'Đã hoàn thành', 'Xem đánh giá cư dân'],
            ]}
            actionButtonText="Báo cáo hoàn thành sự vụ"
        />
    );
}
