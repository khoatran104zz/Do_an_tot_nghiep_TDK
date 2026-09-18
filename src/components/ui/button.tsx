import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B4F]/25 focus-visible:border-[#0F6B4F] select-none cursor-pointer active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-[#0F6B4F] text-white shadow-xs hover:bg-[#0c5942] hover:shadow-sm active:bg-[#094634]',
        destructive: 'bg-red-600 text-white shadow-xs hover:bg-red-700 hover:shadow-sm active:bg-red-800',
        outline: 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-[#E8F5ED] dark:hover:bg-emerald-950/30 hover:text-[#0F6B4F] dark:hover:text-emerald-400 hover:border-[#0F6B4F]/40 active:bg-[#d5eee0]',
        secondary: 'border border-[#0F6B4F]/30 bg-white dark:bg-slate-900 text-[#0F6B4F] dark:text-emerald-400 shadow-xs hover:bg-[#E8F5ED] dark:hover:bg-emerald-950/40 active:bg-[#d5eee0]',
        ghost: 'text-slate-600 dark:text-slate-300 hover:bg-[#E8F5ED]/50 dark:hover:bg-slate-800 hover:text-[#0F6B4F] dark:hover:text-white active:bg-[#E8F5ED]',
        link: 'text-[#0F6B4F] dark:text-emerald-400 underline-offset-4 hover:underline p-0 h-auto active:scale-100',
        success: 'bg-[#22C55E] text-white shadow-xs hover:bg-[#16a34a] hover:shadow-sm active:bg-[#15803d]',
        soft: 'bg-[#E8F5ED] text-[#0F6B4F] hover:bg-[#d8eedf] active:bg-[#c5e6d1]',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        xs: 'h-7 rounded-md px-2.5 text-xs',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6 text-sm font-semibold',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-current shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-1.5 shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-1.5 shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
