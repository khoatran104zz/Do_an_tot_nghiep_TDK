'use client';

import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';
import { Package, CheckCircle2, Clock, Bell, AlertTriangle } from 'lucide-react';

export default function ParcelsPage() {
    return (
        <SmartModulePlaceholder
            title="Quản lý bưu kiện & bưu phẩm (Parcels)"
            description="Tiếp nhận, thông báo tự động cho cư dân và xác nhận bàn giao bưu kiện tại sảnh tiếp tân lễ tân."
            category="Dịch vụ lễ tân & sảnh"
            badgeText="Front Desk & Logistics"
            stats={[
                { label: 'Bưu kiện chờ cư dân nhận', value: '42', change: '15 kiện mới nhận hôm nay', icon: Clock, color: 'text-amber-500' },
                { label: 'Đã bàn giao hôm nay', value: '68', change: '+22 so với hôm qua', icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Tồn đọng trên 3 ngày', value: '4', change: 'Đã gửi nhắc nhở push', icon: AlertTriangle, color: 'text-rose-500' },
                { label: 'Tổng số nhận trong tháng', value: '1,540', change: 'Trung bình 51 kiện/ngày', icon: Package, color: 'text-blue-500' },
            ]}
            tableTitle="Danh sách bưu kiện đang lưu tại sảnh lễ tân"
            tableHeaders={['Mã vận đơn / Kiện', 'Căn hộ / Cư dân', 'Đơn vị giao hàng', 'Ngày nhận tại sảnh', 'Vị trí lưu kho', 'Trạng thái', 'Hành động']}
            sampleRows={[
                ['SPX-VN-8839219', 'A.1402 - Trần Thuỳ Dương', 'Shopee Express', '13/09/2026 14:15', 'Kệ A - Ô 14', 'Chờ nhận (Đã SMS)', 'Bàn giao cho cư dân'],
                ['VTP-HN-0091823', 'B.0906 - Nguyễn Hoàng Minh', 'Viettel Post', '13/09/2026 11:30', 'Kệ B - Ô 09', 'Chờ nhận (Đã SMS)', 'Bàn giao cho cư dân'],
                ['JNT-881290334', 'A.2105 - Phạm Quốc Hưng', 'J&T Express', '12/09/2026 16:00', 'Kệ A - Ô 21', 'Chờ nhận (Nhắc lần 2)', 'Bàn giao cho cư dân'],
                ['GHN-998822019', 'B.0302 - Lê Quỳnh Nga', 'Giao Hàng Nhanh', '10/09/2026 09:10', 'Kệ Lớn - Ô 03', 'Tồn kho (>3 ngày)', 'Gọi cư dân'],
            ]}
            actionButtonText="Tiếp nhận bưu kiện mới"
        />
    );
}
