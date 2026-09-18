'use client';

import React, { useState } from 'react';
import { 
  Megaphone, 
  AlertTriangle, 
  Calendar, 
  Wrench, 
  CreditCard, 
  Sparkles, 
  Layers, 
  Building,
  Vote
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/ErrorState';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';

export default function ResidentAnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: response, isLoading, isError, error, refetch } = useNotifications({
    category: selectedCategory !== 'ALL' ? (selectedCategory as any) : undefined,
  });

  const announcements = (response as any)?.data || [];

  const categories = [
    { id: 'ALL', label: 'Tất cả thông báo' },
    { id: 'EMERGENCY', label: 'Khẩn cấp' },
    { id: 'MAINTENANCE', label: 'Bảo trì hệ thống' },
    { id: 'EVENT', label: 'Sự kiện cộng đồng' },
    { id: 'BILLING', label: 'Hóa đơn & Thu phí' },
    { id: 'GENERAL', label: 'Thông báo chung' },
  ];

  const getCategoryIcon = (category: string, priority: string) => {
    if (priority === 'EMERGENCY' || category === 'EMERGENCY') {
      return <AlertTriangle className="h-5 w-5 text-rose-500" />;
    }
    switch (category) {
      case 'MAINTENANCE':
        return <Wrench className="h-5 w-5 text-orange-500" />;
      case 'BILLING':
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'EVENT':
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case 'POLL':
        return <Vote className="h-5 w-5 text-emerald-500" />;
      default:
        return <Megaphone className="h-5 w-5 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white animate-pulse">Khẩn cấp</Badge>;
      case 'URGENT':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Gấp</Badge>;
      default:
        return null;
    }
  };

  const getScopeBadge = (scope: string, id?: string) => {
    switch (scope) {
      case 'FLOOR':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Layers className="h-3.5 w-3.5" /> Dành riêng Tầng {id}
          </span>
        );
      case 'APARTMENT':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Building className="h-3.5 w-3.5" /> Dành riêng Căn hộ {id}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Building className="h-3.5 w-3.5" /> Toàn thể cư dân
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bản tin Tòa nhà"
        description="Theo dõi các thông báo chính thức, kế hoạch bảo trì và tin tức quan trọng từ Ban Quản Lý"
      />

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#0F6B4F] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState message={(error as any)?.message || 'Không thể tải bản tin tòa nhà'} onRetry={refetch} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Chưa có bản tin nào"
          description="Hiện tại chưa có thông báo nào trong danh mục bạn đã chọn."
        />
      ) : (
        <div className="grid gap-4">
          {announcements.map((item: any) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
                item.priority === 'EMERGENCY'
                  ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                  : ''
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                      item.priority === 'EMERGENCY'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {getCategoryIcon(item.category, item.priority)}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h3>
                      {getPriorityBadge(item.priority)}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(item.createdAt)}
                      </span>
                      <span>•</span>
                      {getScopeBadge(item.targetScope, item.targetId)}
                      <span>•</span>
                      <span>Ban Quản Lý Tòa Nhà</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
