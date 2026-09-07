'use client';

import React from 'react';
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  fullWidth?: boolean;
}

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  items?: DetailItem[];
  children?: React.ReactNode;
  footerActions?: React.ReactNode;
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  badge,
  items,
  children,
  footerActions,
  size = 'default',
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} size={size}>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <SheetTitle>{title}</SheetTitle>
          {badge && <div>{badge}</div>}
        </div>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>

      <SheetContent>
        {/* Key-Value Items Grid */}
        {items && items.length > 0 && (
          <div className="grid grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    'space-y-1',
                    item.fullWidth ? 'col-span-2' : 'col-span-1'
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {Icon && <Icon className="h-3 w-3 text-slate-400" />}
                    {item.label}
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.value || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Body Content */}
        {children}
      </SheetContent>

      <SheetFooter>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Đóng
        </Button>
        {footerActions}
      </SheetFooter>
    </Sheet>
  );
}
