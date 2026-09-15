import { useQuery, useMutation } from '@tanstack/react-query';
import { reportClientService } from '@/services/report.service';
import { ReportFilter, ExportFormat } from '@/modules/report/report.types';
import { toast } from 'sonner';

export function useReportData(filter: ReportFilter) {
  return useQuery({
    queryKey: ['report-data', filter],
    queryFn: () => reportClientService.getReportData(filter),
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: ({ filter, format }: { filter: ReportFilter; format: ExportFormat }) =>
      reportClientService.exportReport(filter, format),
    onSuccess: (res: any) => {
      const data = res?.data;
      if (!data) return;

      // Trigger client download
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Xuất báo cáo thành công!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xuất báo cáo thất bại');
    },
  });
}
