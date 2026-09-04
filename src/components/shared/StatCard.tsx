import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  iconBgColor?: string;
  iconTextColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconBgColor = 'bg-blue-50',
  iconTextColor = 'text-blue-600',
}: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300', className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
            {description && <p className="text-xs text-slate-500 leading-normal">{description}</p>}
            {trend && (
              <div className="flex items-center gap-1.5 pt-1 text-xs font-medium">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 font-semibold',
                    trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 inline" />
                  ) : (
                    <TrendingDown className="h-3 w-3 inline" />
                  )}
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-slate-400">{trend.label || 'so với tháng trước'}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl shrink-0 border border-black/5 shadow-2xs', iconBgColor, iconTextColor)}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
