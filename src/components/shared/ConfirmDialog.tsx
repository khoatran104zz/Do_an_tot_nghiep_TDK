'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'destructive',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-3 mb-2 text-amber-600">
        <AlertTriangle className="h-6 w-6" />
        <DialogTitle>{title}</DialogTitle>
      </div>
      <DialogDescription>{description}</DialogDescription>
      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Đang xử lý...' : confirmText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
