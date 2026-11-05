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
  type ReportDataSource,
  type ReportGeneratedBy,
} from '../reporting/report-metadata';
import { AttendanceReportQueryDto } from './dto/report-query.dto';

type DashboardData = Partial<{
  affiliates: { total: number; active: number; inactive: number };
  affiliateRequests: { pending: number };
  reservations: { total: number } & Record<string, number>;
  financial: Awaited<ReturnType<FinancialService['summarizeMovements']>>;
  donations: { total: number } & Record<string, number>;
  inventory: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    activeLoans: number;
    overdueLoans: number;
  };
  assemblies: { total: number } & Record<string, number>;
  justifications: { pending: number };
}>;

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialService: FinancialService,
    private readonly inventoryReportsService: InventoryReportsService,
  ) {}

  async dashboard(
    generatedBy: ReportGeneratedBy | null = null,
    permissionCodes: readonly string[] = [],
  ) {
    const canRead = (capability: string) =>
      permissionCodes.includes(capability);
    const affiliates = canRead('adm.affiliates.read')
      ? Promise.all([
          this.prisma.affiliate.count(),
          this.prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
          this.prisma.affiliate.count({ where: { status: 'INACTIVE' } }),
        ])
      : undefined;
    const affiliateRequests = canRead('padron.application.review')
      ? this.prisma.affiliateRequest.count({ where: { status: 'PENDING' } })
      : undefined;
    const reservations = canRead('res.reservations.read')
      ? this.prisma.reservation.groupBy({
          by: ['status'],
          _count: { _all: true },
        })
      : undefined;
    const financial = canRead('fin.movements.read')
      ? this.financialService.summarizeMovements({})
      : undefined;
    const donations = canRead('don.donations.read')
      ? this.prisma.donation.groupBy({ by: ['status'], _count: { _all: true } })
      : undefined;
    const inventory = canRead('inv.inventory.read')
      ? this.inventoryReportsService.summary()
      : undefined;
    const assemblies =
      canRead('governance.assembly.session') || canRead('adm.assemblies.read')
      ? this.prisma.assembly.groupBy({ by: ['status'], _count: { _all: true } })
      : undefined;
    const justifications = canRead('adm.justifications.read')
      ? this.prisma.absenceJustification.groupBy({
          by: ['status'],
          _count: { _all: true },
        })
      : undefined;

    const [
      affiliateCounts,
      pendingAffiliateRequests,
      reservationGroups,
      financialSummary,
      donationGroups,
      inventoryReport,
      assemblyGroups,
      justificationGroups,
    ] = await Promise.all([
      affiliates,
      affiliateRequests,
      reservations,
      financial,
      donations,
      inventory,
      assemblies,
      justifications,
    ]);
    const dataSource: ReportDataSource[] = [];
    const data: DashboardData = {};

    if (affiliateCounts) {
      const [total, active, inactive] = affiliateCounts;
      data.affiliates = { total, active, inactive };
      dataSource.push('AFFILIATE');
    }
    if (pendingAffiliateRequests !== undefined) {
      data.affiliateRequests = { pending: pendingAffiliateRequests };
      dataSource.push('AFFILIATE_REQUEST');
    }
    if (reservationGroups) {
      data.reservations = this.countStatuses(
        Object.values(ReservationStatus),
        reservationGroups,
      );
      dataSource.push('RESERVATION');
    }
    if (financialSummary) {
      data.financial = financialSummary;
      dataSource.push('FINANCIAL_MOVEMENT');
    }
    if (donationGroups) {
      data.donations = this.countStatuses(
        Object.values(DonationStatus),
        donationGroups,
      );
      dataSource.push('DONATION');
    }
    if (inventoryReport) {
      const summary = inventoryReport.data;
      data.inventory = {
        totalItems: summary.totalItems,
        lowStockItems: summary.lowStockCount,
        outOfStockItems: summary.outOfStockCount,
        activeLoans: summary.activeLoans,
        overdueLoans: summary.overdueLoans,
      };
      dataSource.push('INVENTORY_ITEM', 'INVENTORY_CATEGORY', 'INVENTORY_LOAN');
    }
    if (assemblyGroups) {
      data.assemblies = this.countStatuses(
        Object.values(AssemblyStatus),
        assemblyGroups,
      );
      dataSource.push('ASSEMBLY');
    }
    if (justificationGroups) {
      const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
      for (const group of justificationGroups) {
        counts[group.status] = group._count._all;
      }
      data.justifications = { pending: counts.PENDING };
      dataSource.push('ABSENCE_JUSTIFICATION');
    }

    return {
      metadata: buildReportMetadata({ generatedBy, dataSource }),
      data,
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
        legacyDate:
          q.dateFrom || q.dateTo
            ? { gte: q.dateFrom, lte: q.dateTo }
            : undefined,
      },
      select: {
        id: true,
        title: true,
        legacyDate: true,
        status: true,
        convocations: {
          where: { attendance: { isNot: null } },
          select: { attendance: { select: { status: true } } },
        },
        _count: { select: { convocations: true } },
      },
      orderBy: { legacyDate: 'desc' },
    });
    const data = assemblies.map((a) => {
      const convokedCount = a._count.convocations;
      const attendances = a.convocations.flatMap((item) =>
          item.attendance ? [item.attendance] : [],
        ),
        present = attendances.filter((x) => x.status === 'PRESENT').length,
        absent = attendances.filter((x) => x.status === 'ABSENT').length,
        justified = attendances.filter((x) => x.status === 'JUSTIFIED').length;
      return {
        id: a.id,
        title: a.title,
        date: a.legacyDate,
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
