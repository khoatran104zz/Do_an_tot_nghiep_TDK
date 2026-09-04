import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
  onClose?: () => void;
}

const alertConfig = {
  info: {
    container: 'bg-blue-50/70 border-blue-200 text-blue-900',
    icon: Info,
    iconColor: 'text-blue-600',
  },
  success: {
    container: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  warning: {
    container: 'bg-amber-50/70 border-amber-200 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  destructive: {
    container: 'bg-red-50/70 border-red-200 text-red-900',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
  ...props
}: AlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-xl border p-4 text-xs leading-relaxed shadow-2xs',
        config.container,
        className
      )}
      {...props}
    >
      <Icon className={cn('h-4.5 w-4.5 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 space-y-0.5">
        {title && <h5 className="font-semibold text-sm leading-none mb-1">{title}</h5>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
