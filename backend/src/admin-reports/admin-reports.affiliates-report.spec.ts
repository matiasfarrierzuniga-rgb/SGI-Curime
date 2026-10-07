import type { Prisma } from '../../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { FinancialService } from '../financial/financial.service';
import type { InventoryReportsService } from '../inventory-reports/inventory-reports.service';
import { AdminReportsService } from './admin-reports.service';

describe('AdminReportsService affiliatesReport', () => {
  const prisma = {
    affiliate: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    affiliateRequest: { count: jest.fn() },
    $transaction: jest.fn((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    ),
  };
  const financialService = {};
  const inventoryReportsService = {};
  let affiliateReportQueries: Prisma.AffiliateFindManyArgs[];
  let affiliateReportResults: unknown[][] | null;
  let service: AdminReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    affiliateReportQueries = [];
    affiliateReportResults = null;
    prisma.affiliate.count.mockResolvedValue(4);
    prisma.affiliate.groupBy.mockResolvedValue([]);
    prisma.affiliateRequest.count.mockResolvedValue(0);
    prisma.affiliate.findMany.mockImplementation(
      (args: Prisma.AffiliateFindManyArgs) => {
        affiliateReportQueries.push(args);
        return Promise.resolve(
          affiliateReportResults
            ? (affiliateReportResults.shift() ?? [])
            : reportRows,
        );
      },
    );
    service = new AdminReportsService(
      prisma as unknown as PrismaService,
      financialService as unknown as FinancialService,
      inventoryReportsService as unknown as InventoryReportsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const now = new Date('2026-10-06T12:00:00.000Z');
  const tomorrow = new Date('2026-10-07T12:00:00.000Z');
  const reportRows = [
    {
      id: 1,
      fullName: 'Ana Pérez',
      identification: '101010101',
      affiliateType: 'Asociado',
      affiliationDate: new Date('2025-01-01T00:00:00.000Z'),
      status: 'ACTIVE',
      person: {
        user: {
          subscriptionExpirationDate: tomorrow,
          role: { name: 'Subscription_L1' },
        },
      },
    },
    {
      id: 2,
      fullName: 'Luis Mora',
      identification: '202020202',
      affiliateType: null,
      affiliationDate: new Date('2024-01-01T00:00:00.000Z'),
      status: 'INACTIVE',
      person: {
        user: {
          subscriptionExpirationDate: now,
          role: { name: 'Subscription_L1' },
        },
      },
    },
    {
      id: 3,
      fullName: 'María Solís',
      identification: '303030303',
      affiliateType: null,
      affiliationDate: new Date('2023-01-01T00:00:00.000Z'),
      status: 'ACTIVE',
      person: null,
    },
    {
      id: 4,
      fullName: 'José Rojas',
      identification: '404040404',
      affiliateType: null,
      affiliationDate: new Date('2022-01-01T00:00:00.000Z'),
      status: 'ACTIVE',
      person: {
        user: {
          subscriptionExpirationDate: tomorrow,
          role: { name: 'Vecino/Afiliado' },
        },
      },
    },
  ];

  it('aggregates affiliate membership metrics and affiliate types in Prisma', async () => {
    jest.useFakeTimers().setSystemTime(now);
    prisma.affiliate.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    prisma.affiliateRequest.count.mockResolvedValueOnce(2);
    prisma.affiliate.groupBy.mockResolvedValueOnce([
      { affiliateType: 'Asociado', _count: { _all: 2 } },
      { affiliateType: 'Beneficiario', _count: { _all: 1 } },
      { affiliateType: null, _count: { _all: 1 } },
    ]);

    const result = await service.affiliatesSummary();

    expect(result.data).toEqual({
      total: 4,
      active: 3,
      inactive: 1,
      pendingRequests: 2,
      memberships: {
        total: 3,
        active: 2,
        expired: 1,
        expiringSoon: 1,
        withoutMembership: 1,
        expirationUnspecified: 0,
      },
      byAffiliateType: [
        { affiliateType: 'Asociado', count: 2 },
        { affiliateType: 'Beneficiario', count: 1 },
        { affiliateType: null, count: 1 },
      ],
    });
    expect(prisma.affiliate.count).toHaveBeenNthCalledWith(4, {
      where: {
        person: {
          is: {
            user: {
              is: { role: { is: { name: 'Subscription_L1' } } },
            },
          },
        },
      },
    });
    expect(prisma.affiliate.count).toHaveBeenNthCalledWith(6, {
      where: {
        person: {
          is: {
            user: {
              is: {
                role: { is: { name: 'Subscription_L1' } },
                subscriptionExpirationDate: { lte: now },
              },
            },
          },
        },
      },
    });
    expect(prisma.affiliate.count).toHaveBeenNthCalledWith(7, {
      where: {
        person: {
          is: {
            user: {
              is: {
                role: { is: { name: 'Subscription_L1' } },
                subscriptionExpirationDate: {
                  gt: now,
                  lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
    });
    expect(prisma.affiliate.count).toHaveBeenNthCalledWith(8, {
      where: {
        NOT: {
          person: {
            is: {
              user: {
                is: { role: { is: { name: 'Subscription_L1' } } },
              },
            },
          },
        },
      },
    });
    expect(prisma.affiliate.count).toHaveBeenNthCalledWith(9, {
      where: {
        person: {
          is: {
            user: {
              is: {
                role: { is: { name: 'Subscription_L1' } },
                subscriptionExpirationDate: null,
              },
            },
          },
        },
      },
    });
    expect(prisma.affiliate.groupBy).toHaveBeenCalledWith({
      by: ['affiliateType'],
      _count: { _all: true },
      orderBy: { affiliateType: 'asc' },
    });
  });

  it('returns zero membership counts and an empty distribution when there are no affiliates', async () => {
    jest.useFakeTimers().setSystemTime(now);
    prisma.affiliate.count.mockResolvedValue(0);
    prisma.affiliateRequest.count.mockResolvedValue(0);
    prisma.affiliate.groupBy.mockResolvedValue([]);

    const result = await service.affiliatesSummary();

    expect(result.data).toEqual({
      total: 0,
      active: 0,
      inactive: 0,
      pendingRequests: 0,
      memberships: {
        total: 0,
        active: 0,
        expired: 0,
        expiringSoon: 0,
        withoutMembership: 0,
        expirationUnspecified: 0,
      },
      byAffiliateType: [],
    });
  });

  it('derives current, expired and unspecified subscription data from linked users', async () => {
    jest.useFakeTimers().setSystemTime(now);

    const result = await service.affiliatesReport(
      { page: 1, limit: 20 },
      { id: 12, fullName: 'Persona Administradora' },
    );

    expect(
      result.data.data.map((affiliate) => [
        affiliate.fullName,
        affiliate.affiliateStatus,
        affiliate.subscriptionExpirationDate,
        affiliate.subscriptionStatus,
        affiliate.daysRemaining,
      ]),
    ).toEqual([
      ['Ana Pérez', 'ACTIVE', tomorrow, 'CURRENT', 1],
      ['Luis Mora', 'INACTIVE', now, 'EXPIRED', 0],
      ['María Solís', 'ACTIVE', null, 'UNSPECIFIED', null],
      ['José Rojas', 'ACTIVE', null, 'UNSPECIFIED', null],
    ]);
    expect(result.data).toMatchObject({ total: 4, page: 1, limit: 20 });
    expect(result.metadata).toMatchObject({
      generatedBy: { id: 12, fullName: 'Persona Administradora' },
      dataSource: 'AFFILIATE',
      appliedFilters: { page: 1, limit: 20 },
    });
    expect(affiliateReportQueries[0]).toMatchObject({
      orderBy: { fullName: 'asc' },
      skip: 0,
      take: 20,
      select: {
        identification: true,
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
      },
    });

    await service.affiliatesReport({
      subscriptionStatus: 'EXPIRED',
      page: 1,
      limit: 20,
    });
    expect(affiliateReportQueries[1].where).toMatchObject({
      person: {
        is: {
          user: {
            is: {
              role: { is: { name: 'Subscription_L1' } },
              subscriptionExpirationDate: { lte: now },
            },
          },
        },
      },
    });

    await service.affiliatesReport({
      subscriptionStatus: 'UNSPECIFIED',
      page: 1,
      limit: 20,
    });
    expect(affiliateReportQueries[2].where).toMatchObject({
      NOT: {
        person: {
          is: {
            user: {
              is: {
                role: { is: { name: 'Subscription_L1' } },
                subscriptionExpirationDate: { not: null },
              },
            },
          },
        },
      },
    });
  });

  it('returns the complete affiliate contract and classifies upcoming, expired and missing expirations', async () => {
    jest.useFakeTimers().setSystemTime(now);
    const expiringSoon = new Date('2026-10-21T12:00:00.000Z');
    const activeLater = new Date('2026-12-31T12:00:00.000Z');
    const affiliates = [
      {
        ...reportRows[0],
        affiliationDate: new Date('2020-03-10T00:00:00.000Z'),
        person: {
          user: {
            subscriptionExpirationDate: activeLater,
            role: { name: 'Subscription_L1' },
          },
        },
      },
      {
        ...reportRows[1],
        id: 5,
        fullName: 'Sofía Vega',
        identification: '505050505',
        affiliateType: 'Beneficiario',
        affiliationDate: new Date('2022-04-11T00:00:00.000Z'),
        status: 'ACTIVE',
        person: {
          user: {
            subscriptionExpirationDate: expiringSoon,
            role: { name: 'Subscription_L1' },
          },
        },
      },
      reportRows[1],
      reportRows[2],
      {
        ...reportRows[1],
        id: 6,
        fullName: 'Elena Ruiz',
        identification: '606060606',
        affiliateType: null,
        person: {
          user: {
            subscriptionExpirationDate: null,
            role: { name: 'Subscription_L1' },
          },
        },
      },
    ];
    affiliateReportResults = [affiliates];
    prisma.affiliate.count.mockResolvedValue(affiliates.length);

    const result = await service.affiliatesReport({ page: 1, limit: 20 });

    expect(
      result.data.data.map((affiliate) => ({
        fullName: affiliate.fullName,
        identification: affiliate.identification,
        affiliateType: affiliate.affiliateType,
        affiliateStatus: affiliate.affiliateStatus,
        affiliationDate: affiliate.affiliationDate,
        subscriptionExpirationDate: affiliate.subscriptionExpirationDate,
        subscriptionStatus: affiliate.subscriptionStatus,
        daysRemaining: affiliate.daysRemaining,
      })),
    ).toEqual([
      {
        fullName: 'Ana Pérez',
        identification: '101010101',
        affiliateType: 'Asociado',
        affiliateStatus: 'ACTIVE',
        affiliationDate: new Date('2020-03-10T00:00:00.000Z'),
        subscriptionExpirationDate: activeLater,
        subscriptionStatus: 'CURRENT',
        daysRemaining: 86,
      },
      {
        fullName: 'Sofía Vega',
        identification: '505050505',
        affiliateType: 'Beneficiario',
        affiliateStatus: 'ACTIVE',
        affiliationDate: new Date('2022-04-11T00:00:00.000Z'),
        subscriptionExpirationDate: expiringSoon,
        subscriptionStatus: 'CURRENT',
        daysRemaining: 15,
      },
      {
        fullName: 'Luis Mora',
        identification: '202020202',
        affiliateType: null,
        affiliateStatus: 'INACTIVE',
        affiliationDate: new Date('2024-01-01T00:00:00.000Z'),
        subscriptionExpirationDate: now,
        subscriptionStatus: 'EXPIRED',
        daysRemaining: 0,
      },
      {
        fullName: 'María Solís',
        identification: '303030303',
        affiliateType: null,
        affiliateStatus: 'ACTIVE',
        affiliationDate: new Date('2023-01-01T00:00:00.000Z'),
        subscriptionExpirationDate: null,
        subscriptionStatus: 'UNSPECIFIED',
        daysRemaining: null,
      },
      {
        fullName: 'Elena Ruiz',
        identification: '606060606',
        affiliateType: null,
        affiliateStatus: 'INACTIVE',
        affiliationDate: new Date('2024-01-01T00:00:00.000Z'),
        subscriptionExpirationDate: null,
        subscriptionStatus: 'UNSPECIFIED',
        daysRemaining: null,
      },
    ]);
    expect(result.data).toMatchObject({
      total: 5,
      page: 1,
      limit: 20,
    });
  });

  it('returns an empty paginated report when there are no affiliates and no filters', async () => {
    affiliateReportResults = [[]];
    prisma.affiliate.count.mockResolvedValue(0);

    const result = await service.affiliatesReport({ page: 1, limit: 20 });

    expect(result.data).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    expect(affiliateReportQueries[0]).toMatchObject({
      where: {
        affiliateType: undefined,
        status: undefined,
        affiliationDate: undefined,
        OR: undefined,
      },
      skip: 0,
      take: 20,
    });
    expect(prisma.affiliate.count).toHaveBeenCalledWith({
      where: affiliateReportQueries[0]?.where,
    });
  });

  it('returns no rows when the requested affiliate filters have no matches', async () => {
    jest.useFakeTimers().setSystemTime(now);
    affiliateReportResults = [[]];
    prisma.affiliate.count.mockResolvedValue(0);

    const result = await service.affiliatesReport({
      search: 'No existe',
      affiliateType: 'Beneficiario',
      affiliateStatus: 'ACTIVE',
      subscriptionStatus: 'CURRENT',
      page: 1,
      limit: 20,
    });

    expect(result.data).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    expect(affiliateReportQueries[0]?.where).toMatchObject({
      OR: [
        { fullName: { contains: 'No existe', mode: 'insensitive' } },
        { identification: { contains: 'No existe', mode: 'insensitive' } },
      ],
      affiliateType: { contains: 'Beneficiario', mode: 'insensitive' },
      status: 'ACTIVE',
      person: {
        is: {
          user: {
            is: {
              role: { is: { name: 'Subscription_L1' } },
              subscriptionExpirationDate: { gt: now },
            },
          },
        },
      },
    });
    expect(prisma.affiliate.count).toHaveBeenCalledWith({
      where: affiliateReportQueries[0]?.where,
    });
  });

  it('exports all matching affiliates in safe UTF-8 CSV batches, ignoring page limits', async () => {
    const rows = Array.from({ length: 501 }, (_, index) => ({
      ...reportRows[0],
      id: index + 1,
      fullName:
        index === 0 ? '=HYPERLINK("https://example.test")' : 'Ana, "Pérez"',
    }));
    affiliateReportResults = [rows, []];

    const chunks: string[] = [];
    for await (const chunk of service.exportAffiliatesCsv({
      page: 9,
      limit: 1,
      search: 'Ana',
      subscriptionStatus: 'CURRENT',
    })) {
      if (typeof chunk !== 'string') {
        throw new TypeError('Expected CSV stream chunks to be strings');
      }
      chunks.push(chunk);
    }
    const csv = chunks.join('');

    expect(csv.startsWith('\uFEFF"Nombre completo"')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""https://example.test"")"`);
    expect(csv).toContain('"Ana, ""Pérez"""');
    expect(csv.split('\r\n')).toHaveLength(503);
    const firstBatch = affiliateReportQueries[0];
    const secondBatch = affiliateReportQueries[1];
    expect(firstBatch?.skip).toBe(0);
    expect(firstBatch?.take).toBe(500);
    expect(firstBatch?.where?.OR).toEqual([
      { fullName: { contains: 'Ana', mode: 'insensitive' } },
      { identification: { contains: 'Ana', mode: 'insensitive' } },
    ]);
    expect(firstBatch?.where?.person).toBeDefined();
    expect(secondBatch?.skip).toBe(500);
    expect(secondBatch?.take).toBe(500);
  });

  it('exports only the CSV header when no affiliates match', async () => {
    affiliateReportResults = [[]];

    const chunks: string[] = [];
    for await (const chunk of service.exportAffiliatesCsv({
      page: 1,
      limit: 20,
    })) {
      if (typeof chunk !== 'string') {
        throw new TypeError('Expected CSV stream chunks to be strings');
      }
      chunks.push(chunk);
    }

    expect(chunks.join('').split('\r\n')).toHaveLength(2);
    expect(affiliateReportQueries[0]).toMatchObject({
      skip: 0,
      take: 500,
    });
  });

  it('applies search, affiliation, status, date, page and subscription filters in Prisma', async () => {
    jest.useFakeTimers().setSystemTime(now);
    const dateFrom = new Date('2026-01-01T00:00:00.000Z');
    const dateTo = new Date('2026-12-31T23:59:59.999Z');
    affiliateReportResults = [[reportRows[0]]];
    prisma.affiliate.count.mockResolvedValue(1);

    const result = await service.affiliatesReport({
      search: 'Ana',
      affiliateType: 'Asociado',
      affiliateStatus: 'ACTIVE',
      subscriptionStatus: 'CURRENT',
      dateFrom,
      dateTo,
      page: 2,
      limit: 10,
    });

    expect(affiliateReportQueries[0]).toMatchObject({
      where: {
        OR: [
          { fullName: { contains: 'Ana', mode: 'insensitive' } },
          { identification: { contains: 'Ana', mode: 'insensitive' } },
        ],
        affiliateType: { contains: 'Asociado', mode: 'insensitive' },
        status: 'ACTIVE',
        affiliationDate: { gte: dateFrom, lte: dateTo },
        person: {
          is: {
            user: {
              is: {
                role: { is: { name: 'Subscription_L1' } },
                subscriptionExpirationDate: { gt: now },
              },
            },
          },
        },
      },
      skip: 10,
      take: 10,
    });
    expect(result.data.data.map((affiliate) => affiliate.fullName)).toEqual([
      'Ana Pérez',
    ]);
    expect(result.data.total).toBe(1);
    expect(prisma.affiliate.count).toHaveBeenCalledWith({
      where: affiliateReportQueries[0]?.where,
    });
  });

  it('rejects reversed affiliation dates before querying', async () => {
    await expect(
      service.affiliatesReport({
        dateFrom: new Date('2026-12-31T00:00:00.000Z'),
        dateTo: new Date('2026-01-01T00:00:00.000Z'),
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow(
      'La fecha inicial no puede ser posterior a la fecha final',
    );
    expect(prisma.affiliate.findMany).not.toHaveBeenCalled();
    expect(prisma.affiliate.count).not.toHaveBeenCalled();
  });
});
