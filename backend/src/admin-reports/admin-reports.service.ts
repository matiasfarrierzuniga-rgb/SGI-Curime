import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceReportQueryDto } from './dto/report-query.dto';
@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}
  async affiliatesSummary() {
    const [total, active, inactive, pendingRequests] =
      await this.prisma.$transaction([
        this.prisma.affiliate.count(),
        this.prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
        this.prisma.affiliate.count({ where: { status: 'INACTIVE' } }),
        this.prisma.affiliateRequest.count({ where: { status: 'PENDING' } }),
      ]);
    return { total, active, inactive, pendingRequests };
  }
  async attendanceSummary(q: AttendanceReportQueryDto) {
    const totalActive = await this.prisma.affiliate.count({
      where: { status: 'ACTIVE' },
    });
    const assemblies = await this.prisma.assembly.findMany({
      where: {
        id: q.assemblyId,
        date:
          q.dateFrom || q.dateTo
            ? { gte: q.dateFrom, lte: q.dateTo }
            : undefined,
      },
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        attendances: { select: { status: true } },
      },
      orderBy: { date: 'desc' },
    });
    const data = assemblies.map((a) => {
      const present = a.attendances.filter(
          (x) => x.status === 'PRESENT',
        ).length,
        absent = a.attendances.filter((x) => x.status === 'ABSENT').length,
        justified = a.attendances.filter(
          (x) => x.status === 'JUSTIFIED',
        ).length;
      return {
        id: a.id,
        title: a.title,
        date: a.date,
        status: a.status,
        totalActive,
        present,
        absent,
        justified,
        unrecorded: Math.max(0, totalActive - present - absent - justified),
        attendancePercentage:
          totalActive === 0
            ? 0
            : Number(((present / totalActive) * 100).toFixed(2)),
      };
    });
    return {
      assemblies: data.length,
      totals: {
        present: data.reduce((n, x) => n + x.present, 0),
        absent: data.reduce((n, x) => n + x.absent, 0),
        justified: data.reduce((n, x) => n + x.justified, 0),
      },
      data,
    };
  }
  async justificationsSummary() {
    const groups = await this.prisma.absenceJustification.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const g of groups) counts[g.status] = g._count._all;
    return {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      ...counts,
    };
  }
  async sanctionsSummary() {
    const groups = await this.prisma.affiliateSanction.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = { ACTIVE: 0, RESOLVED: 0, REVOKED: 0 };
    for (const g of groups) counts[g.status] = g._count._all;
    return {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      ...counts,
    };
  }
}
