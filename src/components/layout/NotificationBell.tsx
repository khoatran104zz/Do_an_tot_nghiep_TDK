'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Megaphone, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  CreditCard, 
  Package, 
  Vote, 
  Users, 
  Wrench 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useNotifications, 
  useUnreadNotificationCount, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead 
} from '@/hooks/use-notifications';
import { useRealtimeNotifications } from '@/hooks/use-realtime';
import { formatDateTime, cn } from '@/lib/utils';

interface NotificationBellProps {
  role?: string;
  className?: string;
}

export function NotificationBell({ role, className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Kích hoạt kết nối Server-Sent Events (SSE) theo thời gian thực
  useRealtimeNotifications();

  const { data: response } = useNotifications({ limit: 10 });
  const { data: unreadData } = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  const notifications = (response as any)?.data || [];
  const serverUnreadCount = (unreadData as any)?.data?.unreadCount;
  const localUnreadCount = notifications.filter((n: any) => !n.reads || n.reads.length === 0).length;
  const unreadCount = typeof serverUnreadCount === 'number' ? serverUnreadCount : localUnreadCount;

  const targetHref = role === 'RESIDENT' ? '/resident/notifications' : '/notifications';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const getCategoryIcon = (category?: string, priority?: string) => {
    if (priority === 'EMERGENCY' || category === 'EMERGENCY') {
      return <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />;
    }
    switch (category) {
      case 'BILLING':
        return <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case 'PARCEL':
        return <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'POLL':
        return <Vote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'VISITOR':
        return <Users className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />;
      case 'MAINTENANCE':
        return <Wrench className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Megaphone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer min-h-[40px] min-w-[40px]"
        aria-label={`Thông báo (${unreadCount} chưa đọc)`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Thông báo</span>
              {unreadCount > 0 && (
                <Badge variant="default" size="sm" className="bg-rose-500 hover:bg-rose-600">
                  {unreadCount} mới
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <Check className="h-3 w-3" />
                  Đã đọc tất cả
                </button>
              )}
              <Link
                href={targetHref}
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Xem tất cả
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 stroke-1" />
                <p className="font-medium text-slate-600 dark:text-slate-400">Không có thông báo mới</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Tất cả thông báo sẽ hiển thị ở đây</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((item: any) => {
                const isRead = item.reads && item.reads.length > 0;
                return (
                  <Link
                    key={item.id}
                    href={targetHref}
                    onClick={() => {
                      if (!isRead) markReadMutation.mutate(item.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'block p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group',
                      !isRead && 'bg-blue-50/40 dark:bg-blue-950/20'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg shrink-0 mt-0.5',
                          item.priority === 'EMERGENCY'
                            ? 'bg-rose-100 dark:bg-rose-950/50'
                            : !isRead
                            ? 'bg-blue-100 dark:bg-blue-950/50'
                            : 'bg-slate-100 dark:bg-slate-800'
                        )}
                      >
                        {getCategoryIcon(item.category, item.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </p>
                          {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.content}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
            <Link
              href={targetHref}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 block py-1"
            >
              Mở trung tâm thông báo đầy đủ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
