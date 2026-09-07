'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  side?: 'right' | 'left';
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

export function Sheet({
  open,
  onOpenChange,
  children,
  className,
  side = 'right',
  size = 'default',
}: SheetProps) {
  const [mounted, setMounted] = React.useState(open);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle escape key and lock body scroll
  React.useEffect(() => {
    if (!mounted) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mounted, handleClose]);

  if (!mounted) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    default: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200',
          isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet Content Panel */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 flex flex-col w-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl transition-transform duration-200 ease-in-out',
          side === 'right' ? 'right-0' : 'left-0 border-r border-l-0',
          sizeClasses[size],
          isClosing ? 'animate-sheet-out-right' : 'animate-sheet-in-right',
          className
        )}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
          aria-label="Đóng bảng chi tiết"
        >
          <X className="h-4.5 w-4.5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800 pr-12 bg-slate-50/50 dark:bg-slate-900/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function SheetDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function SheetContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-6 space-y-5', className)} {...props}>
      {children}
    </div>
  );
}

export function SheetFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
