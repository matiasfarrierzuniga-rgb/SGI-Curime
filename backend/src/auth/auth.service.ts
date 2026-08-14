import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  AccountLockoutPolicy,
  getAccountLockoutPolicy,
  isTemporaryLockActive,
} from './account-lockout.policy';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly lockoutPolicy: AccountLockoutPolicy;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Optional() private readonly audit?: AuditService,
  ) {
    this.lockoutPolicy = getAccountLockoutPolicy();
  }

  async login(loginDto: LoginDto, context: AuditContext = {}): Promise<{
    accessToken: string;
    user: AuthenticatedUser;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      await this.audit?.log({ action: AuditAction.LOGIN_FAILED, module: 'AUTH', ...context });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      isTemporaryLockActive(user.lockedAt, this.lockoutPolicy.lockoutMinutes)
    ) {
      await this.audit?.log({ userId: user.id, action: AuditAction.LOGIN_FAILED, module: 'AUTH', ...context });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedAt) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedAt: null },
      });
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      const locked = await this.recordFailedLogin(user.id);
      await this.audit?.log({ userId: user.id, action: AuditAction.LOGIN_FAILED, module: 'AUTH', ...context });
      if (locked) await this.audit?.log({ userId: user.id, action: AuditAction.ACCOUNT_LOCKED, module: 'AUTH', entityType: 'User', entityId: user.id, ...context });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lastLoginAt: new Date(),
      },
    });
    await this.audit?.log({ userId: user.id, action: AuditAction.LOGIN_SUCCESS, module: 'AUTH', entityType: 'User', entityId: user.id, ...context });

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        role: user.role.name,
      },
    };
  }

  private async recordFailedLogin(userId: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      });

      if (updated.failedLoginAttempts >= this.lockoutPolicy.maxLoginAttempts) {
        await tx.user.update({
          where: { id: userId },
          data: { lockedAt: new Date() },
        });
        return true;
      }
      return false;
    });
  }
}
