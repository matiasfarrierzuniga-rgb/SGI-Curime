import type { PasswordHasher } from '../../../../auth/application/ports/password-hasher.port';
import { UserStatus } from '../../domain/entities/user';
import { RegistrationConflictError } from '../../domain/errors/registration-conflict.error';
import { RegistrationRoleUnavailableError } from '../../domain/errors/registration-role-unavailable.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { RegisterUserUseCase } from './register-user.use-case';

const input = {
  fullName: 'Persona Usuaria',
  identificationType: 'NATIONAL' as const,
  identification: '123456789',
  email: 'persona@example.com',
  password: 'Secure12345',
};

describe('RegisterUserUseCase', () => {
  const repository = {
    findByEmail: jest.fn(),
    findRoleByName: jest.fn(),
    create: jest.fn(),
  };
  const passwordHasher = { hash: jest.fn() };
  const createdUser = {
    id: 4,
    ...input,
    password: undefined,
    phoneCountryCode: null,
    phoneNationalNumber: null,
    phone: null,
    address: null,
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
    repository.create.mockResolvedValue(createdUser);
    passwordHasher.hash.mockResolvedValue('secure-hash');
    useCase = new RegisterUserUseCase(
      repository as unknown as UsersRepository,
      passwordHasher as unknown as PasswordHasher,
    );
  });

  it('creates an active Subscription_L1 user with only the password hash', async () => {
    await useCase.execute(input);

    expect(repository.findRoleByName).toHaveBeenCalledWith('Subscription_L1');
    expect(passwordHasher.hash).toHaveBeenCalledWith(input.password);
    expect(repository.create).toHaveBeenCalledWith({
      fullName: input.fullName,
      identificationType: input.identificationType,
      identification: input.identification,
      email: input.email,
      passwordHash: 'secure-hash',
      roleId: 5,
      status: UserStatus.ACTIVE,
    });
  });

  it('rejects a pre-existing email before hashing', async () => {
    repository.findByEmail.mockResolvedValue({ id: 9 });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      RegistrationConflictError,
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('fails safely when Subscription_L1 is missing or inactive', async () => {
    repository.findRoleByName.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      RegistrationRoleUnavailableError,
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('propagates a uniqueness race as a registration conflict', async () => {
    repository.create.mockRejectedValue(new RegistrationConflictError());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      RegistrationConflictError,
    );
  });
});
