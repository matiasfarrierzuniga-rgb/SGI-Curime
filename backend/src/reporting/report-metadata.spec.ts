import { buildReportMetadata } from './report-metadata';

describe('buildReportMetadata', () => {
  it('builds technical metadata and omits filters that were not applied', () => {
    const dateFrom = new Date('2026-01-01T00:00:00.000Z');
    const before = Date.now();

    const metadata = buildReportMetadata({
      generatedBy: { id: 7, fullName: 'Persona Administradora' },
      dateFrom,
      filters: { dateFrom, dateTo: undefined, assemblyId: null },
      dataSource: 'ASSEMBLY_CONVOCATION',
    });

    expect(metadata.generatedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(metadata.generatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(metadata.generatedBy).toEqual({
      id: 7,
      fullName: 'Persona Administradora',
    });
    expect(metadata.period).toEqual({ from: dateFrom, to: null });
    expect(metadata.appliedFilters).toEqual({ dateFrom });
    expect(metadata.dataSource).toBe('ASSEMBLY_CONVOCATION');
    expect(metadata.reportVersion).toBe('1.0');
  });

  it('uses nullable identity and an empty period by default', () => {
    const metadata = buildReportMetadata({ dataSource: 'AFFILIATE' });

    expect(metadata.generatedBy).toBeNull();
    expect(metadata.period).toEqual({ from: null, to: null });
    expect(metadata.appliedFilters).toEqual({});
  });
});
