import { apiClient } from '@/lib/api-client';
import { ReportFilter, ReportDataResult, ExportFormat } from '@/modules/report/report.types';

export const reportClientService = {
  async getReportData(filter: ReportFilter) {
    return apiClient<ReportDataResult>('/reports/data', {
      params: filter as any,
    });
  },

  async exportReport(filter: ReportFilter, format: ExportFormat) {
    return apiClient<{
      content: string;
      filename: string;
      mimeType: string;
    }>('/reports/export', {
      method: 'POST',
      body: JSON.stringify({ filter, format }),
    });
  },
};
