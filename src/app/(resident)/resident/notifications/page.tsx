'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Bell, Megaphone, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';

export default function ResidentNotificationsPage() {
  const { data: response, isLoading, isError, error, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationAsRead();

  const notifications = response?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <PageHeader
        title="Thông báo từ Ban Quản Lý"
        description="Theo dõi các thông tin thông báo bảo trì, sự kiện và tin tức mới nhất từ tòa nhà."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/40">
          <p className="font-semibold text-slate-800">Không thể tải danh sách thông báo</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {(error as any)?.message || 'Vui lòng kiểm tra lại kết nối mạng và thử lại.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4 text-xs text-slate-700 hover:bg-white gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </Button>
        </Card>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Chưa có thông báo nào"
          description="Ban Quản Lý chưa phát hành thông báo mới cho tòa nhà."
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((item: any) => {
            const isRead = item.reads && item.reads.length > 0;
            return (
              <Card
                key={item.id}
                onClick={() => !isRead && markReadMutation.mutate(item.id)}
                className={`border transition-all cursor-pointer ${
                  !isRead ? 'border-blue-300 bg-blue-50/20 shadow-xs' : 'border-slate-200 bg-white'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-base">{item.title}</span>
                    </div>
                    {!isRead ? (
                      <span className="h-2 w-2 rounded-full bg-blue-600" title="Chưa đọc" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {formatDateTime(item.createdAt)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
