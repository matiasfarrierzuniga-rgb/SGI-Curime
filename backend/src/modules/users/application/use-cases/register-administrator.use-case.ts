import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../../auth/application/ports/password-hasher.port';
import { User, UserStatus } from '../../domain/entities/user';
import { AdministratorRegistrationAuthenticationRequiredError } from '../../domain/errors/administrator-registration-authentication-required.error';
import { AdministratorRegistrationForbiddenError } from '../../domain/errors/administrator-registration-forbidden.error';
import { RegistrationRoleUnavailableError } from '../../domain/errors/registration-role-unavailable.error';
import {
  RegistrationDataConflictError,
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users-repository';
import type { RegisterUserData } from './register-user.use-case';

const ADMIN_ROLE = 'Administrador';

export interface AdministratorRegistrationActor {
  id: number;
  role: string;
}

@Injectable()
export class RegisterAdministratorUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    data: RegisterUserData,
    actor?: AdministratorRegistrationActor,
  ): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(data.password);
    const duplicate = await this.repository.findByEmail(data.email);
    if (duplicate) throw new RegistrationDataConflictError('DUPLICATE_EMAIL');

    return this.repository.withRegistrationTransaction(async (tx) => {
      if (await tx.findByEmail(data.email)) {
        throw new RegistrationDataConflictError('DUPLICATE_EMAIL');
      }
      const administratorCount = await tx.countAdministrators();
      if (administratorCount > 0 && !actor) {
        throw new AdministratorRegistrationAuthenticationRequiredError();
      }
      if (administratorCount > 0 && actor?.role !== ADMIN_ROLE) {
        throw new AdministratorRegistrationForbiddenError();
      }

      const role = await tx.findRoleByName(ADMIN_ROLE);
      if (!role?.isActive) throw new RegistrationRoleUnavailableError();
      const resolution = await tx.resolvePerson({
        identificationType: data.identificationType,
        identification: data.identification,
        firstName: data.firstName,
        firstSurname: data.firstSurname,
        secondSurname: data.secondSurname,
        phoneCountryCode: data.phoneCountryCode,
        phoneNationalNumber: data.phoneNationalNumber,
        address: data.address,
      });
      if (
        resolution.status !== 'PERSON_CREATED' &&
        resolution.status !== 'PERSON_REUSED'
      ) {
        throw new RegistrationDataConflictError(
          resolution.status === 'IDENTITY_CONFLICT'
            ? 'IDENTITY_CONFLICT'
            : resolution.status,
        );
      }
      if (resolution.profileEnrichmentRequired) {
        throw new RegistrationDataConflictError('MANUAL_REVIEW_REQUIRED');
      }
      if (await tx.findByPersonId(resolution.person.id)) {
        throw new RegistrationDataConflictError('PERSON_ALREADY_HAS_USER');
      }

      return tx.create({
        fullName: [data.firstName, data.firstSurname, data.secondSurname]
          .filter((part): part is string => Boolean(part))
          .join(' '),
        identificationType: data.identificationType,
        identification: data.identification,
        email: data.email,
        phoneCountryCode: data.phoneCountryCode,
        phoneNationalNumber: data.phoneNationalNumber,
        address: data.address,
        passwordHash,
        roleId: role.id,
        personId: resolution.person.id,
        status: UserStatus.ACTIVE,
        subscriptionExpirationDate: null,
      });
    });
  }
}
