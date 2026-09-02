import type { PasswordHasher } from '../../../../auth/application/ports/password-hasher.port';
import { UserStatus } from '../../domain/entities/user';
import { RegistrationRoleUnavailableError } from '../../domain/errors/registration-role-unavailable.error';
import {
  RegistrationDataConflictError,
  type UsersRepository,
} from '../../domain/repositories/users-repository';
import { RegisterUserUseCase } from './register-user.use-case';

const input = {
  firstName: 'Persona',
  firstSurname: 'Usuaria',
  secondSurname: 'Prueba',
  identificationType: 'NATIONAL' as const,
  identification: '123456789',
  email: 'persona@example.com',
  phoneCountryCode: '+506',
  phoneNationalNumber: '88888888',
  address: 'Curime',
  password: 'Secure12345',
};

const person = {
  id: 12,
  firstName: 'Persona',
  firstSurname: 'Usuaria',
  secondSurname: 'Prueba',
  identification: '123456789',
  identificationType: 'NATIONAL',
  normalizedIdentification: '123456789',
};

describe('RegisterUserUseCase', () => {
  const repository = {
    findByEmail: jest.fn(),
    findRoleByName: jest.fn(),
    resolvePerson: jest.fn(),
    findByPersonId: jest.fn(),
    create: jest.fn(),
    withRegistrationTransaction: jest.fn(),
  };
  const passwordHasher = { hash: jest.fn() };
  const createdUser = {
    id: 4,
    fullName: 'Persona Usuaria Prueba',
    identification: input.identification,
    identificationType: input.identificationType,
    email: input.email,
    phoneCountryCode: input.phoneCountryCode,
    phoneNationalNumber: input.phoneNationalNumber,
    phone: null,
    address: input.address,
    status: UserStatus.ACTIVE,
    lockedAt: null,
    roleId: 5,
    role: {
      id: 5,
      name: 'Subscription_L1',
      description: null,
      isActive: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findByEmail.mockResolvedValue(null);
    repository.findRoleByName.mockResolvedValue(createdUser.role);
    repository.resolvePerson.mockResolvedValue({
      status: 'PERSON_CREATED',
      person,
      profileEnrichmentRequired: false,
    });
    repository.findByPersonId.mockResolvedValue(null);
    repository.create.mockResolvedValue(createdUser);
    repository.withRegistrationTransaction.mockImplementation(
      (work: (tx: UsersRepository) => Promise<unknown>) =>
        work(repository as unknown as UsersRepository),
    );
    passwordHasher.hash.mockResolvedValue('secure-hash');
    useCase = new RegisterUserUseCase(
      repository as unknown as UsersRepository,
      passwordHasher as unknown as PasswordHasher,
    );
  });

  it('creates Person-first ACTIVE User atomically with derived fullName', async () => {
    await useCase.execute(input);

    expect(repository.withRegistrationTransaction).toHaveBeenCalledTimes(1);
    expect(repository.findRoleByName).toHaveBeenCalledWith('Subscription_L1');
    expect(repository.resolvePerson).toHaveBeenCalledWith({
      identificationType: 'NATIONAL',
      identification: '123456789',
      firstName: 'Persona',
      firstSurname: 'Usuaria',
      secondSurname: 'Prueba',
      phoneCountryCode: '+506',
      phoneNationalNumber: '88888888',
      address: 'Curime',
    });
    expect(repository.create).toHaveBeenCalledWith({
      fullName: 'Persona Usuaria Prueba',
      identificationType: 'NATIONAL',
      identification: '123456789',
      email: 'persona@example.com',
      phoneCountryCode: '+506',
      phoneNationalNumber: '88888888',
      address: 'Curime',
      passwordHash: 'secure-hash',
      roleId: 5,
      personId: 12,
      status: UserStatus.ACTIVE,
    });
  });

  it('reuses one compatible Person without a User', async () => {
    repository.resolvePerson.mockResolvedValue({
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: false,
    });

    await expect(useCase.execute(input)).resolves.toBe(createdUser);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ personId: person.id }),
    );
  });

  it('rejects a Person that already owns a User', async () => {
    repository.findByPersonId.mockResolvedValue({ id: 99 });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'PERSON_ALREADY_HAS_USER',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects public profile enrichment without mutating Person', async () => {
    repository.resolvePerson.mockResolvedValue({
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: true,
    });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'MANUAL_REVIEW_REQUIRED',
    });
    expect(repository.findByPersonId).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it.each([
    'IDENTITY_CONFLICT',
    'INVALID_IDENTIFICATION',
    'INVALID_STRUCTURED_NAME',
    'IDENTITY_INCOMPLETE',
    'IDENTITY_DUPLICATE_CORRUPTION',
    'MANUAL_REVIEW_REQUIRED',
  ] as const)('rejects unsafe resolver result %s', async (status) => {
    repository.resolvePerson.mockResolvedValue({ status });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      RegistrationDataConflictError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('hashes before a duplicate response to reduce email timing disclosure', async () => {
    repository.findByEmail.mockResolvedValue({ id: 9 });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'DUPLICATE_EMAIL',
    });
    expect(passwordHasher.hash).toHaveBeenCalledWith(input.password);
  });

  it('rechecks duplicate email inside the transaction', async () => {
    repository.findByEmail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 9 });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'DUPLICATE_EMAIL',
    });
    expect(repository.resolvePerson).not.toHaveBeenCalled();
  });

  it('fails before Person resolution when Subscription_L1 is unavailable', async () => {
    repository.findRoleByName.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      RegistrationRoleUnavailableError,
    );
    expect(repository.resolvePerson).not.toHaveBeenCalled();
  });
});
