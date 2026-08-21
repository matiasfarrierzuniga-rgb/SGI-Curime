import { Inject, Injectable, Optional } from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
import { AuthApplicationError } from '../errors/auth.errors';
import {
  AUDIT_PORT,
  type AuditContext,
  type AuditPort,
} from '../ports/audit.port';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../ports/auth-repository.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../ports/password-hasher.port';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(PASSWORD_HASHER)
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
      throw new AuthApplicationError('PASSWORDS_DO_NOT_MATCH', 'Passwords do not match');
    }

    const user = await this.repository.findCredentialsById(userId);
    if (!user?.passwordHash) {
      throw new AuthApplicationError('UNAUTHORIZED', 'Unauthorized');
    }

    const currentMatches = await this.hasher.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      throw new AuthApplicationError(
        'CURRENT_PASSWORD_INCORRECT',
        'Current password is incorrect',
      );
    }

    if (await this.hasher.compare(newPassword, user.passwordHash)) {
      throw new AuthApplicationError(
        'NEW_PASSWORD_MUST_DIFFER',
        'New password must be different',
      );
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
