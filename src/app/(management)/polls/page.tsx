'use client';

import { SmartModulePlaceholder } from '@/components/shared/SmartModulePlaceholder';
import { Vote, CheckSquare, Users, BarChart3, Clock } from 'lucide-react';

export default function PollsPage() {
    return (
        <SmartModulePlaceholder
            title="Khảo sát & Biểu quyết cư dân (Polls & Voting)"
            description="Tạo và quản lý các cuộc biểu quyết, lấy ý kiến hội nghị nhà chung cư, nâng cấp tiện ích và đánh giá chất lượng dịch vụ."
            category="Truyền thông & Cộng đồng"
            badgeText="Community Governance"
            stats={[
                { label: 'Khảo sát đang diễn ra', value: '2', change: 'Hạn cuối ngày 20/09', icon: Clock, color: 'text-amber-500' },
                { label: 'Tỷ lệ cư dân tham gia biểu quyết', value: '78.4%', change: '+6.2% so với quý trước', icon: Users, color: 'text-blue-500' },
                { label: 'Cuộc biểu quyết đã hoàn tất', value: '14', change: 'Lưu trữ biên bản đầy đủ', icon: CheckSquare, color: 'text-emerald-500' },
                { label: 'Ý kiến đóng góp đã tiếp nhận', value: '256', change: 'Tháng 9/2026', icon: Vote, color: 'text-purple-500' },
            ]}
            tableTitle="Danh sách khảo sát & biểu quyết cư dân"
            tableHeaders={['Chủ đề biểu quyết / khảo sát', 'Đối tượng', 'Thời gian mở', 'Hạn kết thúc', 'Tiến độ tham gia', 'Trạng thái', 'Hành động']}
            sampleRows={[
                ['Lấy ý kiến nâng cấp hệ thống kiểm soát xe thông minh AI', 'Toàn bộ chủ hộ Tòa A & B', '01/09/2026', '20/09/2026', '384 / 450 căn (85.3%)', 'Đang biểu quyết', 'Xem kết quả realtime'],
                ['Khảo sát chất lượng dịch vụ vệ sinh và cảnh quan Quý 3/2026', 'Toàn thể cư dân', '05/09/2026', '25/09/2026', '310 phiếu (68.8%)', 'Đang biểu quyết', 'Xem kết quả realtime'],
                ['Biểu quyết điều chỉnh phí vận hành hồ bơi 4 mùa 2026', 'Cư dân đăng ký thẻ tiện ích', '10/08/2026', '25/08/2026', '92% Tán thành (312/340)', 'Đã kết thúc', 'Xem biên bản'],
            ]}
            actionButtonText="Tạo cuộc biểu quyết mới"
        />
    );
}
