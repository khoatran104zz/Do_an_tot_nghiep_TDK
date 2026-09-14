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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Building, 
  Layers, 
  Home, 
  Clock 
} from 'lucide-react';
import { useNotifications, useCreateNotification, useDeleteNotification } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function ManagementAnnouncementsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [targetScope, setTargetScope] = useState('ALL');
  const [targetId, setTargetId] = useState('');

  const { data: response, isLoading, isError, error, refetch } = useNotifications({
    category: categoryFilter !== 'ALL' ? (categoryFilter as any) : undefined,
    priority: priorityFilter !== 'ALL' ? (priorityFilter as any) : undefined,
    search: search || undefined,
  });

  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();

  const notifications = (response as any)?.data || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title,
        content,
        category: category as any,
        priority: priority as any,
        targetScope: targetScope as any,
        targetValue: targetId ? targetId.trim() : undefined,
      });

      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setCategory('GENERAL');
      setPriority('NORMAL');
      setTargetScope('ALL');
      setTargetId('');
      toast.success('Phát hành bản tin thông báo thành công');
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo thông báo');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || 'Xóa thông báo thất bại');
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
        title="Bản tin & Thông báo Tòa nhà"
        description="Quản lý và phát hành bản tin thông báo đến toàn thể cư dân hoặc theo từng tầng, căn hộ"
      >
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Phát hành thông báo mới
        </Button>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Tìm theo tiêu đề, nội dung..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Lọc theo danh mục"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            aria-label="Lọc theo mức độ ưu tiên"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Mọi mức ưu tiên</option>
            <option value="NORMAL">Bình thường</option>
            <option value="URGENT">Gấp</option>
            <option value="EMERGENCY">Khẩn cấp</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState message={(error as any)?.message || 'Không thể tải danh sách thông báo'} onRetry={refetch} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Chưa có thông báo nào"
          description="Bạn chưa phát hành thông báo nào hoặc không tìm thấy kết quả phù hợp với bộ lọc."
        />
      ) : (
        <div className="grid gap-4">
          {notifications.map((item: any) => (
            <Card key={item.id} className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      item.priority === 'EMERGENCY'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    }`}>
                      {item.priority === 'EMERGENCY' ? <AlertTriangle className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        {getPriorityBadge(item.priority)}
                        {getCategoryBadge(item.category)}
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {item.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span>•</span>
                        {getTargetBadge(item.targetScope, item.targetId || item.targetValue)}
                        {item.creator && (
                          <>
                            <span>•</span>
                            <span>Đăng bởi: <strong className="text-slate-700 dark:text-slate-300">{item.creator.name}</strong></span>
                          </>
                        )}
                        {item._count?.reads !== undefined && (
                          <>
                            <span>•</span>
                            <span>Lượt xem: <strong>{item._count.reads}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(item.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Phát hành Thông báo */}
      <FormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Phát hành thông báo mới"
        description="Gửi thông báo đến cư dân toàn tòa nhà, từng tầng hoặc từng căn hộ cụ thể"
        onSubmit={handleCreate}
        submitText="Phát hành ngay"
        isLoading={createMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tiêu đề thông báo <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thông báo bảo trì thang máy tháp A"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Danh mục
              </label>
              <select
                aria-label="Chọn danh mục thông báo"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GENERAL">Thông báo chung</option>
                <option value="EMERGENCY">Khẩn cấp</option>
                <option value="MAINTENANCE">Bảo trì hệ thống</option>
                <option value="BILLING">Thu phí & Hóa đơn</option>
                <option value="EVENT">Sự kiện cộng đồng</option>
                <option value="POLL">Khảo sát & Biểu quyết</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                aria-label="Chọn mức độ ưu tiên"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NORMAL">Bình thường</option>
                <option value="URGENT">Gấp</option>
                <option value="EMERGENCY">Khẩn cấp (Còi báo động)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phạm vi gửi
              </label>
              <select
                aria-label="Chọn phạm vi gửi thông báo"
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value)}
                className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Toàn bộ tòa nhà</option>
                <option value="FLOOR">Theo số tầng</option>
                <option value="APARTMENT">Căn hộ cụ thể</option>
              </select>
            </div>

            {targetScope !== 'ALL' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {targetScope === 'FLOOR' ? 'Số tầng' : 'Mã căn hộ'} <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder={targetScope === 'FLOOR' ? 'VD: 12' : 'VD: A-1204'}
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nội dung chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo đầy đủ gửi tới cư dân..."
              rows={5}
              className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </FormDialog>

      {/* Modal Xác nhận xóa */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xác nhận xóa thông báo"
        description="Bạn có chắc chắn muốn xóa bản tin thông báo này? Cư dân sẽ không thể nhìn thấy thông báo này nữa."
        onConfirm={handleDelete}
      />
    </div>
  );
}
