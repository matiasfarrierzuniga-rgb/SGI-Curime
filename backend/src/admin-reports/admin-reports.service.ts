import { Injectable } from '@nestjs/common';
import {
  AssemblyStatus,
  DonationStatus,
  ReservationStatus,
} from '../../generated/prisma/client';
import { FinancialService } from '../financial/financial.service';
import { InventoryReportsService } from '../inventory-reports/inventory-reports.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildReportMetadata,
  type ReportGeneratedBy,
} from '../reporting/report-metadata';
import { AttendanceReportQueryDto } from './dto/report-query.dto';
@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialService: FinancialService,
    private readonly inventoryReportsService: InventoryReportsService,
  ) {}

  async dashboard(generatedBy: ReportGeneratedBy | null = null) {
    const [
      affiliatesReport,
      financial,
      inventoryReport,
      justificationsReport,
      reservationGroups,
      assemblyGroups,
      donationGroups,
    ] = await Promise.all([
      this.affiliatesSummary(),
      this.financialService.summarizeMovements({}),
      this.inventoryReportsService.summary(),
      this.justificationsSummary(),
      this.prisma.reservation.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.assembly.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.donation.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const reservations = this.countStatuses(
      Object.values(ReservationStatus),
      reservationGroups,
    );
    const assemblies = this.countStatuses(
      Object.values(AssemblyStatus),
      assemblyGroups,
    );
    const donations = this.countStatuses(
      Object.values(DonationStatus),
      donationGroups,
    );
    const { pendingRequests, ...affiliates } = affiliatesReport.data;
    const inventory = inventoryReport.data;

    return {
      metadata: buildReportMetadata({
        generatedBy,
        dataSource: [
          'AFFILIATE',
          'AFFILIATE_REQUEST',
          'RESERVATION',
          'FINANCIAL_MOVEMENT',
          'DONATION',
          'INVENTORY_ITEM',
          'INVENTORY_CATEGORY',
          'INVENTORY_LOAN',
          'ASSEMBLY',
          'ABSENCE_JUSTIFICATION',
        ],
      }),
      data: {
        affiliates,
        affiliateRequests: { pending: pendingRequests },
        reservations,
        financial,
        donations,
        inventory: {
          totalItems: inventory.totalItems,
          lowStockItems: inventory.lowStockCount,
          outOfStockItems: inventory.outOfStockCount,
          activeLoans: inventory.activeLoans,
          overdueLoans: inventory.overdueLoans,
        },
        assemblies,
        justifications: { pending: justificationsReport.data.PENDING },
      },
    };
  }
  async affiliatesSummary(generatedBy: ReportGeneratedBy | null = null) {
    const [total, active, inactive, pendingRequests] =
      await this.prisma.$transaction([
        this.prisma.affiliate.count(),
        this.prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
        this.prisma.affiliate.count({ where: { status: 'INACTIVE' } }),
        this.prisma.affiliateRequest.count({ where: { status: 'PENDING' } }),
      ]);
    return {
      metadata: buildReportMetadata({
        generatedBy,
        dataSource: 'AFFILIATE',
      }),
      data: { total, active, inactive, pendingRequests },
    };
  }
  async attendanceSummary(
    q: AttendanceReportQueryDto,
    generatedBy: ReportGeneratedBy | null = null,
  ) {
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
        _count: { select: { convocations: true } },
      },
      orderBy: { date: 'desc' },
    });
    const data = assemblies.map((a) => {
      const convokedCount = a._count.convocations;
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
        convokedCount,
        denominatorAvailable: convokedCount > 0,
        present,
        absent,
        justified,
        unrecorded: Math.max(0, convokedCount - present - absent - justified),
        attendancePercentage:
          convokedCount === 0
            ? null
            : Number(((present / convokedCount) * 100).toFixed(2)),
      };
    });
    return {
      metadata: buildReportMetadata({
        generatedBy,
        dateFrom: q.dateFrom,
        dateTo: q.dateTo,
        filters: {
          assemblyId: q.assemblyId,
          dateFrom: q.dateFrom,
          dateTo: q.dateTo,
        },
        dataSource: 'ASSEMBLY_CONVOCATION',
      }),
      data: {
        assemblies: data.length,
        totals: {
          present: data.reduce((n, x) => n + x.present, 0),
          absent: data.reduce((n, x) => n + x.absent, 0),
          justified: data.reduce((n, x) => n + x.justified, 0),
        },
        data,
      },
    };
  }
  async justificationsSummary(generatedBy: ReportGeneratedBy | null = null) {
    const groups = await this.prisma.absenceJustification.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const g of groups) counts[g.status] = g._count._all;
    return {
      metadata: buildReportMetadata({
        generatedBy,
        dataSource: 'ABSENCE_JUSTIFICATION',
      }),
      data: {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        ...counts,
      },
    };
  }
  async sanctionsSummary(generatedBy: ReportGeneratedBy | null = null) {
    const groups = await this.prisma.affiliateSanction.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = { ACTIVE: 0, RESOLVED: 0, REVOKED: 0 };
    for (const g of groups) counts[g.status] = g._count._all;
    return {
      metadata: buildReportMetadata({ generatedBy, dataSource: 'SANCTION' }),
      data: {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        ...counts,
      },
    };
  }

  private countStatuses<T extends string>(
    statuses: T[],
    groups: Array<{ status: T; _count: { _all: number } }>,
  ): { total: number } & Record<Lowercase<T>, number> {
    const counts = Object.fromEntries(
      statuses.map((status) => [status.toLowerCase(), 0]),
    ) as Record<Lowercase<T>, number>;
    for (const group of groups) {
      counts[group.status.toLowerCase() as Lowercase<T>] = group._count._all;
    }
    return {
      total: statuses.reduce(
        (sum, status) => sum + counts[status.toLowerCase() as Lowercase<T>],
        0,
      ),
      ...counts,
    };
  }
}
