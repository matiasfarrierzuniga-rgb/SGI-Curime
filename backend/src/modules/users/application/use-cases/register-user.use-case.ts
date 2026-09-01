import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../../auth/application/ports/password-hasher.port';
import { User, UserStatus } from '../../domain/entities/user';
import { RegistrationConflictError } from '../../domain/errors/registration-conflict.error';
import { RegistrationRoleUnavailableError } from '../../domain/errors/registration-role-unavailable.error';
import {
  USERS_REPOSITORY,
  type UserCreateData,
  type UsersRepository,
} from '../../domain/repositories/users-repository';

const PUBLIC_REGISTRATION_ROLE = 'Subscription_L1';

export type RegisterUserData = Omit<
  UserCreateData,
  'passwordHash' | 'roleId' | 'status'
> & { password: string };

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(data: RegisterUserData): Promise<User> {
    const duplicate = await this.repository.findByEmail(data.email);
    if (duplicate) throw new RegistrationConflictError();

    const role = await this.repository.findRoleByName(PUBLIC_REGISTRATION_ROLE);
    if (!role?.isActive) throw new RegistrationRoleUnavailableError();

    const { password, ...profile } = data;
    const passwordHash = await this.passwordHasher.hash(password);
    return this.repository.create({
      ...profile,
      passwordHash,
      roleId: role.id,
      status: UserStatus.ACTIVE,
    });
  }
}
