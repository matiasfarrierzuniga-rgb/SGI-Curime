import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
import { AuthApplicationError } from '../errors/auth.errors';
import { getRefreshTokenTtlSeconds } from '../config/refresh-token.config';
import type { AuthenticatedUser } from '../../domain/entities/auth-user';
import {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from '../../domain/policies/account-lockout.policy';
import { isSubscriptionExpired } from '../../domain/policies/subscription-expiration.policy';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
  recordAuditBestEffort,
} from '../ports/audit.port';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../ports/auth-repository.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../ports/password-hasher.port';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service.port';
import {
  REFRESH_TOKEN_SERVICE,
  type RefreshTokenPort,
} from '../ports/refresh-token.port';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class LoginUseCase {
  private readonly lockoutPolicy = getAccountLockoutPolicy();

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly refreshTokens: RefreshTokenPort,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    email: string,
    password: string,
    context: AuditContext = {},
  ): Promise<LoginResult> {
    const account = await this.repository.findCredentialsByEmail(email);

    if (!account || account.status !== 'ACTIVE' || !account.passwordHash) {
      await this.audit?.record({
        action: AuditAction.LOGIN_FAILED,
        module: 'AUTH',
        ...context,
      });
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'Invalid credentials',
      );
    }

    if (
      isTemporaryLockActive(account.lockedAt, this.lockoutPolicy.lockoutMinutes)
    ) {
      await this.audit?.record({
        userId: account.id,
        action: AuditAction.LOGIN_FAILED,
        module: 'AUTH',
        ...context,
      });
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'Invalid credentials',
      );
    }

    if (account.lockedAt) {
      await this.repository.clearLockout(account.id);
    }

    const passwordMatches = await this.hasher.compare(
      password,
      account.passwordHash,
    );

    if (!passwordMatches) {
      const locked = await this.repository.recordFailedLogin(
        account.id,
        this.lockoutPolicy.maxLoginAttempts,
      );
      await this.audit?.record({
        userId: account.id,
        action: AuditAction.LOGIN_FAILED,
        module: 'AUTH',
        ...context,
      });
      if (locked) {
        await this.audit?.record({
          userId: account.id,
          action: AuditAction.ACCOUNT_LOCKED,
          module: 'AUTH',
          entityType: 'User',
          entityId: account.id,
          ...context,
        });
      }
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'Invalid credentials',
      );
    }

    if (
      isSubscriptionExpired(
        account.roleName,
        account.subscriptionExpirationDate,
      )
    ) {
      throw new AuthApplicationError(
        'SUBSCRIPTION_EXPIRED',
        'Subscription has expired',
      );
    }

    const accessToken = await this.tokens.sign({
      sub: account.id,
      email: account.email,
      role: account.roleName,
    });
    const refreshToken = this.refreshTokens.generate();
    const expiresAt = new Date(Date.now() + getRefreshTokenTtlSeconds() * 1000);
    await this.repository.recordLoginSuccessAndCreateSession(
      account.id,
      this.refreshTokens.hash(refreshToken),
      expiresAt,
    );
    await recordAuditBestEffort(this.audit, {
      userId: account.id,
      action: AuditAction.LOGIN_SUCCESS,
      module: 'AUTH',
      entityType: 'User',
      entityId: account.id,
      ...context,
    });

    return {
      accessToken,
      refreshToken,
      user: toAuthenticatedUser(account),
    };
  }
}

function toAuthenticatedUser(account: {
  id: number;
  fullName: string;
  email: string;
  status: string;
  roleName: string;
  subscriptionExpirationDate: Date | null;
}): AuthenticatedUser {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    status: account.status,
    role: account.roleName,
    ...(account.subscriptionExpirationDate
      ? { subscriptionExpirationDate: account.subscriptionExpirationDate }
      : {}),
  };
}
