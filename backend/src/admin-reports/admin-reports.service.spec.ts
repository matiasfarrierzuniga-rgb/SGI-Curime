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

    expect(result.data[0]).toEqual(
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

    expect(result.data).toEqual([
      expect.objectContaining({ convokedCount: 10, attendancePercentage: 10 }),
      expect.objectContaining({ convokedCount: 4, attendancePercentage: 50 }),
    ]);
  });

  it('counts convocations independently of current affiliate status', async () => {
    prisma.assembly.findMany.mockResolvedValue([
      assembly(1, 1, [{ status: AttendanceStatus.PRESENT }]),
    ]);

    const result = await service.attendanceSummary({});

    expect(result.data[0].convokedCount).toBe(1);
    expect(result.data[0].attendancePercentage).toBe(100);
    expect(prisma.assembly.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { convocations: true } },
        }),
      }),
    );
    expect(prisma).not.toHaveProperty('affiliate');
  });

  it('does not count an active affiliate who was not convoked', async () => {
    prisma.assembly.findMany.mockResolvedValue([assembly(1, 0, [])]);

    const result = await service.attendanceSummary({});

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        convokedCount: 0,
        present: 0,
        unrecorded: 0,
      }),
    );
    expect(prisma).not.toHaveProperty('affiliate');
  });

  it('marks a historical assembly without convocations as unavailable', async () => {
    prisma.assembly.findMany.mockResolvedValue([
      assembly(1, 0, [
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
      ]),
    ]);

    const result = await service.attendanceSummary({});

    expect(result.data[0]).toEqual(
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

    expect(result.data[0]).toEqual(
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

    await service.attendanceSummary({ assemblyId: 7, dateFrom, dateTo });

    expect(prisma.assembly.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 7,
          date: { gte: dateFrom, lte: dateTo },
        },
      }),
    );
  });
});
