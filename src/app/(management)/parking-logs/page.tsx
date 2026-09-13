'use client';

import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';
import { History, Car, ShieldCheck, AlertCircle, Scan, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function ParkingLogsPage() {
    return (
        <SmartModulePlaceholder
            title="Nhật ký quẹt thẻ & vào ra bãi xe (Parking Access Logs)"
            description="Giám sát luồng xe vào ra tự động qua đầu đọc thẻ RFID và camera nhận diện biển số (ANPR) tại các làn hầm B1, B2."
            category="An ninh & Bãi đỗ xe"
            badgeText="RFID & ANPR Gate Logs"
            stats={[
                { label: 'Lượt xe vào hôm nay', value: '412', change: '+35 trong giờ cao điểm', icon: ArrowDownRight, color: 'text-emerald-500' },
                { label: 'Lượt xe ra hôm nay', value: '389', change: 'Lưu lượng bình thường', icon: ArrowUpRight, color: 'text-blue-500' },
                { label: 'Cảnh báo biển số không khớp', value: '1', change: 'Đã xác minh bởi bảo vệ', icon: AlertCircle, color: 'text-amber-500' },
                { label: 'Độ chính xác nhận diện ANPR', value: '99.4%', change: 'Camera AI HD Gate A/B', icon: Scan, color: 'text-purple-500' },
            ]}
            tableTitle="Nhật ký lượt xe qua cổng kiểm soát gần nhất"
            tableHeaders={['Thời gian', 'Làn xe / Cổng', 'Mã thẻ RFID', 'Biển số nhận diện', 'Loại xe / Căn hộ', 'Kết quả kiểm soát', 'Hình ảnh']}
            sampleRows={[
                ['16:22:15', 'Làn VÀO 01 (Hầm B1)', 'RFID-AUTO-8812', '30F-998.88', 'Ô tô (Căn A.1204 - Trần T)', 'Hợp lệ - Mở barie tự động', 'Xem ảnh camera'],
                ['16:18:40', 'Làn RA 02 (Hầm B1)', 'RFID-MOTO-3104', '29B1-776.54', 'Xe máy (Căn B.0503 - Lê V)', 'Hợp lệ - Mở barie tự động', 'Xem ảnh camera'],
                ['16:05:12', 'Làn VÀO 02 (Hầm B2)', 'THẺ KHÁCH #14', '30G-445.19', 'Khách vãng lai (Ghé Căn B.1901)', 'Bảo vệ cấp thẻ tạm - Phí 10k', 'Xem ảnh camera'],
                ['15:48:00', 'Làn RA 01 (Hầm B1)', 'RFID-AUTO-5509', '30A-123.45', 'Ô tô (Căn A.0801)', 'Hợp lệ - Đã trừ tiền vé tháng', 'Xem ảnh camera'],
            ]}
            actionButtonText="Trích xuất nhật ký bãi xe"
        />
    );
}
