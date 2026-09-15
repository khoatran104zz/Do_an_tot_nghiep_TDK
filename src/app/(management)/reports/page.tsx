'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Building,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useReportData, useExportReport } from '@/hooks/use-reports';
import { ReportType, ExportFormat } from '@/modules/report/report.types';

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType>('REVENUE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [page, setPage] = useState(1);

  const reportTypes: Array<{ type: ReportType; label: string }> = [
    { type: 'REVENUE', label: '1. Doanh thu & Phát hành phí' },
    { type: 'OUTSTANDING_DEBT', label: '2. Nợ đọng & Quá hạn' },
    { type: 'PAYMENT', label: '3. Lịch sử thanh toán thực thu' },
    { type: 'APARTMENT', label: '4. Tình trạng căn hộ' },
    { type: 'RESIDENT', label: '5. Nhân khẩu & Cư dân' },
    { type: 'MAINTENANCE', label: '6. Bảo trì & Xử lý sự cố' },
    { type: 'SLA_PERFORMANCE', label: '7. Hiệu suất cam kết SLA' },
    { type: 'PARKING', label: '8. Phương tiện & Bãi gửi xe' },
    { type: 'VISITOR', label: '9. Lượt khách ra vào' },
    { type: 'PARCEL', label: '10. Giao nhận bưu kiện' },
    { type: 'FACILITY', label: '11. Đặt tiện ích công cộng' },
    { type: 'POLL', label: '12. Khảo sát & Biểu quyết' },
    { type: 'STAFF', label: '13. Đội ngũ nhân viên' },
    { type: 'SMART_ALERT', label: '14. Cảnh báo vận hành & IoT' },
  ];

  const { data: response, isLoading } = useReportData({
    type: selectedType,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    building: building || undefined,
    floor: floor ? parseInt(floor, 10) : undefined,
    page,
    limit: 20,
  });

  const exportMutation = useExportReport();

  const reportData = response;
  const columns = reportData?.columns || [];
  const rows = reportData?.rows || [];
  const totalRows = reportData?.totalRows || 0;
  const totalPages = Math.ceil(totalRows / 20) || 1;

  const handleExport = (format: ExportFormat) => {
    exportMutation.mutate({
      filter: {
        type: selectedType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        building: building || undefined,
        floor: floor ? parseInt(floor, 10) : undefined,
      },
      format,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo Cáo & Thống Kê Vận Hành (Reports & Analytics)"
        description="Tổng hợp dữ liệu tài chính, nhân khẩu, hiệu suất xử lý kỹ thuật, phương tiện và IoT với chức năng xuất file đa định dạng."
      />

      {/* Report Controls Panel */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Danh mục báo cáo <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Chọn danh mục báo cáo"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as ReportType);
                  setPage(1);
                }}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reportTypes.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Từ ngày (Ngày bắt đầu)
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-9.5 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Đến ngày (Ngày kết thúc)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-9.5 rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tòa:</span>
              <select
                aria-label="Lọc theo tòa nhà"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5"
              >
                <option value="">Tất cả tòa</option>
                <option value="Tòa A">Tháp A</option>
                <option value="Tòa B">Tháp B</option>
              </select>

              <span className="text-xs text-slate-500 font-medium ml-2">Tầng:</span>
              <Input
                placeholder="Số tầng..."
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="text-xs h-8 w-24 rounded-lg"
              />
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={exportMutation.isPending || rows.length === 0}
                className="text-xs cursor-pointer border-slate-300 dark:border-slate-700"
              >
                <Download className="h-3.5 w-3.5 mr-1 text-slate-600" />
                Xuất CSV (Excel UTF-8)
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('xlsx')}
                disabled={exportMutation.isPending || rows.length === 0}
                className="text-xs cursor-pointer border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Xuất Excel (.xlsx)
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleExport('pdf')}
                disabled={exportMutation.isPending || rows.length === 0}
                className="text-xs cursor-pointer bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              >
                <Printer className="h-3.5 w-3.5 mr-1 text-blue-600" />
                Bản in PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary Cards if available */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(reportData.summary).map(([label, val]) => (
            <Card key={label} className="border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
              <CardContent className="p-3.5">
                <span className="text-[11px] text-slate-500 block">{label}</span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">{String(val)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Data Table */}
      <Card className="border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {reportData?.title || 'Bảng dữ liệu báo cáo'}
            </CardTitle>
            <span className="text-[11px] text-slate-400">
              {totalRows} bản ghi được tìm thấy • Cập nhật lúc {reportData?.generatedAt}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="Không có dữ liệu trong khoảng thời gian đã chọn"
                description="Hãy thử điều chỉnh lại bộ lọc ngày tháng hoặc tòa nhà để xem kết quả."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    {columns.map((c: any) => (
                      <th key={c.key} className="p-3">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {rows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      {columns.map((c: any) => (
                        <td key={c.key} className="p-3 whitespace-nowrap">
                          {row[c.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng {totalRows} dòng)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
