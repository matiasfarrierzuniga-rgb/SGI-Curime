import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { AuditAction } from '../../../audit/audit-actions';
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

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class ActivateAccountUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasher,
    @Optional() @Inject(AUDIT_PORT) private readonly audit?: AuditPort,
  ) {}

  async execute(
    token: string,
    password: string,
    passwordConfirmation: string,
    context: AuditContext = {},
  ): Promise<{ message: string }> {
    if (password !== passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const activationToken = await this.repository.findActivationToken(
      hashToken(token),
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
    if (activationToken.userStatus !== 'INACTIVE') {
      throw new ConflictException('Account cannot be activated');
    }

    const passwordHash = await this.hasher.hash(password);

    await this.repository.withTransaction(async (tx) => {
      const claimed = await tx.claimActivationToken(
        activationToken.id,
        new Date(),
      );
      if (!claimed) {
        throw new ConflictException('Activation token is no longer valid');
      }
      const activated = await tx.activateUser(
        activationToken.userId,
        passwordHash,
      );
      if (!activated) {
        throw new ConflictException('Account cannot be activated');
      }
    });

    await this.audit?.record({
      userId: activationToken.userId,
      action: AuditAction.ACCOUNT_ACTIVATED,
      module: 'AUTH',
      entityType: 'User',
      entityId: activationToken.userId,
      ...context,
    });

    return { message: 'Account activated successfully' };
  }
}
