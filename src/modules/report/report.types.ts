export type ReportType =
  | 'APARTMENT'
  | 'RESIDENT'
  | 'REVENUE'
  | 'OUTSTANDING_DEBT'
  | 'PAYMENT'
  | 'MAINTENANCE'
  | 'SLA_PERFORMANCE'
  | 'PARKING'
  | 'VISITOR'
  | 'PARCEL'
  | 'FACILITY'
  | 'POLL'
  | 'STAFF'
  | 'SMART_ALERT';

export interface ReportFilter {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  building?: string;
  floor?: number;
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface ReportDataResult {
  type: ReportType;
  title: string;
  generatedAt: string;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  totalRows: number;
  page: number;
  limit: number;
  summary?: Record<string, any>;
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportReportParams {
  filter: ReportFilter;
  format: ExportFormat;
}
