import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetTokenDeliveryService } from './password-reset-token-delivery.service';

const GENERIC_RESPONSE =
  'If the email is registered, password reset instructions will be sent.';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getResetTtlMinutes(): number {
  const raw = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES?.trim();
  const value = Number(raw);
  if (!raw || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      'PASSWORD_RESET_TOKEN_TTL_MINUTES must be configured as a positive integer.',
    );
  }
  return value;
}

@Injectable()
export class PasswordRecoveryService {
  private readonly ttlMinutes = getResetTtlMinutes();

  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: PasswordResetTokenDeliveryService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) return { message: GENERIC_RESPONSE };

    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlMinutes * 60_000);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      await tx.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
      });
    });

    await this.delivery.deliver({
      email: user.email,
      fullName: user.fullName,
      token,
      expiresAt,
    });
    return { message: GENERIC_RESPONSE };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(dto.token) },
      include: { user: true },
    });
    if (!resetToken) throw new BadRequestException('Invalid reset token');
    if (resetToken.usedAt) {
      throw new ConflictException('Reset token has already been used');
    }
    const now = new Date();
    if (resetToken.expiresAt <= now) {
      throw new BadRequestException('Reset token has expired');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('Reset token is no longer valid');
      }
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedAt: null },
      });
    });
    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.newPasswordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) throw new UnauthorizedException('Unauthorized');
    const currentMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new ConflictException('New password must be different');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 12),
        failedLoginAttempts: 0,
        lockedAt: null,
      },
    });
    return { message: 'Password changed successfully' };
  }
}
