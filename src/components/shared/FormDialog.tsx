'use client';

import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  onSubmit,
  submitText = 'Lưu thay đổi',
  cancelText = 'Hủy bỏ',
  isLoading = false,
  disabled = false,
  maxWidth = 'md',
  className,
}: FormDialogProps) {
  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className={cn(maxWidthClasses[maxWidth], className)}>
      <DialogHeader>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4 py-1">{children}</div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={disabled || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {submitText}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
