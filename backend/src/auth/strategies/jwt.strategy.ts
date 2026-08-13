import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import {
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from '../account-lockout.policy';

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

  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
    this.lockoutMinutes = getAccountLockoutPolicy().lockoutMinutes;
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      isTemporaryLockActive(user.lockedAt, this.lockoutMinutes)
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (user.lockedAt) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedAt: null },
      });
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      role: user.role.name,
    };
  }
}
