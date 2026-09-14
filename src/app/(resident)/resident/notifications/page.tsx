'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Megaphone, 
  CheckCircle2, 
  Calendar, 
  Check, 
  AlertTriangle, 
  Package, 
  CreditCard, 
  Wrench, 
  Users, 
  Vote, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead 
} from '@/hooks/use-notifications';
import { formatDateTime, cn } from '@/lib/utils';

export default function ResidentNotificationsPage() {
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const { data: response, isLoading, isError, error, refetch } = useNotifications({
    category: activeTab !== 'ALL' && activeTab !== 'UNREAD' ? (activeTab as any) : undefined,
    unreadOnly: activeTab === 'UNREAD' ? true : undefined,
  });

  const markReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();

  const notifications = (response as any)?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.reads || n.reads.length === 0).length;

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'UNREAD', label: 'Chưa đọc' },
    { id: 'EMERGENCY', label: 'Khẩn cấp' },
    { id: 'PARCEL', label: 'Bưu kiện' },
    { id: 'BILLING', label: 'Hóa đơn' },
    { id: 'MAINTENANCE', label: 'Bảo trì' },
    { id: 'VISITOR', label: 'Khách thăm' },
    { id: 'POLL', label: 'Khảo sát' },
  ];

  const getCategoryIcon = (category?: string, priority?: string) => {
    if (priority === 'EMERGENCY' || category === 'EMERGENCY') {
      return <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
    }
    switch (category) {
      case 'PARCEL':
        return <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      case 'BILLING':
        return <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'MAINTENANCE':
        return <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      case 'VISITOR':
        return <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />;
      case 'POLL':
        return <Vote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getActionLink = (item: any) => {
    if (item.category === 'PARCEL' || item.relatedEntityType === 'PARCEL') {
      return { href: '/resident/parcels', label: 'Xem bưu kiện' };
    }
    if (item.category === 'POLL' || item.relatedEntityType === 'POLL') {
      return { href: '/resident/polls', label: 'Tham gia biểu quyết' };
    }
    if (item.category === 'MAINTENANCE' || item.relatedEntityType === 'TICKET') {
      return { href: '/resident/maintenance', label: 'Xem phiếu sửa chữa' };
    }
    if (item.category === 'VISITOR') {
      return { href: '/resident/visitors', label: 'Xem đăng ký khách' };
    }
    if (item.category === 'BILLING') {
      return { href: '/resident/invoices', label: 'Xem hóa đơn' };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Trung tâm Thông báo"
          description="Cập nhật toàn bộ các thông báo, bưu kiện đến, hóa đơn và nhắc nhở gửi riêng cho bạn"
        />

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || unreadCount === 0}
            className="self-start sm:self-auto cursor-pointer"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            {tab.label}
            {tab.id === 'UNREAD' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState message={(error as any)?.message || 'Không thể tải thông báo'} onRetry={refetch} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Không có thông báo nào"
          description={
            activeTab === 'UNREAD'
              ? 'Tuyệt vời! Bạn đã đọc toàn bộ các thông báo.'
              : 'Hiện chưa có thông báo nào trong mục này.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item: any) => {
            const isRead = item.reads && item.reads.length > 0;
            const actionLink = getActionLink(item);

            return (
              <Card
                key={item.id}
                className={cn(
                  'overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700',
                  !isRead && 'bg-blue-50/20 dark:bg-blue-950/15 border-blue-200/80 dark:border-blue-900/50'
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        'p-2.5 rounded-2xl shrink-0 mt-0.5',
                        item.priority === 'EMERGENCY'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : !isRead
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {getCategoryIcon(item.category, item.priority)}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3
                            className={cn(
                              'text-sm sm:text-base font-bold truncate',
                              !isRead
                                ? 'text-slate-900 dark:text-slate-50'
                                : 'text-slate-700 dark:text-slate-300'
                            )}
                          >
                            {item.title}
                          </h3>
                          {!isRead && (
                            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.priority === 'EMERGENCY' && (
                            <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[10px]">
                              Khẩn cấp
                            </Badge>
                          )}
                          {!isRead ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markReadMutation.mutate(item.id)}
                              disabled={markReadMutation.isPending}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-7 px-2"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Đánh dấu đã đọc
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              Đã đọc
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(item.createdAt)}
                        </span>

                        {actionLink && (
                          <Link
                            href={actionLink.href}
                            onClick={() => {
                              if (!isRead) markReadMutation.mutate(item.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {actionLink.label}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
