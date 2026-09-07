'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { FormDialog } from '@/components/shared/FormDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Plus, Trash2, Megaphone, Calendar, Users, Eye } from 'lucide-react';
import { useNotifications, useCreateNotification, useDeleteNotification } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsManagementPage() {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  const { data: response, isLoading, isError, error, refetch } = useNotifications();
  const notifications = response?.data || [];

  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();

  const filteredNotifications = notifications.filter((n: any) =>
    search
      ? n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        title: formData.title,
        content: formData.content,
        senderId: '',
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setFormData({ title: '', content: '' });
          toast.success('Đã đăng phát thông báo tới toàn thể cư dân');
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeletingId(null);
          toast.success('Đã gỡ thông báo thành công');
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Thông báo Tòa nhà"
        description="Đăng phát các thông báo định kỳ, lịch bảo trì hệ thống, kiểm tra PCCC hoặc tin tức quan trọng tới cư dân."
      >
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Đăng Thông báo mới
        </Button>
      </PageHeader>

      {/* Search toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Tìm kiếm thông báo..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {filteredNotifications.length} thông báo
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-2">
              <Skeleton className="h-5 w-60" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Không thể tải danh sách thông báo"
          message={(error as any)?.message}
          onRetry={() => refetch()}
        />
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-8 text-center border-slate-200/80 dark:border-slate-800">
          <EmptyState
            icon={Bell}
            title={search ? 'Không tìm thấy thông báo phù hợp' : 'Chưa có thông báo nào'}
            description="Tạo thông báo mới để gửi tin nhắn đến các cư dân trong tòa nhà."
            actionLabel={search ? 'Xóa bộ lọc' : 'Tạo thông báo ngay'}
            onAction={search ? () => setSearch('') : () => setIsFormOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredNotifications.map((item: any) => {
            const readsCount = item.reads?.length || 0;
            return (
              <Card
                key={item.id}
                className="overflow-hidden border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <Badge variant="secondary" size="sm">
                          Toàn tòa nhà
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {readsCount} lượt đọc
                        </span>
                        {item.sender?.fullName && (
                          <span>Người gửi: {item.sender.fullName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeletingId(item.id)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg"
                      title="Gỡ bỏ thông báo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Announcement Form Dialog */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title="Đăng Thông báo mới tới cư dân"
        description="Thông báo sẽ được gửi tức thì đến trang chủ và hòm thư thông báo của cư dân."
        icon={Megaphone}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitText="Phát thông báo"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tiêu đề thông báo <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="VD: Thông báo lịch bảo trì hệ thống PCCC tầng 1-15"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nội dung chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 leading-relaxed"
              placeholder="Nhập nội dung thông báo, thời gian diễn ra và các lưu ý cho cư dân..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận gỡ bỏ thông báo?"
        description="Thông báo này sẽ không còn hiển thị trên bảng tin của cư dân."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
