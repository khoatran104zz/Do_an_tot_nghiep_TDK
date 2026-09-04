import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        <select
          className={cn(
            'flex h-9 w-full appearance-none rounded-lg border bg-white px-3 py-1.5 pr-8 text-sm text-slate-900 shadow-2xs transition-all duration-150 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
            hasError
              ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
              : 'border-slate-200 hover:border-slate-300 focus-visible:border-blue-600 focus-visible:ring-blue-600/15',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        {typeof error === 'string' && (
          <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
