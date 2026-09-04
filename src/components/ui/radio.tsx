import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, checked, defaultChecked, onChange, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;

    return (
      <div className="inline-flex items-start gap-2.5 select-none">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              'peer h-4.5 w-4.5 appearance-none rounded-full border border-slate-300 bg-white transition-all cursor-pointer',
              'checked:border-blue-600 checked:bg-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100',
              className
            )}
            {...props}
          />
          <div className="pointer-events-none absolute h-2 w-2 rounded-full bg-blue-600 opacity-0 transition-opacity peer-checked:opacity-100" />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'text-sm font-medium text-slate-700 cursor-pointer',
                  disabled && 'cursor-not-allowed text-slate-400'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Radio.displayName = 'Radio';

export { Radio };
