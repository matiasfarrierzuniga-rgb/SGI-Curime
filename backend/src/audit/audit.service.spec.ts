import { NotFoundException } from '@nestjs/common';
import { AuditService, sanitizeAuditDetails } from './audit.service';

describe('AuditService', () => {
  const prisma = { auditLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() }, $transaction: jest.fn() };
  const service = new AuditService(prisma as never);
  beforeEach(() => { jest.clearAllMocks(); prisma.auditLog.create.mockResolvedValue({ id: 1 }); prisma.auditLog.findMany.mockResolvedValue([{ id: 1 }]); prisma.auditLog.count.mockResolvedValue(1); prisma.$transaction.mockImplementation((items: Promise<unknown>[]) => Promise.all(items)); });

  it('creates an audit log with sanitized details', async () => {
    await service.log({ userId: 1, action: 'TEST', module: 'TEST', details: { safe: 'ok', password: 'bad', nested: { tokenHash: 'bad', roleId: 2 } } });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ details: { safe: 'ok', nested: { roleId: 2 } } }) });
  });
  it('sanitizes secret-shaped fields recursively', () => {
    expect(sanitizeAuditDetails({ passwordHash: 'x', JWT_SECRET: 'x', values: [{ token: 'x', id: 1 }] })).toEqual({ values: [{ id: 1 }] });
  });
  it('lists with filters and pagination', async () => {
    const result = await service.findAll({ page: 2, limit: 5, userId: 1, action: 'LOGIN_SUCCESS', module: 'AUTH', dateFrom: '2026-01-01T00:00:00Z', dateTo: '2026-12-31T23:59:59Z' });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 5, orderBy: { createdAt: 'desc' }, where: expect.objectContaining({ userId: 1, action: 'LOGIN_SUCCESS', module: 'AUTH' }) }));
    expect(result).toEqual({ data: [{ id: 1 }], total: 1, page: 2, limit: 5 });
  });
  it('returns detail and 404 when absent', async () => {
    prisma.auditLog.findUnique.mockResolvedValueOnce({ id: 1 });
    await expect(service.findOne(1)).resolves.toEqual({ id: 1 });
    prisma.auditLog.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(2)).rejects.toBeInstanceOf(NotFoundException);
  });
});
