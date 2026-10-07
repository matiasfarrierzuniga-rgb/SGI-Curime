import { BadRequestException, Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';
import {
  AssemblyStatus,
  DonationStatus,
  Prisma,
  ReservationStatus,
} from '../../generated/prisma/client';
import { FinancialService } from '../financial/financial.service';
import { InventoryReportsService } from '../inventory-reports/inventory-reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { isSubscriptionExpired } from '../auth/domain/policies/subscription-expiration.policy';
import {
  buildReportMetadata,
  type ReportGeneratedBy,
} from '../reporting/report-metadata';
import {
  AffiliateReportQueryDto,
  AttendanceReportQueryDto,
  type SubscriptionReportStatus,
} from './dto/report-query.dto';

const SUBSCRIPTION_ROLE = 'Subscription_L1';
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_EXPIRING_WITHIN_DAYS = 30;
const AFFILIATE_EXPORT_BATCH_SIZE = 500;
const affiliateReportSelect = {
  id: true,
  fullName: true,
  identification: true,
  affiliateType: true,
  affiliationDate: true,
  status: true,
  person: {
    select: {
      user: {
        select: {
          subscriptionExpirationDate: true,
          role: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.AffiliateSelect;

type AffiliateReportRecord = Prisma.AffiliateGetPayload<{
  select: typeof affiliateReportSelect;
}>;

function mapAffiliateReportRow(affiliate: AffiliateReportRecord, now: Date) {
  const user = affiliate.person?.user;
  const roleName = user?.role.name;
  const expirationDate =
    user && roleName === SUBSCRIPTION_ROLE
      ? user.subscriptionExpirationDate
      : null;
  const subscriptionStatus: SubscriptionReportStatus =
    expirationDate === null
      ? 'UNSPECIFIED'
      : isSubscriptionExpired(roleName ?? '', expirationDate, now)
        ? 'EXPIRED'
        : 'CURRENT';

  return {
    id: affiliate.id,
    fullName: affiliate.fullName,
    identification: affiliate.identification,
    affiliateType: affiliate.affiliateType,
    affiliationDate: affiliate.affiliationDate,
    affiliateStatus: affiliate.status,
    subscriptionExpirationDate: expirationDate,
    subscriptionStatus,
    daysRemaining:
      expirationDate === null
        ? null
        : Math.max(
            0,
            Math.ceil(
              (expirationDate.getTime() - now.getTime()) / DAY_IN_MILLISECONDS,
            ),
          ),
  };
}

function csvCell(value: string | number | null) {
  const text = String(value ?? '');
  const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function csvDate(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? '';
}

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
    const now = new Date();
    const expiringBefore = new Date(
      now.getTime() + SUBSCRIPTION_EXPIRING_WITHIN_DAYS * DAY_IN_MILLISECONDS,
    );
    const subscriptionRoleFilter: Prisma.AffiliateWhereInput = {
      person: {
        is: {
          user: {
            is: { role: { is: { name: SUBSCRIPTION_ROLE } } },
          },
        },
      },
    };
    const [
      [
        total,
        active,
        inactive,
        pendingRequests,
        totalMemberships,
        activeMemberships,
        expiredMemberships,
        expiringMemberships,
        affiliatesWithoutMembership,
        membershipsWithoutExpiration,
      ],
      affiliateTypes,
    ] = await Promise.all([
      this.prisma.$transaction([
        this.prisma.affiliate.count(),
        this.prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
        this.prisma.affiliate.count({ where: { status: 'INACTIVE' } }),
        this.prisma.affiliateRequest.count({ where: { status: 'PENDING' } }),
        this.prisma.affiliate.count({ where: subscriptionRoleFilter }),
        this.prisma.affiliate.count({
          where: {
            ...subscriptionRoleFilter,
            person: {
              is: {
                user: {
                  is: {
                    role: { is: { name: SUBSCRIPTION_ROLE } },
                    subscriptionExpirationDate: { gt: now },
                  },
                },
              },
            },
          },
        }),
        this.prisma.affiliate.count({
          where: {
            ...subscriptionRoleFilter,
            person: {
              is: {
                user: {
                  is: {
                    role: { is: { name: SUBSCRIPTION_ROLE } },
                    subscriptionExpirationDate: { lte: now },
                  },
                },
              },
            },
          },
        }),
        this.prisma.affiliate.count({
          where: {
            ...subscriptionRoleFilter,
            person: {
              is: {
                user: {
                  is: {
                    role: { is: { name: SUBSCRIPTION_ROLE } },
                    subscriptionExpirationDate: {
                      gt: now,
                      lte: expiringBefore,
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.affiliate.count({
          where: { NOT: subscriptionRoleFilter },
        }),
        this.prisma.affiliate.count({
          where: {
            ...subscriptionRoleFilter,
            person: {
              is: {
                user: {
                  is: {
                    role: { is: { name: SUBSCRIPTION_ROLE } },
                    subscriptionExpirationDate: null,
                  },
                },
              },
            },
          },
        }),
      ]),
      this.prisma.affiliate.groupBy({
        by: ['affiliateType'],
        _count: { _all: true },
        orderBy: { affiliateType: 'asc' },
      }),
    ]);
    return {
      metadata: buildReportMetadata({
        generatedBy,
        dataSource: 'AFFILIATE',
      }),
      data: {
        total,
        active,
        inactive,
        pendingRequests,
        memberships: {
          total: totalMemberships,
          active: activeMemberships,
          expired: expiredMemberships,
          expiringSoon: expiringMemberships,
          withoutMembership: affiliatesWithoutMembership,
          expirationUnspecified: membershipsWithoutExpiration,
        },
        byAffiliateType: affiliateTypes.map((group) => ({
          affiliateType: group.affiliateType,
          count: group._count._all,
        })),
      },
    };
  }

  async affiliatesReport(
    q: AffiliateReportQueryDto,
    generatedBy: ReportGeneratedBy | null = null,
  ) {
    this.validateAffiliateReportDateRange(q);

    const now = new Date();
    const where = this.affiliateReportWhere(q, now);
    const [affiliates, total] = await Promise.all([
      this.prisma.affiliate.findMany({
        where,
        select: affiliateReportSelect,
        orderBy: { fullName: 'asc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.prisma.affiliate.count({ where }),
    ]);

    const data = affiliates.map((affiliate) =>
      mapAffiliateReportRow(affiliate, now),
    );

    return {
      metadata: buildReportMetadata({
        generatedBy,
        dateFrom: q.dateFrom,
        dateTo: q.dateTo,
        filters: {
          search: q.search,
          affiliateType: q.affiliateType,
          affiliateStatus: q.affiliateStatus,
          subscriptionStatus: q.subscriptionStatus,
          dateFrom: q.dateFrom,
          dateTo: q.dateTo,
          page: q.page,
          limit: q.limit,
        },
        dataSource: 'AFFILIATE',
      }),
      data: { data, total, page: q.page, limit: q.limit },
    };
  }

  exportAffiliatesCsv(q: AffiliateReportQueryDto): Readable {
    this.validateAffiliateReportDateRange(q);
    return Readable.from(this.iterateAffiliateCsv(q));
  }

  private async *iterateAffiliateCsv(
    q: AffiliateReportQueryDto,
  ): AsyncGenerator<string> {
    const now = new Date();
    const where = this.affiliateReportWhere(q, now);
    const headers = [
      'Nombre completo',
      'Identificación',
      'Tipo de afiliado',
      'Estado del afiliado',
      'Estado de membresía',
      'Fecha de afiliación',
      'Fecha de vencimiento',
      'Días restantes',
    ];
    yield `\uFEFF${headers.map(csvCell).join(',')}\r\n`;

    for (let skip = 0; ; skip += AFFILIATE_EXPORT_BATCH_SIZE) {
      const affiliates = await this.prisma.affiliate.findMany({
        where,
        select: affiliateReportSelect,
        orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
        skip,
        take: AFFILIATE_EXPORT_BATCH_SIZE,
      });
      if (affiliates.length === 0) return;

      for (const affiliate of affiliates) {
        const row = mapAffiliateReportRow(affiliate, now);
        yield `${[
          row.fullName,
          row.identification,
          row.affiliateType ?? '',
          row.affiliateStatus === 'ACTIVE' ? 'Activo' : 'Inactivo',
          row.subscriptionStatus === 'CURRENT'
            ? 'Vigente'
            : row.subscriptionStatus === 'EXPIRED'
              ? 'Vencida'
              : 'Sin vencimiento registrado',
          csvDate(row.affiliationDate),
          csvDate(row.subscriptionExpirationDate),
          row.daysRemaining ?? '',
        ]
          .map(csvCell)
          .join(',')}\r\n`;
      }

      if (affiliates.length < AFFILIATE_EXPORT_BATCH_SIZE) return;
    }
  }

  private validateAffiliateReportDateRange(q: AffiliateReportQueryDto) {
    if (q.dateFrom && q.dateTo && q.dateFrom > q.dateTo) {
      throw new BadRequestException(
        'La fecha inicial no puede ser posterior a la fecha final',
      );
    }
  }

  private affiliateReportWhere(
    q: AffiliateReportQueryDto,
    now: Date,
  ): Prisma.AffiliateWhereInput {
    const where: Prisma.AffiliateWhereInput = {
      affiliateType: q.affiliateType
        ? { contains: q.affiliateType, mode: 'insensitive' }
        : undefined,
      status: q.affiliateStatus,
      affiliationDate:
        q.dateFrom || q.dateTo ? { gte: q.dateFrom, lte: q.dateTo } : undefined,
      OR: q.search
        ? [
            { fullName: { contains: q.search, mode: 'insensitive' } },
            { identification: { contains: q.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    if (q.subscriptionStatus === 'CURRENT') {
      where.person = {
        is: {
          user: {
            is: {
              role: { is: { name: SUBSCRIPTION_ROLE } },
              subscriptionExpirationDate: { gt: now },
            },
          },
        },
      };
    } else if (q.subscriptionStatus === 'EXPIRED') {
      where.person = {
        is: {
          user: {
            is: {
              role: { is: { name: SUBSCRIPTION_ROLE } },
              subscriptionExpirationDate: { lte: now },
            },
          },
        },
      };
    } else if (q.subscriptionStatus === 'UNSPECIFIED') {
      where.NOT = {
        person: {
          is: {
            user: {
              is: {
                role: { is: { name: SUBSCRIPTION_ROLE } },
                subscriptionExpirationDate: { not: null },
              },
            },
          },
        },
      };
    }

    return where;
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
