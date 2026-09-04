'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Megaphone, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function NotificationDropdown({ role }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: response } = useNotifications();
  const notifications = response?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.reads || n.reads.length === 0).length;

  const targetHref = role === 'RESIDENT' ? '/resident/notifications' : '/notifications';

  // Click outside and Escape handler
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

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer min-h-[44px] min-w-[44px]"
        aria-label={`Thông báo (${unreadCount} chưa đọc)`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Thông báo tòa nhà</span>
              {unreadCount > 0 && (
                <Badge variant="default" size="sm">
                  {unreadCount} mới
                </Badge>
              )}
            </div>
            <Link
              href={targetHref}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2 stroke-1" />
                <p className="font-medium text-slate-600">Không có thông báo mới</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tất cả thông báo sẽ hiển thị ở đây</p>
              </div>
            ) : (
              notifications.slice(0, 4).map((item: any) => {
                const isRead = item.reads && item.reads.length > 0;
                return (
                  <Link
                    key={item.id}
                    href={targetHref}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block p-3.5 hover:bg-slate-50 transition-colors text-left group',
                      !isRead && 'bg-blue-50/30'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg shrink-0 mt-0.5',
                          !isRead ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        <Megaphone className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </p>
                          {!isRead && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.content}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
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
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link
              href={targetHref}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 block py-1"
            >
              Mở trung tâm thông báo đầy đủ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
