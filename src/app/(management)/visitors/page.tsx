'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  UserCheck,
  Users,
  Clock,
  LogOut,
  Plus,
  Camera,
  Search,
  Calendar,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Building2,
  Car,
  QrCode,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { VISITOR_STATUS_MAP } from '@/modules/visitor/visitor.constants';
import {
  useVisitorPasses,
  useVisitorStats,
  useCancelVisitorPass,
  useCheckInVisitor,
  useCheckOutVisitor,
} from '@/hooks/use-visitors';
import { VisitorPassCard } from '@/components/visitor/VisitorPassCard';
import { CreateVisitorModal } from '@/components/visitor/CreateVisitorModal';
import { VisitorStatus } from '@prisma/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function VisitorsManagementPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedPass, setSelectedPass] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const { data: statsData, isLoading: isStatsLoading } = useVisitorStats();
  const { data: passesData, isLoading: isPassesLoading, refetch } = useVisitorPasses({
    search: searchTerm.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : (statusFilter as VisitorStatus),
    date: dateFilter || undefined,
  });

  const cancelMutation = useCancelVisitorPass();
  const checkInMutation = useCheckInVisitor();
  const checkOutMutation = useCheckOutVisitor();

  const stats = statsData?.data || {
    activeVisitors: 0,
    todayTotal: 0,
    pendingToday: 0,
    checkedOutToday: 0,
  };

  const passes = passesData?.data || [];

  const handleExportCSV = () => {
    if (passes.length === 0) {
      toast.error('Không có dữ liệu khách để xuất');
      return;
    }
    const headers = ['Mã Thẻ', 'Họ Tên Khách', 'SĐT', 'Căn Hộ', 'Cư Dân Bảo Lãnh', 'Ngày Đến', 'Khung Giờ', 'Biển Số Xe', 'Trạng Thái', 'Vào Lúc', 'Ra Lúc'];
    const rows = passes.map((p: any) => [
      p.passCode,
      p.visitorName,
      p.visitorPhone || '',
      p.apartment?.unitNumber || '',
      p.resident?.fullName || '',
      format(new Date(p.visitDate), 'yyyy-MM-dd'),
      p.expectedTime || '',
      p.licensePlate || '',
      VISITOR_STATUS_MAP[p.status as VisitorStatus]?.label || p.status,
      p.checkInAt ? format(new Date(p.checkInAt), 'yyyy-MM-dd HH:mm:ss') : '',
      p.checkOutAt ? format(new Date(p.checkOutAt), 'yyyy-MM-dd HH:mm:ss') : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r: any[]) => r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_khach_tham_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file báo cáo khách thăm thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quản Lý Khách Thăm (Visitors)"
        description="Theo dõi lịch sử vào ra, cấp thẻ khách QR Code và giám sát an ninh tòa nhà theo thời gian thực"
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
            An Ninh & Lễ Tân
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-border text-foreground hover:bg-muted gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Xuất Báo Cáo
          </Button>
          <Link href="/visitors/scan">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md">
              <Camera className="h-4 w-4" />
              Máy Quét QR Check-in
            </Button>
          </Link>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Đăng Ký Khách Mới
          </Button>
        </div>
      </PageHeader>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Khách đang trong tòa nhà
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isStatsLoading ? '-' : stats.activeVisitors}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Thời gian thực
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <UserCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tổng lượt khách hôm nay
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isStatsLoading ? '-' : stats.todayTotal}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                Bao gồm cả đang ở và đã rời
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Lịch hẹn chờ đến hôm nay
              </p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">
                {isStatsLoading ? '-' : stats.pendingToday}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                Đã được cư dân tạo thẻ trước
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs hover:border-indigo-500/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Đã rời đi hôm nay
              </p>
              <h3 className="text-2xl font-bold text-indigo-500 mt-1">
                {isStatsLoading ? '-' : stats.checkedOutToday}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                Đã check-out an ninh
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <LogOut className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã thẻ (VP-...), tên khách, SĐT, biển số xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>

          <div className="w-full sm:w-48">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-background border-border"
              placeholder="Lọc theo ngày"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'CHECKED_IN', label: 'Đang trong tòa nhà' },
            { key: 'PENDING', label: 'Chờ đến' },
            { key: 'CHECKED_OUT', label: 'Đã về' },
            { key: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visitors Data Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3.5">Mã Thẻ / QR</th>
                <th className="px-4 py-3.5">Khách Đến Thăm</th>
                <th className="px-4 py-3.5">Căn Hộ & Cư Dân</th>
                <th className="px-4 py-3.5">Lịch Đến</th>
                <th className="px-4 py-3.5">Phương Tiện</th>
                <th className="px-4 py-3.5">Trạng Thái</th>
                <th className="px-4 py-3.5">Thời Gian Vào/Ra</th>
                <th className="px-4 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {isPassesLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span className="text-xs text-muted-foreground">Đang tải danh sách khách...</span>
                  </td>
                </tr>
              ) : passes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                    Không tìm thấy lượt khách nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                passes.map((p: any) => {
                  const statusInfo = VISITOR_STATUS_MAP[p.status as VisitorStatus] || {
                    label: p.status,
                    badgeClass: 'bg-muted text-muted-foreground',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setSelectedPass(p)}
                          className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>{p.passCode}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">{p.visitorName}</div>
                        {p.visitorPhone && (
                          <div className="text-xs text-muted-foreground">{p.visitorPhone}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          Căn {p.apartment?.unitNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.resident?.fullName || 'Chưa liên kết'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-medium text-foreground">
                          {format(new Date(p.visitDate), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                        <div className="text-muted-foreground">{p.expectedTime}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-mono">
                        {p.licensePlate ? (
                          <span className="px-2 py-0.5 rounded bg-muted border border-border">
                            {p.licensePlate}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Đi bộ / Taxi</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        {p.checkInAt ? (
                          <div className="text-emerald-600 dark:text-emerald-400">
                            Vào: {format(new Date(p.checkInAt), 'HH:mm dd/MM')}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Chưa vào</div>
                        )}
                        {p.checkOutAt && (
                          <div className="text-blue-600 dark:text-blue-400">
                            Ra: {format(new Date(p.checkOutAt), 'HH:mm dd/MM')}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPass(p)}
                            className="h-8 text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem Thẻ</span>
                          </Button>

                          {p.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={checkInMutation.isPending}
                              onClick={async () => {
                                await checkInMutation.mutateAsync(p.id);
                                refetch();
                              }}
                              className="h-8 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                            >
                              Check-in
                            </Button>
                          )}

                          {p.status === 'CHECKED_IN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={checkOutMutation.isPending}
                              onClick={async () => {
                                await checkOutMutation.mutateAsync(p.id);
                                refetch();
                              }}
                              className="h-8 text-xs border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                            >
                              Check-out
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pass Detail Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl my-8">
            <VisitorPassCard
              pass={selectedPass}
              onCancel={async (id) => {
                await cancelMutation.mutateAsync(id);
                setSelectedPass(null);
                refetch();
              }}
              isCancelling={cancelMutation.isPending}
            />
            <div className="mt-3 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setSelectedPass(null)}
                className="bg-card text-foreground"
              >
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Pass Modal */}
      <CreateVisitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
