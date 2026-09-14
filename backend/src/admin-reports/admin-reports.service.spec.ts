import {
  AssemblyStatus,
  AttendanceStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminReportsService } from './admin-reports.service';

type AttendanceRecord = { status: AttendanceStatus };

function assembly(
  id: number,
  convokedCount: number,
  attendances: AttendanceRecord[],
  date = new Date('2026-06-15T16:00:00.000Z'),
) {
  return {
    id,
    title: `Asamblea ${id}`,
    date,
    status: AssemblyStatus.COMPLETED,
    attendances,
    _count: { convocations: convokedCount },
  };
}

describe('AdminReportsService attendanceSummary', () => {
  const prisma = {
    assembly: { findMany: jest.fn() },
    affiliate: { count: jest.fn() },
    affiliateRequest: { count: jest.fn() },
    absenceJustification: { groupBy: jest.fn() },
    affiliateSanction: { groupBy: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: AdminReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminReportsService(prisma as unknown as PrismaService);
  });

  it('calculates attendance from the assembly convocation population', async () => {
    prisma.assembly.findMany.mockResolvedValue([
      assembly(1, 10, [
        ...Array.from({ length: 7 }, () => ({
          status: AttendanceStatus.PRESENT,
        })),
        ...Array.from({ length: 2 }, () => ({
          status: AttendanceStatus.ABSENT,
        })),
      ]),
    ]);

    const result = await service.attendanceSummary({});

    expect(result.data.data[0]).toEqual(
      expect.objectContaining({
        convokedCount: 10,
        denominatorAvailable: true,
        present: 7,
        absent: 2,
        justified: 0,
        unrecorded: 1,
        attendancePercentage: 70,
      }),
    );
  });

  it('uses a different convocation denominator for each assembly', async () => {
    prisma.assembly.findMany.mockResolvedValue([
      assembly(1, 10, [{ status: AttendanceStatus.PRESENT }]),
      assembly(2, 4, [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
      ]),
    ]);

    const result = await service.attendanceSummary({});

    expect(result.data.data).toEqual([
      expect.objectContaining({ convokedCount: 10, attendancePercentage: 10 }),
      expect.objectContaining({ convokedCount: 4, attendancePercentage: 50 }),
    ]);
  });

  it('counts convocations independently of current affiliate status', async () => {
    prisma.assembly.findMany.mockResolvedValue([
      assembly(1, 1, [{ status: AttendanceStatus.PRESENT }]),
    ]);

    const result = await service.attendanceSummary({});

    expect(result.data.data[0].convokedCount).toBe(1);
    expect(result.data.data[0].attendancePercentage).toBe(100);
    expect(prisma.assembly.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { convocations: true } },
        }),
      }),
    );
    expect(prisma.affiliate.count).not.toHaveBeenCalled();
  });

  it('does not count an active affiliate who was not convoked', async () => {
    prisma.assembly.findMany.mockResolvedValue([assembly(1, 0, [])]);

    const result = await service.attendanceSummary({});

    expect(result.data.data[0]).toEqual(
      expect.objectContaining({
        convokedCount: 0,
        present: 0,
        unrecorded: 0,
      }),
    );
    expect(prisma.affiliate.count).not.toHaveBeenCalled();
  });

  it('marks a historical assembly without convocations as unavailable', async () => {
    prisma.assembly.findMany.mockResolvedValue([
      assembly(1, 0, [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
      ]),
    ]);

    const result = await service.attendanceSummary({});

    expect(result.data.data[0]).toEqual(
      expect.objectContaining({
        convokedCount: 0,
        denominatorAvailable: false,
        present: 1,
        absent: 1,
        unrecorded: 0,
        attendancePercentage: null,
      }),
    );
  });

  it('preserves JUSTIFIED semantics when calculating unrecorded attendance', async () => {
    prisma.assembly.findMany.mockResolvedValue([
      assembly(1, 3, [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.JUSTIFIED },
      ]),
    ]);

    const result = await service.attendanceSummary({});

    expect(result.data.data[0]).toEqual(
      expect.objectContaining({
        present: 1,
        absent: 0,
        justified: 1,
        unrecorded: 1,
        attendancePercentage: 33.33,
      }),
    );
  });

  it('preserves assembly and date filters', async () => {
    const dateFrom = new Date('2026-01-01T00:00:00.000Z');
    const dateTo = new Date('2026-12-31T23:59:59.999Z');
    prisma.assembly.findMany.mockResolvedValue([]);

    const result = await service.attendanceSummary(
      { assemblyId: 7, dateFrom, dateTo },
      { id: 12, fullName: 'Persona Administradora' },
    );

    expect(prisma.assembly.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 7,
          date: { gte: dateFrom, lte: dateTo },
        },
      }),
    );
    expect(result.metadata).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(Date),
        generatedBy: { id: 12, fullName: 'Persona Administradora' },
        period: { from: dateFrom, to: dateTo },
        appliedFilters: { assemblyId: 7, dateFrom, dateTo },
        dataSource: 'ASSEMBLY_CONVOCATION',
        reportVersion: '1.0',
      }),
    );
    expect(Number.isNaN(result.metadata.generatedAt.getTime())).toBe(false);
    expect(result.data).toEqual({
      assemblies: 0,
      totals: { present: 0, absent: 0, justified: 0 },
      data: [],
    });
  });

  it('omits absent attendance filters from metadata', async () => {
    prisma.assembly.findMany.mockResolvedValue([]);

    const result = await service.attendanceSummary({ assemblyId: 3 });

    expect(result.metadata.period).toEqual({ from: null, to: null });
    expect(result.metadata.appliedFilters).toEqual({ assemblyId: 3 });
    expect(result.metadata.generatedBy).toBeNull();
  });

  it.each([
    ['affiliatesSummary', 'AFFILIATE'],
    ['justificationsSummary', 'ABSENCE_JUSTIFICATION'],
    ['sanctionsSummary', 'SANCTION'],
  ] as const)(
    'wraps %s without changing its summary data',
    async (method, source) => {
      prisma.$transaction.mockResolvedValue([10, 7, 2, 1]);
      prisma.absenceJustification.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { _all: 2 } },
      ]);
      prisma.affiliateSanction.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: { _all: 3 } },
      ]);

      const result = await service[method]();

      expect(result.metadata).toEqual(
        expect.objectContaining({
          generatedAt: expect.any(Date),
          generatedBy: null,
          period: { from: null, to: null },
          appliedFilters: {},
          dataSource: source,
          reportVersion: '1.0',
        }),
      );
      const expectedData = {
        affiliatesSummary: {
          total: 10,
          active: 7,
          inactive: 2,
          pendingRequests: 1,
        },
        justificationsSummary: {
          total: 2,
          PENDING: 0,
          APPROVED: 2,
          REJECTED: 0,
        },
        sanctionsSummary: { total: 3, ACTIVE: 3, RESOLVED: 0, REVOKED: 0 },
      }[method];
      expect(result.data).toEqual(expectedData);
    },
  );
});
