import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
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
    <Card className={cn('overflow-hidden transition-all hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{value}</h3>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs font-medium">
                <span className={cn(trend.isPositive ? 'text-emerald-600' : 'text-red-600')}>
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-slate-400">so với tháng trước</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconBgColor, iconTextColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
