import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivateAccountDto } from './dto/activate-account.dto';

@Injectable()
export class AccountActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(dto: ActivateAccountDto): Promise<{ message: string }> {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const activationToken = await this.prisma.accountActivationToken.findUnique(
      {
        where: { tokenHash },
        include: { user: true },
      },
    );

    if (!activationToken) {
      throw new BadRequestException('Invalid activation token');
    }
    if (activationToken.usedAt) {
      throw new ConflictException('Activation token has already been used');
    }
    if (activationToken.expiresAt <= new Date()) {
      throw new BadRequestException('Activation token has expired');
    }
    if (activationToken.user.status !== 'INACTIVE') {
      throw new ConflictException('Account cannot be activated');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const usedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.accountActivationToken.updateMany({
        where: {
          id: activationToken.id,
          usedAt: null,
          expiresAt: { gt: usedAt },
        },
        data: { usedAt },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('Activation token is no longer valid');
      }
      const activated = await tx.user.updateMany({
        where: { id: activationToken.userId, status: 'INACTIVE' },
        data: { passwordHash, status: 'ACTIVE' },
      });
      if (activated.count !== 1) {
        throw new ConflictException('Account cannot be activated');
      }
    });

    return { message: 'Account activated successfully' };
  }
}
