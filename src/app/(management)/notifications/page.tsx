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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Megaphone, 
  Calendar, 
  Eye, 
  AlertTriangle, 
  Clock, 
  Building, 
  Layers, 
  Home, 
  Users 
} from 'lucide-react';
import { useNotifications, useCreateNotification, useDeleteNotification } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsManagementPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    targetScope: 'ALL',
    targetId: '',
  });

  const { data: response, isLoading, isError, error, refetch } = useNotifications({
    category: categoryFilter !== 'ALL' ? (categoryFilter as any) : undefined,
    priority: priorityFilter !== 'ALL' ? (priorityFilter as any) : undefined,
    search: search || undefined,
  });

  const notifications = (response as any)?.data || [];
  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        title: formData.title,
        content: formData.content,
        category: formData.category as any,
        priority: formData.priority as any,
        targetScope: formData.targetScope as any,
        targetValue: formData.targetId ? formData.targetId.trim() : undefined,
      },
      {
        onSuccess: () => {
          setIsFormOpen(false);
          setFormData({
            title: '',
            content: '',
            category: 'GENERAL',
            priority: 'NORMAL',
            targetScope: 'ALL',
            targetId: '',
          });
          toast.success('Đã gửi phát thông báo thành công');
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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'EMERGENCY':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Khẩn cấp</Badge>;
      case 'URGENT':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1"><Clock className="h-3 w-3" />Gấp</Badge>;
      default:
        return <Badge variant="secondary">Bình thường</Badge>;
    }
  };

  const getCategoryBadge = (c: string) => {
    switch (c) {
      case 'EMERGENCY':
        return <Badge variant="destructive">Khẩn cấp</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">Bảo trì</Badge>;
      case 'BILLING':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">Hóa đơn</Badge>;
      case 'EVENT':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">Sự kiện</Badge>;
      case 'POLL':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Biểu quyết</Badge>;
      default:
        return <Badge variant="outline">Thông báo chung</Badge>;
    }
  };

  const getTargetBadge = (scope: string, id?: string) => {
    switch (scope) {
      case 'ALL':
        return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Building className="h-3.5 w-3.5" /> Toàn tòa nhà</span>;
      case 'FLOOR':
        return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Layers className="h-3.5 w-3.5" /> Tầng {id || 'chỉ định'}</span>;
      case 'APARTMENT':
        return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Home className="h-3.5 w-3.5" /> Căn hộ {id || 'chỉ định'}</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Users className="h-3.5 w-3.5" /> {scope}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Thông báo & Bản tin"
        description="Đăng phát thông báo định kỳ, lịch bảo trì hệ thống, kiểm tra PCCC hoặc tin tức quan trọng tới cư dân."
      >
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#0F6B4F] hover:bg-[#0c5942] text-white font-semibold shadow-md shadow-[#0F6B4F]/20"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Đăng Thông báo mới
        </Button>
      </PageHeader>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Tìm kiếm thông báo..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Lọc theo danh mục thông báo"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F6B4F]"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="GENERAL">Thông báo chung</option>
            <option value="EMERGENCY">Khẩn cấp</option>
            <option value="MAINTENANCE">Bảo trì</option>
            <option value="BILLING">Hóa đơn</option>
            <option value="EVENT">Sự kiện</option>
            <option value="POLL">Biểu quyết</option>
          </select>

          <select
            aria-label="Lọc theo mức độ ưu tiên thông báo"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F6B4F]"
          >
            <option value="ALL">Mọi mức ưu tiên</option>
            <option value="NORMAL">Bình thường</option>
            <option value="URGENT">Gấp</option>
            <option value="EMERGENCY">Khẩn cấp</option>
          </select>
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
      ) : notifications.length === 0 ? (
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
          {notifications.map((item: any) => {
            const readsCount = item.reads?.length || item._count?.reads || 0;
            return (
              <Card
                key={item.id}
                className="overflow-hidden border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      item.priority === 'EMERGENCY'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    }`}>
                      {item.priority === 'EMERGENCY' ? <AlertTriangle className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        {getPriorityBadge(item.priority)}
                        {getCategoryBadge(item.category)}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span>•</span>
                        {getTargetBadge(item.targetScope, item.targetId || item.targetValue)}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {readsCount} lượt đọc
                        </span>
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
              placeholder="VD: Thông báo lịch bảo trì hệ thống PCCC"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Danh mục
              </label>
              <select
                aria-label="Chọn danh mục thông báo trong modal"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GENERAL">Thông báo chung</option>
                <option value="EMERGENCY">Khẩn cấp</option>
                <option value="MAINTENANCE">Bảo trì</option>
                <option value="BILLING">Hóa đơn</option>
                <option value="EVENT">Sự kiện</option>
                <option value="POLL">Biểu quyết</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                aria-label="Chọn mức độ ưu tiên trong modal"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NORMAL">Bình thường</option>
                <option value="URGENT">Gấp</option>
                <option value="EMERGENCY">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phạm vi gửi
              </label>
              <select
                aria-label="Chọn phạm vi gửi thông báo trong modal"
                value={formData.targetScope}
                onChange={(e) => setFormData({ ...formData, targetScope: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0F6B4F]"
              >
                <option value="ALL">Toàn bộ tòa nhà</option>
                <option value="FLOOR">Theo số tầng</option>
                <option value="APARTMENT">Căn hộ cụ thể</option>
              </select>
            </div>

            {formData.targetScope !== 'ALL' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {formData.targetScope === 'FLOOR' ? 'Số tầng' : 'Mã căn hộ'} <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.targetId}
                  onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                  placeholder={formData.targetScope === 'FLOOR' ? 'VD: 12' : 'VD: A-1204'}
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nội dung chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F6B4F]/20 focus:border-[#0F6B4F] leading-relaxed"
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
