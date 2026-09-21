import { AuditAction } from '../audit/audit-actions';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { InstitutionalProfileService } from './institutional-profile.service';

const emptyProfile = {
  id: 1, legalName: null, legalIdentification: null, dinadecoRegistrationCode: null,
  dinadecoRegion: null, organizationType: null, province: null, canton: null,
  district: null, locality: null, correspondenceAddress: null, phone: null,
  telefax: null, email: null, createdAt: new Date('2026-09-20T00:00:00Z'),
  updatedAt: new Date('2026-09-20T00:00:00Z'),
};

describe('InstitutionalProfileService', () => {
  const tx = { institutionalProfile: { findUniqueOrThrow: jest.fn(), update: jest.fn() }, auditLog: { create: jest.fn() } };
  const prisma = {
    institutionalProfile: { findUniqueOrThrow: jest.fn() },
    $transaction: jest.fn((work: (client: typeof tx) => unknown) => work(tx)),
  };
  const audit = { log: jest.fn() };
  const service = new InstitutionalProfileService(prisma as unknown as PrismaService, audit as unknown as AuditService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.institutionalProfile.findUniqueOrThrow.mockResolvedValue(emptyProfile);
    tx.institutionalProfile.findUniqueOrThrow.mockResolvedValue(emptyProfile);
    tx.institutionalProfile.update.mockImplementation(({ data }) => Promise.resolve({ ...emptyProfile, ...data }));
    audit.log.mockResolvedValue({ id: 1 });
  });

  it('returns the singleton with nullable fields', async () => {
    await expect(service.get()).resolves.toEqual(emptyProfile);
    expect(prisma.institutionalProfile.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('updates only supplied fields and audits changed field names atomically', async () => {
    const result = await service.update(
      { legalName: 'Asociación de Desarrollo Integral de Prueba', email: 'contacto@prueba.test' },
      7,
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );

    expect(result).toMatchObject({ id: 1, canton: null, legalName: 'Asociación de Desarrollo Integral de Prueba' });
    expect(tx.institutionalProfile.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { legalName: 'Asociación de Desarrollo Integral de Prueba', email: 'contacto@prueba.test' },
    });
    expect(audit.log).toHaveBeenCalledWith({
      userId: 7,
      action: AuditAction.INSTITUTIONAL_PROFILE_UPDATED,
      module: 'ADMINISTRATIVE',
      entityType: 'InstitutionalProfile',
      entityId: 1,
      details: { changedFields: ['legalName', 'email'] },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    }, tx);
  });

  it('allows nullable fields to be cleared', async () => {
    tx.institutionalProfile.findUniqueOrThrow.mockResolvedValue({ ...emptyProfile, phone: '+506 2222 2222' });
    await service.update({ phone: null }, 7);
    expect(tx.institutionalProfile.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { phone: null } });
  });

  it('audits a no-op patch without creating another organization', async () => {
    const result = await service.update({}, 7);
    expect(result).toEqual(emptyProfile);
    expect(tx.institutionalProfile.update).toHaveBeenCalledWith({ where: { id: 1 }, data: {} });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ details: { changedFields: [] } }), tx);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
