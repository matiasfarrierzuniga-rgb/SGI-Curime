import { NotFoundException } from '@nestjs/common';
import { AuditService, sanitizeAuditDetails } from './audit.service';

describe('AuditService', () => {
  const prisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new AuditService(prisma as never);
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.auditLog.create.mockResolvedValue({ id: 1 });
    prisma.auditLog.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.auditLog.count.mockResolvedValue(1);
    prisma.$transaction.mockImplementation((items: Promise<unknown>[]) =>
      Promise.all(items),
    );
  });

  it('creates an audit log with sanitized details', async () => {
    await service.log({
      userId: 1,
      action: 'TEST',
      module: 'TEST',
      details: {
        safe: 'ok',
        password: 'bad',
        nested: { tokenHash: 'bad', roleId: 2 },
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        action: 'TEST',
        module: 'TEST',
        details: { safe: 'ok', nested: { roleId: 2 } },
        entityId: undefined,
      },
    });
  });
  it('sanitizes secret-shaped fields recursively', () => {
    expect(
      sanitizeAuditDetails({
        passwordHash: 'x',
        JWT_SECRET: 'x',
        database_url: 'x',
        admin_password: 'x',
        values: [{ token: 'x', id: 1 }],
      }),
    ).toEqual({ values: [{ id: 1 }] });
  });
  it('preserves JSON primitives and serializes bigint values', () => {
    expect(sanitizeAuditDetails('value')).toBe('value');
    expect(sanitizeAuditDetails(42)).toBe(42);
    expect(sanitizeAuditDetails(true)).toBe(true);
    expect(sanitizeAuditDetails(42n)).toBe('42');
    expect(sanitizeAuditDetails(null)).toBeUndefined();
    expect(sanitizeAuditDetails(undefined)).toBeUndefined();
  });
  it('normalizes arrays, nested objects and dates', () => {
    expect(
      sanitizeAuditDetails({
        values: [1, undefined, { active: false }],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).toEqual({
      values: [1, null, { active: false }],
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
  it('omits unsupported values and safely replaces nested ones', () => {
    expect(sanitizeAuditDetails(Symbol('value'))).toBeUndefined();
    expect(sanitizeAuditDetails(() => 'value')).toBeUndefined();
    expect(sanitizeAuditDetails(Number.NaN)).toBeUndefined();
    expect(sanitizeAuditDetails(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(
      sanitizeAuditDetails({ symbol: Symbol('value'), invalid: Number.NaN }),
    ).toEqual({ symbol: null, invalid: null });
  });
  it('replaces circular references without rejecting the audit write', () => {
    const circular: Record<string, unknown> = { id: 1 };
    circular.self = circular;

    expect(sanitizeAuditDetails(circular)).toEqual({ id: 1, self: null });
  });
  it('lists with filters and pagination', async () => {
    const result = await service.findAll({
      page: 2,
      limit: 5,
      userId: 1,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      dateFrom: '2026-01-01T00:00:00Z',
      dateTo: '2026-12-31T23:59:59Z',
    });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        action: 'LOGIN_SUCCESS',
        module: 'AUTH',
        createdAt: {
          gte: new Date('2026-01-01T00:00:00Z'),
          lte: new Date('2026-12-31T23:59:59Z'),
        },
      },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
    expect(result).toEqual({ data: [{ id: 1 }], total: 1, page: 2, limit: 5 });
  });
  it('returns detail and 404 when absent', async () => {
    prisma.auditLog.findUnique.mockResolvedValueOnce({ id: 1 });
    await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
    prisma.auditLog.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(2)).rejects.toBeInstanceOf(NotFoundException);
  });
});
