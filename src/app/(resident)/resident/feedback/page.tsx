'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormDialog } from '@/components/shared/FormDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareWarning, Plus, Star, Wrench, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useFeedbacks, useCreateFeedback, useRateFeedback } from '@/hooks/use-feedbacks';
import { TicketCategory, TicketPriority } from '@prisma/client';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

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

  const { data: response, isLoading, isError, error, refetch } = useFeedbacks();
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
        toast.success('Đã gửi phản ánh tới BQL tòa nhà!');
      },
    });
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingItem) return;
    rateMutation.mutate(
      { id: ratingItem.id, data: ratingForm },
      {
        onSuccess: () => {
          setRatingItem(null);
          toast.success('Cảm ơn bạn đã đánh giá chất lượng phục vụ!');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo Sự cố & Phản ánh"
        description="Gửi yêu cầu hỗ trợ sửa chữa điện, nước, thang máy hoặc đóng góp ý kiến tới Ban Quản Lý."
      >
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Báo sự cố mới
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Không thể tải danh sách phản ánh"
          message={(error as any)?.message}
          onRetry={() => refetch()}
        />
      ) : feedbacks.length === 0 ? (
        <Card className="p-8 text-center border-slate-200/80 dark:border-slate-800">
          <EmptyState
            icon={MessageSquareWarning}
            title="Chưa có phản ánh sự cố nào"
            description="Nếu gặp bất kỳ vấn đề nào về điện, nước, thiết bị hoặc an ninh, hãy gửi yêu cầu cho chúng tôi."
            actionLabel="Báo sự cố ngay"
            onAction={() => setIsFormOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {feedbacks.map((item: any) => {
            const isResolved = item.status === 'RESOLVED';
            const hasRated = Boolean(item.rating);
            return (
              <Card
                key={item.id}
                className="overflow-hidden border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                        {item.code}
                      </span>
                      <StatusBadge type="ticketCategory" status={item.category} />
                      <StatusBadge type="ticketPriority" status={item.priority} />
                      <StatusBadge type="ticketStatus" status={item.status} />
                    </div>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>

                  {/* BQL response if present */}
                  {item.responseContent && (
                    <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        Ban Quản Lý phản hồi:
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.responseContent}
                      </p>
                    </div>
                  )}

                  {/* Rating widget / Rating status */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      {isResolved && !hasRated ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Sự cố đã xử lý. Vui lòng đánh giá mức độ hài lòng!
                        </span>
                      ) : hasRated ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span>Bạn đã đánh giá {item.rating}/5 sao</span>
                        </div>
                      ) : (
                        <span>Tiến trình xử lý được cập nhật tự động</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/resident/feedback/${item.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                          Xem tiến trình & Trao đổi ➔
                        </Button>
                      </Link>
                      {isResolved && !hasRated && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRatingItem(item);
                            setRatingForm({ rating: 5, ratingComment: '' });
                          }}
                          className="text-xs font-semibold gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        >
                          <Star className="h-3.5 w-3.5" /> Đánh giá 1-5 sao
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Feedback Form Dialog */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title="Gửi Báo cáo Sự cố & Phản ánh"
        description="Điền thông tin mô tả chi tiết sự cố để đội ngũ kỹ thuật tiếp nhận và xử lý nhanh chóng."
        icon={MessageSquareWarning}
        onSubmit={handleSubmitCreate}
        isLoading={createMutation.isPending}
        submitText="Gửi báo cáo"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Danh mục sự cố <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
              >
                <option value="ELECTRIC">Điện sinh hoạt</option>
                <option value="WATER">Nước & Đường ống</option>
                <option value="ELEVATOR">Thang máy</option>
                <option value="SECURITY">An ninh trật tự</option>
                <option value="CLEANLINESS">Vệ sinh môi trường</option>
                <option value="OTHER">Vấn đề khác</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mức độ cấp thiết <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              >
                <option value="LOW">Thấp (Có thể xử lý trong 2-3 ngày)</option>
                <option value="MEDIUM">Trung bình (Trong 24h)</option>
                <option value="HIGH">Cao (Cần hỗ trợ sớm)</option>
                <option value="URGENT">Khẩn cấp (Cần xử lý ngay)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tiêu đề vắn tắt <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Rò rỉ van nước bồn rửa chén tại phòng bếp"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mô tả chi tiết sự cố <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              placeholder="Mô tả hiện trạng, thời điểm phát sinh hoặc vị trí sự cố..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* Rating Form Dialog */}
      <FormDialog
        open={Boolean(ratingItem)}
        onOpenChange={(open) => !open && setRatingItem(null)}
        title="Đánh giá Mức độ Hài lòng"
        description={`Đánh giá chất lượng xử lý của Ban Quản Lý cho sự cố ${ratingItem?.code}`}
        icon={Star}
        onSubmit={handleSubmitRating}
        isLoading={rateMutation.isPending}
        submitText="Gửi đánh giá"
      >
        <div className="space-y-4 text-center py-2">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                className="p-1 text-2xl cursor-pointer hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= ratingForm.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nhận xét thêm (tùy chọn)
            </label>
            <Input
              placeholder="Nhân viên kỹ thuật xử lý nhanh, nhiệt tình..."
              value={ratingForm.ratingComment}
              onChange={(e) => setRatingForm({ ...ratingForm, ratingComment: e.target.value })}
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
