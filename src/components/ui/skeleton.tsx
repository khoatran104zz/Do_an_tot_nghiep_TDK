import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg bg-slate-200/80 dark:bg-slate-800',
        className
      )}
      {...props}
    />
  );
}
