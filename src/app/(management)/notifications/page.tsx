'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Bell, Plus, Trash2, Megaphone, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNotifications, useCreateNotification, useDeleteNotification } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';

export default function NotificationsManagementPage() {
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
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Thông báo"
        description="Đăng thông báo chung về bảo trì, họp cư dân, thu phí hoặc lịch cắt điện nước tới toàn thể cư dân."
      >
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Đăng Thông báo mới
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="font-semibold text-slate-800">Không thể tải danh sách thông báo</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {(error as any)?.message || 'Đã có lỗi xảy ra khi kết nối tới máy chủ.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4 gap-1.5 text-xs text-slate-700 hover:bg-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </Button>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Chưa có thông báo nào được đăng</p>
          <p className="text-xs text-slate-400 mt-1">Bấm "Đăng Thông báo mới" để gửi tin nhắn đến cư dân.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((item: any) => (
            <Card key={item.id} className="border-slate-200 hover:shadow-xs transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-base">{item.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingId(item.id)}
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Người đăng: {item.sender?.fullName || 'Ban Quản Lý'}</span>
                  <span>•</span>
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogHeader>
          <DialogTitle>Đăng Thông báo mới</DialogTitle>
          <DialogDescription>
            Thông báo này sẽ hiển thị trên trang chủ của toàn bộ cư dân trong hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Tiêu đề thông báo <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="VD: Thông báo bảo trì thang máy Tòa A ngày 25/08..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Nội dung chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-blue-600 outline-none"
              rows={5}
              placeholder="Nhập chi tiết lịch bảo trì, hướng dẫn cho cư dân..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              {createMutation.isPending ? 'Đang đăng...' : 'Đăng Thông báo'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xác nhận xóa thông báo?"
        description="Thông báo này sẽ bị gỡ bỏ khỏi bảng tin của toàn bộ cư dân. Thao tác không thể hoàn tác."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
