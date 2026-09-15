'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ExternalLink,
  Filter,
  Check,
  Building,
  Radio,
  FileText,
  CreditCard,
  Wrench,
} from 'lucide-react';
import {
  useSmartAlerts,
  useAcknowledgeAlert,
  useResolveAlert,
} from '@/hooks/use-smart-operations';
import { formatDateTime, cn } from '@/lib/utils';

export default function SmartAlertsPage() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: response, isLoading } = useSmartAlerts({
    severity: severityFilter !== 'ALL' ? (severityFilter as any) : undefined,
    source: sourceFilter !== 'ALL' ? (sourceFilter as any) : undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as any) : undefined,
    search: search || undefined,
  });

  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();

  const alerts = response?.data?.items || [];
  const counts = response?.data?.counts || { total: 0, critical: 0, high: 0, warning: 0, info: 0 };

  const getSeverityBadge = (s: string) => {
    switch (s) {
      case 'CRITICAL':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> NGUY CẤP</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> NGHIÊM TRỌNG</Badge>;
      case 'WARNING':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1"><Clock className="h-3 w-3" /> CẢNH BÁO</Badge>;
      default:
        return <Badge variant="secondary">THÔNG TIN</Badge>;
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'IOT':
        return <Radio className="h-4 w-4 text-rose-500" />;
      case 'SLA':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'INVOICE':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'CONTRACT':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      default:
        return <Building className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">Đã giải quyết</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">Đang tiếp nhận</Badge>;
      default:
        return <Badge variant="outline" className="text-rose-600 border-rose-300 animate-pulse">Chờ xử lý</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung tâm Cảnh báo Vận hành (Smart Alerts)"
        description="Theo dõi và điều phối tập trung các cảnh báo sự cố từ cảm biến IoT, cam kết SLA, nợ đọng tài chính và bảo dưỡng kỹ thuật."
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-rose-200/80 bg-rose-50/20 dark:border-rose-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">Nguy cấp (Critical)</span>
              <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{counts.critical}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200/80 bg-orange-50/20 dark:border-orange-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 block">Nghiêm trọng (High)</span>
              <span className="text-2xl font-black text-orange-700 dark:text-orange-300">{counts.high}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/20 dark:border-amber-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">Cảnh báo (Warning)</span>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{counts.warning}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-slate-50/20 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Tổng số cảnh báo</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{counts.total}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600">
              <Filter className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Tìm theo tiêu đề, vị trí, nội dung..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Lọc theo mức độ nghiêm trọng"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Mọi mức độ</option>
            <option value="CRITICAL">Nguy cấp (Critical)</option>
            <option value="HIGH">Nghiêm trọng (High)</option>
            <option value="WARNING">Cảnh báo (Warning)</option>
            <option value="INFO">Thông tin (Info)</option>
          </select>

          <select
            aria-label="Lọc theo nguồn cảnh báo"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Mọi nguồn phát</option>
            <option value="IOT">Cảm biến IoT</option>
            <option value="SLA">Vi phạm cam kết SLA</option>
            <option value="INVOICE">Nợ đọng hóa đơn</option>
            <option value="CONTRACT">Hợp đồng thuê</option>
            <option value="MAINTENANCE">Lịch bảo dưỡng</option>
          </select>

          <select
            aria-label="Lọc theo trạng thái xử lý"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="OPEN">Chờ xử lý (Open)</option>
            <option value="ACKNOWLEDGED">Đang tiếp nhận (Acknowledged)</option>
            <option value="RESOLVED">Đã giải quyết (Resolved)</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Không có cảnh báo nào"
          description="Hệ thống vận hành đang trong trạng thái an toàn và ổn định tuyệt đối."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isResolved = alert.status === 'RESOLVED';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';

            return (
              <Card
                key={alert.id}
                className={cn(
                  'overflow-hidden transition-all duration-200 hover:shadow-md border-slate-200/80 dark:border-slate-800',
                  isCritical && !isResolved && 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/15',
                  isResolved && 'opacity-70 bg-slate-50/30'
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        {getSourceIcon(alert.source)}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                            {alert.title}
                          </h4>
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {alert.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(alert.createdAt)}
                          </span>
                          {alert.location && (
                            <>
                              <span>•</span>
                              <span>Vị trí: <strong>{alert.location}</strong></span>
                            </>
                          )}
                          {alert.source && (
                            <>
                              <span>•</span>
                              <span>Nguồn: <strong>{alert.source}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isAcknowledged && !isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                          className="text-xs cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Tiếp nhận
                        </Button>
                      )}

                      {!isResolved && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                          className="text-xs cursor-pointer text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Hoàn tất
                        </Button>
                      )}

                      {alert.actionUrl && (
                        <Link href={alert.actionUrl}>
                          <Button size="sm" variant="ghost" className="text-xs text-blue-600 dark:text-blue-400">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Xem nguồn
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
