'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Sparkles, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';

export interface StatItem {
  label: string;
  value: string | number;
  subtext?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  icon?: React.ElementType;
}

export interface SmartModulePlaceholderProps {
  title: string;
  description: string;
  categoryBadge?: string;
  category?: string;
  badgeText?: string;
  icon?: React.ElementType;
  stats?: StatItem[];
  primaryActionLabel?: string;
  actionButtonText?: string;
  primaryActionIcon?: React.ElementType;
  tableTitle?: string;
  tableHeaders?: string[];
  mockData?: Array<Record<string, any>>;
  sampleRows?: Array<string[]>;
  children?: React.ReactNode;
}

export function SmartModulePlaceholder({
  title,
  description,
  categoryBadge,
  category,
  badgeText,
  icon: Icon = Sparkles,
  stats = [],
  primaryActionLabel,
  actionButtonText,
  primaryActionIcon: ActionIcon = Plus,
  tableTitle = 'Danh sách hoạt động gần đây',
  tableHeaders = ['Mã tham chiếu', 'Tiêu đề / Đối tượng', 'Thời gian', 'Trạng thái'],
  mockData = [],
  sampleRows,
  children,
}: SmartModulePlaceholderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const badgeLabel = categoryBadge || badgeText || category || 'Smart Building';
  const buttonText = actionButtonText || primaryActionLabel || 'Thao tác';

  const handleAction = () => {
    toast.info(`Tính năng [${primaryActionLabel}] đang được kích hoạt trong chế độ Smart Building Preview`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {title}
                </h1>
                <Badge variant="info" size="sm" className="text-[10px] font-bold tracking-wider uppercase">
                  {badgeLabel}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleAction}
            className="bg-[#0F6B4F] hover:bg-[#0c5942] active:bg-[#094634] text-white font-semibold text-xs shadow-sm shadow-[#0F6B4F]/20 cursor-pointer"
          >
            <ActionIcon className="h-4 w-4 mr-1.5" />
            {buttonText}
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const StatIcon = stat.icon;
            const changeText = stat.change || stat.subtext;
            return (
              <Card key={idx} className="border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </span>
                    {StatIcon && (
                      <StatIcon className={`h-4 w-4 ${stat.color || 'text-blue-500'}`} />
                    )}
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      {stat.value}
                    </span>
                    {changeText && (
                      <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${stat.color || 'text-emerald-600 dark:text-emerald-400'}`}>
                        {stat.trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5" />}
                        {stat.trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5" />}
                        {changeText}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {children}

      {/* Data Table / List Preview */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {tableTitle}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dữ liệu đồng bộ trực tiếp từ hệ thống IoT và phân hệ vận hành tòa nhà
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Tìm kiếm nhanh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-white dark:bg-slate-950"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} className="px-4 py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {sampleRows && sampleRows.length > 0 ? (
                  sampleRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : mockData.length > 0 ? (
                  mockData.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {Object.values(row).map((val, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {typeof val === 'string' && val.startsWith('badge:') ? (
                            <Badge variant="info" size="sm">
                              {val.replace('badge:', '')}
                            </Badge>
                          ) : (
                            val
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                          Chưa có bản ghi nào trong hệ thống
                        </span>
                        <span className="text-xs text-slate-500 max-w-sm">
                          Hệ thống đã sẵn sàng kết nối và tiếp nhận dữ liệu thời gian thực.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
