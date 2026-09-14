export const REPORT_VERSION = '1.0' as const;

export type ReportDataSource =
  | 'AFFILIATE'
  | 'ASSEMBLY_CONVOCATION'
  | 'ABSENCE_JUSTIFICATION'
  | 'SANCTION'
  | 'INVENTORY_ITEM'
  | 'INVENTORY_CATEGORY'
  | 'INVENTORY_MOVEMENT'
  | 'INVENTORY_LOAN';

export type ReportDataSources = readonly [
  ReportDataSource,
  ...ReportDataSource[],
];

export interface ReportGeneratedBy {
  id: number;
  fullName: string;
}

export interface ReportPeriod {
  from: Date | null;
  to: Date | null;
}

export type ReportFilterValue = string | number | boolean | Date;

export interface ReportMetadata {
  generatedAt: Date;
  generatedBy: ReportGeneratedBy | null;
  period: ReportPeriod;
  appliedFilters: Record<string, ReportFilterValue>;
  dataSource: ReportDataSource | ReportDataSources;
  reportVersion: typeof REPORT_VERSION;
}

export interface ReportResponse<T> {
  metadata: ReportMetadata;
  data: T;
}

interface BuildReportMetadataOptions {
  generatedBy?: ReportGeneratedBy | null;
  dateFrom?: Date;
  dateTo?: Date;
  filters?: Record<string, ReportFilterValue | null | undefined>;
  dataSource: ReportDataSource | ReportDataSources;
}

export function buildReportMetadata({
  generatedBy = null,
  dateFrom,
  dateTo,
  filters = {},
  dataSource,
}: BuildReportMetadataOptions): ReportMetadata {
  const appliedFilters = Object.fromEntries(
    Object.entries(filters).filter(
      (entry): entry is [string, ReportFilterValue] =>
        entry[1] !== undefined && entry[1] !== null,
    ),
  );

  return {
    generatedAt: new Date(),
    generatedBy,
    period: { from: dateFrom ?? null, to: dateTo ?? null },
    appliedFilters,
    dataSource,
    reportVersion: REPORT_VERSION,
  };
}
