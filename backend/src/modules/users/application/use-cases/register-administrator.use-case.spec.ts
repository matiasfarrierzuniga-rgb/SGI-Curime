import type { PasswordHasher } from '../../../../auth/application/ports/password-hasher.port';
import { UserStatus } from '../../domain/entities/user';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { RegisterAdministratorUseCase } from './register-administrator.use-case';

const input = {
  firstName: 'Admin',
  firstSurname: 'Prueba',
  identificationType: 'NATIONAL' as const,
  identification: '123456789',
  email: 'admin@example.com',
  password: 'Secure12345',
};

const administratorRole = {
  id: 1,
  name: 'Administrador',
  description: null,
  isActive: true,
};

describe('RegisterAdministratorUseCase', () => {
  const repository = {
    findByEmail: jest.fn(),
    withRegistrationTransaction: jest.fn(),
    countAdministrators: jest.fn(),
    findRoleByName: jest.fn(),
    resolvePerson: jest.fn(),
    findByPersonId: jest.fn(),
    create: jest.fn(),
  };
  const passwordHasher = { hash: jest.fn() };
  let useCase: RegisterAdministratorUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RegisterAdministratorUseCase(
      repository as unknown as UsersRepository,
      passwordHasher as PasswordHasher,
    );
    repository.findByEmail.mockResolvedValue(null);
    repository.withRegistrationTransaction.mockImplementation(
      (work: (tx: UsersRepository) => Promise<unknown>) =>
        work(repository as unknown as UsersRepository),
    );
    repository.countAdministrators.mockResolvedValue(0);
    repository.findRoleByName.mockResolvedValue(administratorRole);
    repository.resolvePerson.mockResolvedValue({
      status: 'PERSON_CREATED',
      person: { id: 12 },
      profileEnrichmentRequired: false,
    });
    repository.findByPersonId.mockResolvedValue(null);
    repository.create.mockResolvedValue({ id: 1 });
    passwordHasher.hash.mockResolvedValue('hash');
  });

  it('bootstraps first active Administrator through Person-first with no expiration', async () => {
    await useCase.execute(input);

    expect(repository.resolvePerson).toHaveBeenCalledWith(
      expect.objectContaining({ identification: input.identification }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roleId: 1,
        personId: 12,
        status: UserStatus.ACTIVE,
        subscriptionExpirationDate: null,
      }),
    );
  });

  it('requires authentication after an Administrator exists', async () => {
    repository.countAdministrators.mockResolvedValue(1);

    await expect(useCase.execute(input)).rejects.toMatchObject({
      name: 'AdministratorRegistrationAuthenticationRequiredError',
    });
  });

  it('rejects non-administrator actors and allows Administrador actors', async () => {
    repository.countAdministrators.mockResolvedValue(1);

    await expect(
      useCase.execute(input, { id: 2, role: 'Subscription_L1' }),
    ).rejects.toMatchObject({
      name: 'AdministratorRegistrationForbiddenError',
    });
    await expect(
      useCase.execute(input, { id: 1, role: 'Administrador' }),
    ).resolves.toEqual({ id: 1 });
  });

  it('rejects duplicate emails before Person creation', async () => {
    repository.findByEmail.mockResolvedValue({ id: 9 });

    await expect(useCase.execute(input)).rejects.toMatchObject({
      code: 'DUPLICATE_EMAIL',
    });
    expect(repository.resolvePerson).not.toHaveBeenCalled();
  });
});
