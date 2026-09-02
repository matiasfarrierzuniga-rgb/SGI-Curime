import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../../application/ports/auth-repository.port';
import type { AuthenticatedUser } from '../../domain/entities/auth-user';
import { AuthApplicationError } from '../../application/errors/auth.errors';
import {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from '../../domain/policies/account-lockout.policy';
import { isSubscriptionExpired } from '../../domain/policies/subscription-expiration.policy';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { toAuthHttpError } from '../errors/auth-http-error.mapper';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET must be configured to enable authentication.');
  }

  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly lockoutMinutes: number;

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
    this.lockoutMinutes = getAccountLockoutPolicy().lockoutMinutes;
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const account = await this.repository.findCredentialsById(payload.sub);

    if (
      !account ||
      account.status !== 'ACTIVE' ||
      isTemporaryLockActive(account.lockedAt, this.lockoutMinutes)
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (account.lockedAt) {
      await this.repository.clearLockout(account.id);
    }
    if (
      isSubscriptionExpired(
        account.roleName,
        account.subscriptionExpirationDate,
      )
    ) {
      throw toAuthHttpError(
        new AuthApplicationError(
          'SUBSCRIPTION_EXPIRED',
          'Subscription has expired',
        ),
      );
    }

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
}
