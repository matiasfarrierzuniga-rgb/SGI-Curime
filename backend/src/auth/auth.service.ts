import { Injectable, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  private readonly lockoutPolicy: AccountLockoutPolicy;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.lockoutPolicy = getAccountLockoutPolicy();
  }

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: AuthenticatedUser;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      isTemporaryLockActive(user.lockedAt, this.lockoutPolicy.lockoutMinutes)
    ) {
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
      await this.recordFailedLogin(user.id);
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

  private async recordFailedLogin(userId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
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
      }
    });
  }
}
