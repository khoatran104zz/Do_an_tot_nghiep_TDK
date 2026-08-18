'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MessageSquareWarning, Plus, Star, Wrench } from 'lucide-react';
import { useFeedbacks, useCreateFeedback, useRateFeedback } from '@/hooks/use-feedbacks';
import { TicketCategory, TicketPriority } from '@prisma/client';
import { formatDateTime } from '@/lib/utils';

export default function ResidentFeedbackPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ratingItem, setRatingItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    category: 'ELECTRIC' as TicketCategory,
    title: '',
    content: '',
    priority: 'MEDIUM' as TicketPriority,
  });

  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    ratingComment: '',
  });

  const { data: response, isLoading } = useFeedbacks();
  const feedbacks = response?.data || [];

  const createMutation = useCreateFeedback();
  const rateMutation = useRateFeedback();

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsFormOpen(false);
        setFormData({
          category: 'ELECTRIC',
          title: '',
          content: '',
          priority: 'MEDIUM',
        });
      },
    });
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingItem) return;
    rateMutation.mutate(
      { id: ratingItem.id, data: ratingForm },
      {
        onSuccess: () => setRatingItem(null),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo Sự cố & Yêu cầu Hỗ trợ"
        description="Gửi phản ánh tới Ban Quản Lý tòa nhà về hỏng hóc điện, nước, thang máy hoặc vấn đề an ninh."
      >
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Gửi Phản ánh mới
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquareWarning className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Chưa có phản ánh nào</p>
          <p className="text-xs text-slate-400 mt-1">Bấm "Gửi Phản ánh mới" để gửi yêu cầu tới Ban Quản Lý.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((item: any) => (
            <Card key={item.id} className="border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  {item.status === 'NEW' && <Badge variant="destructive">Mới tiếp nhận</Badge>}
                  {item.status === 'PROCESSING' && <Badge variant="warning">Đang xử lý</Badge>}
                  {item.status === 'RESOLVED' && <Badge variant="success">Hoàn thành</Badge>}
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2">{item.title}</CardTitle>
                <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
              </CardHeader>

              <CardContent className="pb-3 text-xs text-slate-700 space-y-2">
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">{item.content}</p>

                {item.responseContent && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-blue-900">
                    <p className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-blue-700 mb-0.5">
                      <Wrench className="h-3.5 w-3.5" /> Phản hồi từ Ban Quản Lý:
                    </p>
                    <p>{item.responseContent}</p>
                  </div>
                )}
              </CardContent>

              {item.status === 'RESOLVED' && (
                <CardFooter className="pt-0 flex justify-between items-center border-t border-slate-100 pt-3">
                  {item.rating ? (
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <span className="font-semibold text-slate-600 mr-1">Đánh giá của bạn:</span>
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRatingItem(item);
                        setRatingForm({ rating: 5, ratingComment: '' });
                      }}
                      className="text-xs text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                    >
                      <Star className="mr-1 h-3.5 w-3.5 fill-amber-400" /> Đánh giá độ hài lòng
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogHeader>
          <DialogTitle>Gửi Phản ánh / Báo sự cố</DialogTitle>
          <DialogDescription>
            Gửi chi tiết sự cố hỏng hóc để kỹ thuật viên BQL kiểm tra và khắc phục.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Phân loại sự cố (*)</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
              >
                <option value="ELECTRIC">Điện sinh hoạt</option>
                <option value="WATER">Nước & Đường ống</option>
                <option value="ELEVATOR">Thang máy</option>
                <option value="SECURITY">An ninh / Tiếng ồn</option>
                <option value="CLEANLINESS">Vệ sinh rác thải</option>
                <option value="OTHER">Vấn đề khác</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Mức độ ưu tiên</label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Tiêu đề sự cố (*)</label>
            <Input
              placeholder="VD: Mất nước sinh hoạt tại phòng tắm..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Mô tả chi tiết (*)</label>
            <textarea
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-blue-600 outline-none"
              rows={4}
              placeholder="Vui lòng mô tả chi tiết vị trí hỏng hóc, biểu hiện..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {createMutation.isPending ? 'Đang gửi...' : 'Gửi Yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* 5-Star Rating Modal */}
      <Dialog open={!!ratingItem} onOpenChange={(open) => !open && setRatingItem(null)}>
        {ratingItem && (
          <div>
            <DialogHeader>
              <DialogTitle>Đánh giá Mức độ Hài lòng</DialogTitle>
              <DialogDescription>
                Bạn đánh giá thế nào về chất lượng hỗ trợ xử lý cho sự cố <strong>{ratingItem.code}</strong>?
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitRating} className="space-y-4 my-4">
              <div className="flex justify-center items-center gap-2 py-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                    className="p-1 cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= ratingForm.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Ý kiến đóng góp thêm (không bắt buộc)</label>
                <textarea
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs outline-none"
                  rows={2}
                  placeholder="Nhập cảm nhận của bạn về thái độ phục vụ và kết quả..."
                  value={ratingForm.ratingComment}
                  onChange={(e) => setRatingForm({ ...ratingForm, ratingComment: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setRatingItem(null)}>
                  Bỏ qua
                </Button>
                <Button type="submit" disabled={rateMutation.isPending} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  {rateMutation.isPending ? 'Đang gửi...' : 'Gửi Đánh giá'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </Dialog>
    </div>
  );
}
