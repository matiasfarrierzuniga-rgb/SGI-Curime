/* eslint-disable @typescript-eslint/require-await -- In-memory async adapters intentionally mirror production ports. */
import { createHash } from 'crypto';
import { AuthApplicationError } from '../src/auth/application/errors/auth.errors';
import { ActivateAccountUseCase } from '../src/auth/application/use-cases/activate-account.use-case';
import { NotificationService } from '../src/modules/notifications/application/notification.service';
import { NotificationUrlBuilder } from '../src/modules/notifications/application/notification-url-builder';
import { FakeEmailProvider } from '../src/modules/notifications/infrastructure/fake-email.provider';
import { ActivationTokenDeliveryService } from '../src/user-requests/activation-token-delivery.service';
import { ActivationTokenService } from '../src/user-requests/activation-token.service';
import { UserRequestsService } from '../src/user-requests/user-requests.service';

describe('User request activation flow (e2e)', () => {
  it('approves, emails through the fake provider, activates once, and keeps only the hash', async () => {
    const requestRecord = {
      id: 10,
      fullName: 'Persona <Curime>',
      identification: '123456789',
      identificationType: 'NATIONAL',
      email: 'persona@example.test',
      phoneCountryCode: null,
      phoneNationalNumber: null,
      phone: null,
      address: null,
      reason: 'Acceso',
      status: 'PENDING',
      rejectionReason: null,
      reviewedAt: null,
      reviewedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const user = {
      id: 22,
      fullName: requestRecord.fullName,
      identification: requestRecord.identification,
      identificationType: requestRecord.identificationType,
      email: requestRecord.email,
      phoneCountryCode: null,
      phoneNationalNumber: null,
      phone: null,
      address: null,
      passwordHash: null as string | null,
      status: 'INACTIVE' as 'INACTIVE' | 'ACTIVE',
      roleId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tokenRecord: {
      id: number;
      userId: number;
      tokenHash: string;
      expiresAt: Date;
      usedAt: Date | null;
    } = {
      id: 1,
      userId: user.id,
      tokenHash: '',
      expiresAt: new Date(),
      usedAt: null,
    };

    const tx = {
      userRequest: {
        updateMany: jest.fn(async () => {
          requestRecord.status = 'APPROVED';
          return { count: 1 };
        }),
        findUniqueOrThrow: jest.fn(async () => requestRecord),
      },
      user: {
        create: jest.fn(async () => user),
      },
      accountActivationToken: {
        create: jest.fn(
          async ({
            data,
          }: {
            data: Omit<typeof tokenRecord, 'id' | 'usedAt'>;
          }) => {
            Object.assign(tokenRecord, data);
            return tokenRecord;
          },
        ),
      },
    };
    const prisma = {
      user: {
        findFirst: jest.fn(async () => null),
        findUnique: jest.fn(async () => null),
      },
      userRequest: { findUnique: jest.fn(async () => requestRecord) },
      role: { findUnique: jest.fn(async () => ({ id: 2, isActive: true })) },
      $transaction: jest.fn(
        async (work: (client: typeof tx) => Promise<unknown>) => work(tx),
      ),
    };
    const fakeEmail = new FakeEmailProvider();
    const notifications = new NotificationService(
      fakeEmail,
      new NotificationUrlBuilder({ baseUrl: 'https://sgi.example.test' }),
    );
    const approval = new UserRequestsService(
      prisma as never,
      new ActivationTokenService(),
      new ActivationTokenDeliveryService(notifications),
    );

    await approval.approve(requestRecord.id, { roleId: 2 }, 1);

    expect(user.status).toBe('INACTIVE');
    expect(tokenRecord.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    const messages = fakeEmail.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].to).toBe(requestRecord.email);
    expect(messages[0].html).toContain('Persona &lt;Curime&gt;');
    expect(messages[0].text).toContain(
      'https://sgi.example.test/activate-account?token=',
    );
    const activationUrl = messages[0].text.match(/https:\/\/\S+/)?.[0];
    const rawToken = new URL(activationUrl!).searchParams.get('token')!;
    expect(tokenRecord.tokenHash).toBe(
      createHash('sha256').update(rawToken).digest('hex'),
    );
    expect(tokenRecord.tokenHash).not.toBe(rawToken);

    const repository = {
      findActivationToken: jest.fn(async (hash: string) =>
        hash === tokenRecord.tokenHash
          ? {
              id: tokenRecord.id,
              userId: user.id,
              usedAt: tokenRecord.usedAt,
              expiresAt: tokenRecord.expiresAt,
              userStatus: user.status,
            }
          : null,
      ),
      withTransaction: jest.fn(
        async (
          work: (client: {
            claimActivationToken: (id: number, now: Date) => Promise<boolean>;
            activateUser: (id: number, hash: string) => Promise<boolean>;
          }) => Promise<unknown>,
        ) =>
          work({
            claimActivationToken: async () => {
              if (tokenRecord.usedAt) return false;
              tokenRecord.usedAt = new Date();
              return true;
            },
            activateUser: async (_id, passwordHash) => {
              if (user.status !== 'INACTIVE') return false;
              user.passwordHash = passwordHash;
              user.status = 'ACTIVE';
              return true;
            },
          }),
      ),
    };
    const activation = new ActivateAccountUseCase(repository as never, {
      hash: async () => 'hashed-password',
      compare: async () => false,
    });

    await activation.execute(rawToken, 'SecurePass1', 'SecurePass1');
    expect(user.status).toBe('ACTIVE');
    expect(tokenRecord.usedAt).toBeInstanceOf(Date);
    await expect(
      activation.execute(rawToken, 'SecurePass1', 'SecurePass1'),
    ).rejects.toMatchObject({
      code: 'ACTIVATION_TOKEN_USED',
    } satisfies Partial<AuthApplicationError>);
  });
});
