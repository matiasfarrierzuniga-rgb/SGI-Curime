import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';
import type { AuthRepository } from '../ports/auth-repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly hasher: PasswordHasher,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    userId: number,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string,
    context: AuditContext = {},
  ): Promise<{ message: string }> {
    if (newPassword !== newPasswordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.repository.findCredentialsById(userId);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Unauthorized');
    }

    const currentMatches = await this.hasher.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await this.hasher.compare(newPassword, user.passwordHash)) {
      throw new ConflictException('New password must be different');
    }

    await this.repository.updatePassword(
      userId,
      await this.hasher.hash(newPassword),
    );
    await this.audit?.record({
      userId,
      action: AuditAction.PASSWORD_CHANGED,
      module: 'AUTH',
      entityType: 'User',
      entityId: userId,
      ...context,
    });

    return { message: 'Password changed successfully' };
  }
}
