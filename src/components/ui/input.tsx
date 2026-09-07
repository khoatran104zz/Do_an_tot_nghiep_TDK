import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 shadow-2xs transition-all duration-200 ease-out',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
            hasError
              ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20 animate-error-shake'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:border-blue-600 focus-visible:ring-blue-600/15',
            'disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 disabled:border-slate-200 dark:disabled:border-slate-800',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className

          )}
          ref={ref}
          aria-invalid={hasError}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
        {typeof error === 'string' && (
          <p className="mt-1.5 text-xs font-medium text-red-600 animate-in fade-in-50 slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
