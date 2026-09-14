'use client';

import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';
import { Cpu, Zap, Activity, ShieldCheck, Wifi, Radio } from 'lucide-react';

export default function SmartOperationsPage() {
    return (
        <SmartModulePlaceholder
            title="Vận hành thông minh"
            description="Trung tâm giám sát IoT, BMS tòa nhà: điều khiển tự động chiếu sáng, nhiệt độ hành lang, bơm nước, báo cháy và trạm sạc xe điện."
            category="Hạ tầng thông minh & IoT"
            badgeText="IoT & BMS Center"
            stats={[
                { label: 'Cảm biến IoT đang kết nối', value: '412 / 415', change: '99.3% Online', icon: Wifi, color: 'text-emerald-500' },
                { label: 'Tiêu thụ năng lượng hôm nay', value: '1,420 kWh', change: '-4.8% nhờ tự động hóa', icon: Zap, color: 'text-blue-500' },
                { label: 'Trạng thái mạng lưới BMS', value: 'Bình thường', change: 'Áp lực nước ổn định 3.2 bar', icon: Activity, color: 'text-amber-500' },
                { label: 'Kịch bản tự động kích hoạt', value: '18 kịch bản', change: 'Chiếu sáng hoàng hôn, sảnh', icon: Cpu, color: 'text-purple-500' },
            ]}
            tableTitle="Danh sách trạm giám sát cảm biến & bộ điều khiển thông minh"
            tableHeaders={['Tên thiết bị / Bộ điều khiển', 'Vị trí lắp đặt', 'Thông số realtime', 'Cập nhật lần cuối', 'Trạng thái', 'Hành động']}
            sampleRows={[
                ['Controller Chiếu Sáng Hành Lang Tháp A', 'Tầng kỹ thuật A.25', 'Tự động 40% công suất', '2 phút trước', 'Hoạt động bình thường', 'Điều khiển'],
                ['Cảm biến áp lực nước sinh hoạt Tầng hầm', 'Trạm bơm P2', 'Áp lực 3.2 bar (Chuẩn)', '1 phút trước', 'Hoạt động bình thường', 'Điều khiển'],
                ['Hệ thống thông gió tầng hầm B1/B2', 'Hầm B1 khu để xe', 'Nồng độ 320 ppm (An toàn)', '5 phút trước', 'Chế độ Eco', 'Điều khiển'],
                ['Trạm sạc xe điện thông minh SmartEV-01', 'Hầm B2 khu A', 'Đang sạc 4/6 trụ (48kW)', 'Realtime', 'Hoạt động bình thường', 'Chi tiết'],
            ]}
            actionButtonText="Thêm thiết bị IoT mới"
        />
    );
}
