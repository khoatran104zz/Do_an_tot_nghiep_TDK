'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Megaphone, CheckCircle2 } from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';

export default function ResidentNotificationsPage() {
  const { data: response, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationAsRead();

  const notifications = response?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo từ Ban Quản Lý"
        description="Theo dõi các thông tin thông báo bảo trì, sự kiện và tin tức mới nhất từ tòa nhà."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Chưa có thông báo nào</p>
          <p className="text-xs text-slate-400 mt-1">Ban Quản Lý chưa phát hành thông báo mới.</p>
        </Card>
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
