import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuditAction } from '../../../audit/audit-actions';
import { ActivateAccountUseCase } from './activate-account.use-case';

const activationToken = {
  id: 10,
  userId: 5,
  usedAt: null,
  expiresAt: new Date(Date.now() + 60 * 60_000),
  userStatus: 'INACTIVE',
};

describe('ActivateAccountUseCase', () => {
  const repository = {
    findActivationToken: jest.fn(),
    withTransaction: jest.fn(),
  };
  const hasher = { hash: jest.fn(), compare: jest.fn() };
  const audit = { record: jest.fn() };
  const tx = {
    claimActivationToken: jest.fn(),
    activateUser: jest.fn(),
  };
  let useCase: ActivateAccountUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ActivateAccountUseCase(repository as never, hasher, audit);
    repository.findActivationToken.mockResolvedValue(activationToken);
    repository.withTransaction.mockImplementation(
      (work: (t: typeof tx) => Promise<unknown>) => work(tx),
    );
    tx.claimActivationToken.mockResolvedValue(true);
    tx.activateUser.mockResolvedValue(true);
    hasher.hash.mockResolvedValue('hashed-password');
  });

  it('throws BadRequestException when passwords do not match', async () => {
    await expect(
      useCase.execute('token', 'Password1!', 'Other1!'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findActivationToken).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for an invalid token', async () => {
    repository.findActivationToken.mockResolvedValueOnce(null);

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Invalid activation token');
  });

  it('throws ConflictException when the token was already used', async () => {
    repository.findActivationToken.mockResolvedValueOnce({
      ...activationToken,
      usedAt: new Date(),
    });

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws BadRequestException when the token has expired', async () => {
    repository.findActivationToken.mockResolvedValueOnce({
      ...activationToken,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Activation token has expired');
  });

  it('throws ConflictException when the account is not INACTIVE', async () => {
    repository.findActivationToken.mockResolvedValueOnce({
      ...activationToken,
      userStatus: 'ACTIVE',
    });

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Account cannot be activated');
  });

  it('throws ConflictException when the claim fails in the transaction', async () => {
    tx.claimActivationToken.mockResolvedValueOnce(false);

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Activation token is no longer valid');
    expect(tx.activateUser).not.toHaveBeenCalled();
  });

  it('throws ConflictException when the user cannot be activated', async () => {
    tx.activateUser.mockResolvedValueOnce(false);

    await expect(
      useCase.execute('token', 'Password1!', 'Password1!'),
    ).rejects.toThrow('Account cannot be activated');
  });

  it('hashes the password, activates the account and audits', async () => {
    const result = await useCase.execute('token', 'Password1!', 'Password1!', {
      ipAddress: '127.0.0.1',
    });

    expect(repository.findActivationToken).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f]{64}$/),
    );
    expect(hasher.hash).toHaveBeenCalledWith('Password1!');
    expect(tx.claimActivationToken).toHaveBeenCalledWith(10, expect.any(Date));
    expect(tx.activateUser).toHaveBeenCalledWith(5, 'hashed-password');
    expect(audit.record).toHaveBeenCalledWith({
      userId: 5,
      action: AuditAction.ACCOUNT_ACTIVATED,
      module: 'AUTH',
      entityType: 'User',
      entityId: 5,
      ipAddress: '127.0.0.1',
    });
    expect(result).toEqual({ message: 'Account activated successfully' });
  });
});
