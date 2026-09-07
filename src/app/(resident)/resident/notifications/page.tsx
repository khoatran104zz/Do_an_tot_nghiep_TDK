'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Megaphone, CheckCircle2, Calendar } from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';

export default function ResidentNotificationsPage() {
  const { data: response, isLoading, isError, error, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationAsRead();

  const notifications = response?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Hộp thư Thông báo"
        description="Toàn bộ thông báo từ Ban Quản Lý về bảo trì kỹ thuật, kiểm tra an toàn PCCC và tin tức chung của tòa nhà."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-28" />
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
            title="Chưa có thông báo nào"
            description="Ban Quản Lý chưa phát hành thông báo mới cho tòa nhà."
          />
        </Card>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((item: any) => {
            const isRead = item.reads && item.reads.length > 0;
            return (
              <Card
                key={item.id}
                onClick={() => !isRead && markReadMutation.mutate(item.id)}
                className={`overflow-hidden border transition-all cursor-pointer hover:shadow-md ${
                  !isRead
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl ${
                          !isRead
                            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isRead ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                          Mới
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Đã đọc
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(item.createdAt)}
                    </span>
                    <span>Từ: Ban Quản Lý Tòa Nhà</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
