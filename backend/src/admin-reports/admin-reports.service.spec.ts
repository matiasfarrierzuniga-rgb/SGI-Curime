import {
  AssemblyStatus,
  AttendanceStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { FinancialService } from '../financial/financial.service';
import type { InventoryReportsService } from '../inventory-reports/inventory-reports.service';
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
    assembly: { findMany: jest.fn(), groupBy: jest.fn() },
    affiliate: { count: jest.fn() },
    affiliateRequest: { count: jest.fn() },
    absenceJustification: { groupBy: jest.fn() },
    affiliateSanction: { groupBy: jest.fn() },
    reservation: { groupBy: jest.fn() },
    donation: { groupBy: jest.fn() },
    $transaction: jest.fn(),
  };
  const financialService = { summarizeMovements: jest.fn() };
  const inventoryReportsService = { summary: jest.fn() };
  let service: AdminReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminReportsService(
      prisma as unknown as PrismaService,
      financialService as unknown as FinancialService,
      inventoryReportsService as unknown as InventoryReportsService,
    );
  });

  it('consolidates real domain summaries without adding donations to finance', async () => {
    prisma.$transaction.mockResolvedValue([12, 9, 3, 4]);
    prisma.absenceJustification.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: { _all: 2 } },
      { status: 'APPROVED', _count: { _all: 5 } },
    ]);
    prisma.reservation.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: { _all: 3 } },
      { status: 'APPROVED', _count: { _all: 2 } },
      { status: 'CONFIRMED', _count: { _all: 1 } },
    ]);
    prisma.assembly.groupBy.mockResolvedValue([
      { status: 'SCHEDULED', _count: { _all: 2 } },
      { status: 'IN_PROGRESS', _count: { _all: 1 } },
      { status: 'COMPLETED', _count: { _all: 4 } },
    ]);
    prisma.donation.groupBy.mockResolvedValue([
      { status: 'CONFIRMED', _count: { _all: 6 } },
      { status: 'CANCELLED', _count: { _all: 1 } },
    ]);
    financialService.summarizeMovements.mockResolvedValue({
      currency: 'CRC',
      totalIncome: '150000.00',
      totalExpenses: '40000.00',
      balance: '110000.00',
    });
    inventoryReportsService.summary.mockResolvedValue({
      metadata: {},
      data: {
        totalItems: 20,
        activeItems: 18,
        inactiveItems: 2,
        totalCategories: 5,
        lowStockCount: 3,
        outOfStockCount: 1,
        activeLoans: 4,
        overdueLoans: 2,
      },
    });

    const result = await service.dashboard({
      id: 12,
      fullName: 'Persona Administradora',
    });

    expect(financialService.summarizeMovements).toHaveBeenCalledWith({});
    expect(inventoryReportsService.summary).toHaveBeenCalledWith();
    expect(result.data).toEqual({
      affiliates: { total: 12, active: 9, inactive: 3 },
      affiliateRequests: { pending: 4 },
      reservations: {
        total: 6,
        pending: 3,
        approved: 2,
        rejected: 0,
        cancelled: 0,
        confirmed: 1,
        completed: 0,
      },
      financial: {
        currency: 'CRC',
        totalIncome: '150000.00',
        totalExpenses: '40000.00',
        balance: '110000.00',
      },
      donations: { total: 7, confirmed: 6, cancelled: 1 },
      inventory: expect.objectContaining({
        totalItems: 20,
        lowStockItems: 3,
        outOfStockItems: 1,
        activeLoans: 4,
        overdueLoans: 2,
      }),
      assemblies: {
        total: 7,
        scheduled: 2,
        in_progress: 1,
        completed: 4,
        cancelled: 0,
      },
      justifications: { pending: 2 },
    });
    expect(result.metadata).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(Date),
        generatedBy: { id: 12, fullName: 'Persona Administradora' },
        period: { from: null, to: null },
        appliedFilters: {},
        dataSource: expect.arrayContaining([
          'AFFILIATE',
          'AFFILIATE_REQUEST',
          'RESERVATION',
          'FINANCIAL_MOVEMENT',
          'DONATION',
          'INVENTORY_ITEM',
          'ASSEMBLY',
          'ABSENCE_JUSTIFICATION',
        ]),
        reportVersion: '1.0',
      }),
    );
  });

  it('returns explicit zero counts when grouped domains have no data', async () => {
    prisma.$transaction.mockResolvedValue([0, 0, 0, 0]);
    prisma.absenceJustification.groupBy.mockResolvedValue([]);
    prisma.reservation.groupBy.mockResolvedValue([]);
    prisma.assembly.groupBy.mockResolvedValue([]);
    prisma.donation.groupBy.mockResolvedValue([]);
    financialService.summarizeMovements.mockResolvedValue({
      currency: 'CRC',
      totalIncome: '0.00',
      totalExpenses: '0.00',
      balance: '0.00',
    });
    inventoryReportsService.summary.mockResolvedValue({
      metadata: {},
      data: {
        totalItems: 0,
        activeItems: 0,
        inactiveItems: 0,
        totalCategories: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        activeLoans: 0,
        overdueLoans: 0,
      },
    });

    const result = await service.dashboard();

    expect(result.data.reservations.total).toBe(0);
    expect(result.data.reservations.confirmed).toBe(0);
    expect(result.data.assemblies.in_progress).toBe(0);
    expect(result.data.donations.confirmed).toBe(0);
    expect(result.data.justifications.pending).toBe(0);
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
