import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none select-none',
  {
    variants: {
      variant: {
        default: 'border-blue-200 bg-blue-50 text-blue-700',
        secondary: 'border-slate-200 bg-slate-100 text-slate-700',
        destructive: 'border-red-200 bg-red-50 text-red-700',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
        info: 'border-sky-200 bg-sky-50 text-sky-700',
        outline: 'border-slate-300 bg-white text-slate-700',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.2 text-[11px]',
        lg: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const dotColors: Record<string, string> = {
  default: 'bg-blue-500',
  secondary: 'bg-slate-500',
  destructive: 'bg-red-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  outline: 'bg-slate-400',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant = 'default', size, dot = false, children, ...props }: BadgeProps) {
  const dotColor = dotColors[variant || 'default'] || 'bg-slate-400';

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
