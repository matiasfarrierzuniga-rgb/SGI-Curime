import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AUTH_REPOSITORY } from '../src/auth/application/ports/auth-repository.port';
import { AUDIT_PORT } from '../src/auth/application/ports/audit.port';
import type { AuthAccount } from '../src/auth/domain/entities/auth-account';
import { InstitutionalProfileModule } from '../src/institutional-profile/institutional-profile.module';
import { PrismaService } from '../src/prisma/prisma.service';

const profile = { id: 1, legalName: null, legalIdentification: null, dinadecoRegistrationCode: null, dinadecoRegion: null, organizationType: null, province: null, canton: null, district: null, locality: null, correspondenceAddress: null, phone: null, telefax: null, email: null, createdAt: new Date('2026-09-20T00:00:00Z'), updatedAt: new Date('2026-09-20T00:00:00Z') };

describe('Institutional profile access (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let account: AuthAccount;
  const tx = { institutionalProfile: { findUniqueOrThrow: jest.fn(), update: jest.fn() }, auditLog: { create: jest.fn() } };
  const prisma = {
    institutionalProfile: { findUniqueOrThrow: jest.fn() },
    $transaction: jest.fn((work: (client: typeof tx) => unknown) => work(tx)),
  };
  const authRepository = { findCredentialsById: jest.fn(() => Promise.resolve(account)), clearLockout: jest.fn() };

  beforeEach(async () => {
    account = authAccount('Administrador');
    prisma.institutionalProfile.findUniqueOrThrow.mockResolvedValue(profile);
    tx.institutionalProfile.findUniqueOrThrow.mockResolvedValue(profile);
    tx.institutionalProfile.update.mockImplementation(({ data }) => Promise.resolve({ ...profile, ...data }));
    tx.auditLog.create.mockResolvedValue({ id: 1 });
    const module = await Test.createTestingModule({ imports: [InstitutionalProfileModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(AUTH_REPOSITORY).useValue(authRepository)
      .overrideProvider(AUDIT_PORT).useValue({ record: jest.fn() })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    jwt = module.get(JwtService);
    await app.init();
  });

  afterEach(() => app?.close());

  it('returns 401 without authentication', () => request(app.getHttpServer()).get('/institutional-profile').expect(401));

  it.each(['Tesorero', 'Gestor de Inventario', 'Vecino/Afiliado', 'Subscription_L1'])('returns 403 for %s on GET and PATCH', async (role) => {
    account = authAccount(role);
    const authorization = await token();
    await request(app.getHttpServer()).get('/institutional-profile').set('Authorization', authorization).expect(403);
    await request(app.getHttpServer()).patch('/institutional-profile').set('Authorization', authorization).send({ legalName: 'Asociación de Prueba' }).expect(403);
  });

  it('allows Administrador to read null fields and patch the singleton', async () => {
    const authorization = await token();
    await request(app.getHttpServer()).get('/institutional-profile').set('Authorization', authorization).expect(200).expect(({ body }) => expect(body).toMatchObject({ id: 1, legalName: null }));
    await request(app.getHttpServer()).patch('/institutional-profile').set('Authorization', authorization).set('User-Agent', 'e2e-agent').send({ legalName: '  Asociación de Desarrollo Integral de Prueba  ', email: ' CONTACTO@PRUEBA.TEST ' }).expect(200).expect(({ body }) => expect(body).toMatchObject({ id: 1, legalName: 'Asociación de Desarrollo Integral de Prueba', email: 'contacto@prueba.test' }));
    expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 1, action: 'INSTITUTIONAL_PROFILE_UPDATED', module: 'ADMINISTRATIVE', entityType: 'InstitutionalProfile', entityId: '1', details: { changedFields: ['legalName', 'email'] }, userAgent: 'e2e-agent' }) });
  });

  it('rejects invalid email', async () => {
    await request(app.getHttpServer()).patch('/institutional-profile').set('Authorization', await token()).send({ email: 'invalid' }).expect(400);
  });

  function token() { return jwt.signAsync({ sub: account.id, email: account.email, role: account.roleName }).then(value => `Bearer ${value}`); }
});

function authAccount(roleName: string): AuthAccount {
  return { id: 1, email: 'user@curime.test', fullName: `Usuario ${roleName}`, status: 'ACTIVE', passwordHash: null, lockedAt: null, failedLoginAttempts: 0, lastLoginAt: null, roleName, roleId: 1, roleIsActive: true, hasPerson: false, affiliateStatus: null, affiliateRoleId: null, subscriptionExpirationDate: null };
}
