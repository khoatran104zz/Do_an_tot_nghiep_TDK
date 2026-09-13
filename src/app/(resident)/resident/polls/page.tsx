'use client';

import React, { useState } from 'react';
import { Vote, CheckSquare, Clock, Users, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ResidentPollsPage() {
    const [polls, setPolls] = useState([
        {
            id: '1',
            title: 'Lấy ý kiến nâng cấp hệ thống kiểm soát xe thông minh AI tại Tầng hầm',
            desc: 'Đề xuất lắp đặt camera AI nhận diện biển số tự động tốc độ cao và mở barie không cần dừng xe, giảm thiểu ùn tắc giờ cao điểm.',
            deadline: '20/09/2026 (Còn 7 ngày)',
            voted: false,
            options: [
                { id: 'opt1', text: 'Đồng ý phương án nâng cấp', votes: '320 phiếu (83.3%)' },
                { id: 'opt2', text: 'Giữ nguyên hệ thống quẹt thẻ hiện tại', votes: '64 phiếu (16.7%)' },
            ],
        },
        {
            id: '2',
            title: 'Khảo sát chất lượng dịch vụ vệ sinh và cảnh quan Quý 3/2026',
            desc: 'Đánh giá mức độ hài lòng của cư dân về tần suất lau dọn hành lang, thang máy và chăm sóc cây xanh công viên nội khu.',
            deadline: '25/09/2026',
            voted: true,
            selectedOption: 'Rất hài lòng',
            options: [
                { id: 'r1', text: 'Rất hài lòng', votes: '180 phiếu' },
                { id: 'r2', text: 'Hài lòng', votes: '110 phiếu' },
                { id: 'r3', text: 'Chưa hài lòng', votes: '20 phiếu' },
            ],
        },
    ]);

    const handleVote = (pollId: string, optText: string) => {
        setPolls((prev) =>
            prev.map((p) => (p.id === pollId ? { ...p, voted: true, selectedOption: optText } : p))
        );
        toast.success(`Đã ghi nhận biểu quyết: "${optText}"`);
    };

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Khảo sát & Biểu quyết (Polls & Voting)"
                description="Tham gia đóng góp ý kiến xây dựng không gian sống và biểu quyết các quyết định quan trọng của tòa nhà."
            />

            <div className="space-y-6">
                {polls.map((poll) => (
                    <Card key={poll.id} className="border-border/80">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <Badge variant={poll.voted ? 'secondary' : 'default'} className="text-xs">
                                    {poll.voted ? 'Đã biểu quyết' : 'Đang mở biểu quyết'}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Hạn chót: {poll.deadline}
                                </span>
                            </div>
                            <CardTitle className="text-base font-bold mt-2">{poll.title}</CardTitle>
                            <CardDescription className="text-sm">{poll.desc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                {poll.options.map((opt) => {
                                    const isSelected = poll.selectedOption === opt.text;
                                    return (
                                        <button
                                            key={opt.id}
                                            disabled={poll.voted}
                                            onClick={() => handleVote(poll.id, opt.text)}
                                            className={`w-full p-3.5 rounded-xl border text-left text-sm flex items-center justify-between transition-all ${isSelected
                                                ? 'border-primary bg-primary/10 font-semibold text-primary'
                                                : poll.voted
                                                    ? 'border-border/60 bg-muted/20 opacity-80 cursor-default'
                                                    : 'border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50'}`}>
                                                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                                </div>
                                                <span>{opt.text}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{opt.votes}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
