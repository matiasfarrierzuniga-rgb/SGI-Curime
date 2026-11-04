import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CapabilityGuard, JwtAuthGuard, RolesGuard } from '../src/auth';
import { PublicRequestRateLimitModule } from '../src/common/rate-limit/public-request-rate-limit.module';
import { publicRequestRateLimitConfig } from '../src/common/rate-limit/public-request-rate-limit.config';
import { PrismaService } from '../src/prisma/prisma.service';
import { CommunityAccountsController } from '../src/user-requests/community-accounts.controller';
import { CommunityAccountsService } from '../src/user-requests/community-accounts.service';
import { ActivationTokenService } from '../src/user-requests/activation-token.service';
import { BcryptPasswordHasher } from '../src/auth/infrastructure/security/bcrypt-password-hasher';
import request from 'supertest';
import type { App } from 'supertest/types';

describe('Community account resend verification HTTP', () => {
  let app: INestApplication<App>;
  const pendingAccount = {
    id: 9,
    email: 'pending@example.test',
    fullName: 'Synthetic Pending',
    status: 'PENDING_EMAIL_VERIFICATION',
  };
  const prisma = {
    $transaction: jest.fn(),
    user: { findUnique: jest.fn() },
    accountActivationToken: {
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };
  const delivery = { deliver: jest.fn() };

  beforeAll(async () => {
    prisma.$transaction.mockImplementation(
      (work: (tx: typeof prisma) => Promise<unknown>) => work(prisma),
    );
    prisma.user.findUnique.mockImplementation(
      ({ where }: { where: { email: string } }) =>
        Promise.resolve(
          where.email === pendingAccount.email ? pendingAccount : null,
        ),
    );
    prisma.accountActivationToken.count.mockResolvedValue(0);
    prisma.accountActivationToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.accountActivationToken.create.mockResolvedValue({ id: 1 });
    delivery.deliver.mockResolvedValue(true);

    const communityAccounts = new CommunityAccountsService(
      prisma as unknown as PrismaService,
      new ActivationTokenService(),
      delivery as never,
      new BcryptPasswordHasher(),
    );
    const allowGuard = { canActivate: () => true };
    const module = await Test.createTestingModule({
      imports: [PublicRequestRateLimitModule],
      controllers: [CommunityAccountsController],
      providers: [
        { provide: CommunityAccountsService, useValue: communityAccounts },
        { provide: JwtAuthGuard, useValue: allowGuard },
        { provide: RolesGuard, useValue: allowGuard },
        { provide: CapabilityGuard, useValue: allowGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns identical accepted responses for existing and nonexistent emails and enforces the client limit', async () => {
    const endpoint = '/community-accounts/resend-verification';
    const existing = await request(app.getHttpServer())
      .post(endpoint)
      .send({ email: pendingAccount.email })
      .expect(202);
    const nonexistent = await request(app.getHttpServer())
      .post(endpoint)
      .send({ email: 'missing@example.test' })
      .expect(202);

    expect(nonexistent.body).toEqual(existing.body);
    expect(delivery.deliver).toHaveBeenCalledTimes(1);

    const { limit } = publicRequestRateLimitConfig();
    for (let attempt = 2; attempt < limit; attempt += 1) {
      await request(app.getHttpServer())
        .post(endpoint)
        .send({ email: `missing-${attempt}@example.test` })
        .expect(202);
    }
    await request(app.getHttpServer())
      .post(endpoint)
      .send({ email: 'missing-over-limit@example.test' })
      .expect(429);
  });
});
