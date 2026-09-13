'use client';

import React from 'react';
import { Bell, AlertTriangle, Info, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ResidentAnnouncementsPage() {
    const announcements = [
        {
            id: '1',
            type: 'EMERGENCY',
            title: 'Bảo trì hệ thống cấp nước sinh hoạt Tháp A',
            summary: 'Tạm ngưng cấp nước sinh hoạt từ 23:00 đêm nay (13/09) đến 04:00 sáng mai (14/09) để súc xả bể ngầm.',
            date: '13/09/2026 - 10:00',
            sender: 'Ban Quản Lý Tòa Nhà',
            badge: 'Khẩn cấp',
        },
        {
            id: '2',
            type: 'INFO',
            title: 'Kế hoạch phun thuốc diệt muỗi và khử khuẩn khu vực công cộng',
            summary: 'BQL sẽ tiến hành phun thuốc diệt côn trùng định kỳ tại hành lang các tầng, tầng hầm và khu vui chơi trẻ em vào chiều Thứ 7 tuần này.',
            date: '12/09/2026 - 15:30',
            sender: 'Bộ phận Vận hành Cảnh quan',
            badge: 'Thông báo',
        },
        {
            id: '3',
            type: 'COMMUNITY',
            title: 'Đăng ký tham gia giải chạy phong trào Cư dân SmartCity 2026',
            summary: 'Giải chạy mở rộng cự ly 3km và 5km dành cho toàn thể cư dân vào Chủ Nhật ngày 28/09. Nhiều giải thưởng hấp dẫn!',
            date: '10/09/2026 - 09:00',
            sender: 'Ban Quản Trị & Hội Cư Dân',
            badge: 'Sự kiện',
        },
    ];

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Bản tin & Thông báo tòa nhà (Announcements)"
                description="Cập nhật tin tức vận hành, lịch bảo trì kỹ thuật, quy định an ninh và các hoạt động cộng đồng cư dân."
            />

            <div className="space-y-4">
                {announcements.map((item) => (
                    <Card key={item.id} className={`border-border/80 relative overflow-hidden ${item.type === 'EMERGENCY' ? 'border-amber-500/50 bg-amber-500/[0.03]' : ''}`}>
                        <div className={`h-full w-1.5 absolute left-0 top-0 bottom-0 ${item.type === 'EMERGENCY' ? 'bg-amber-500' : 'bg-primary'}`} />
                        <CardHeader className="pl-6 pb-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={item.type === 'EMERGENCY' ? 'destructive' : 'secondary'} className="text-xs">
                                        {item.badge}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{item.sender}</span>
                                </div>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" /> {item.date}
                                </span>
                            </div>
                            <CardTitle className="text-base font-bold mt-2">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-6 text-sm text-muted-foreground">
                            <p>{item.summary}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
