import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { ResolveBoardPrivilegeReviewUseCase } from './resolve-board-privilege-review.use-case';

const transactionClient = { marker: 'cp04-transaction' } as Prisma.TransactionClient;
const account = {
  id: 22,
  fullName: 'Cuenta revisada',
  email: 'reviewed@example.test',
  status: 'ACTIVE',
  role: { id: 1, name: 'ROLE_SYSTEM_ADMIN' },
  effectiveCapabilities: [],
};

describe('ResolveBoardPrivilegeReviewUseCase', () => {
  const repository = { withTransaction: jest.fn() };
  const audit = {
    lockBoardPrivilegeReview: jest.fn(),
    log: jest.fn(),
    recordBoardPrivilegeReviewResolution: jest.fn(),
    findBoardPrivilegeReview: jest.fn(),
    findBoardPrivilegeReviews: jest.fn(),
  };
  const changeUserRole = { executeInTransaction: jest.fn() };
  let useCase: ResolveBoardPrivilegeReviewUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ResolveBoardPrivilegeReviewUseCase(
      audit as never,
      changeUserRole as never,
      repository as never,
    );
    repository.withTransaction.mockImplementation(
      (work: (repo: unknown, client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(repository, transactionClient),
    );
    audit.lockBoardPrivilegeReview.mockResolvedValue({ id: 8, account, resolution: null });
    audit.findBoardPrivilegeReview.mockResolvedValue({ id: 8 });
    audit.log.mockResolvedValue(undefined);
    changeUserRole.executeInTransaction.mockResolvedValue(account);
    audit.recordBoardPrivilegeReviewResolution.mockResolvedValue({ id: 9 });
  });

  it('uses one transaction client for role change, role audit, and resolution', async () => {
    changeUserRole.executeInTransaction.mockImplementationOnce(
      async (...args: unknown[]) =>
        (args[5] as { record: (event: unknown) => Promise<void> }).record({
          action: 'USER_ROLE_CHANGED',
        }),
    );
    await useCase.execute(
      8,
      { decision: 'ROLE_CHANGED', justification: 'Cambio revisado', roleId: 2 },
      7,
      { ipAddress: '127.0.0.1' },
    );

    expect(audit.lockBoardPrivilegeReview).toHaveBeenCalledWith(8, transactionClient);
    expect(changeUserRole.executeInTransaction).toHaveBeenCalledWith(
      repository,
      22,
      2,
      7,
      { ipAddress: '127.0.0.1' },
      expect.objectContaining({ record: expect.any(Function) }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      { action: 'USER_ROLE_CHANGED' },
      transactionClient,
    );
    expect(audit.recordBoardPrivilegeReviewResolution).toHaveBeenCalledWith(
      8,
      7,
      'ROLE_CHANGED',
      'Cambio revisado',
      { previousRoleId: 1, newRoleId: 2 },
      { ipAddress: '127.0.0.1' },
      transactionClient,
    );
  });

  it('maps only Prisma P2034 to a controlled conflict', async () => {
    repository.withTransaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('serialization failure', {
        code: 'P2034',
        clientVersion: '7.9.1',
      }),
    );

    await expect(
      useCase.execute(8, { decision: 'NO_CHANGE', justification: 'Sin cambio' }, 7, {}),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('propagates non-P2034 transaction errors unchanged', async () => {
    const failure = new InternalServerErrorException('audit persistence failed');
    repository.withTransaction.mockRejectedValueOnce(failure);

    await expect(
      useCase.execute(8, { decision: 'NO_CHANGE', justification: 'Sin cambio' }, 7, {}),
    ).rejects.toBe(failure);
  });

  it('propagates a resolution write failure so transaction owner can roll back', async () => {
    const failure = new InternalServerErrorException('resolution write failed');
    audit.recordBoardPrivilegeReviewResolution.mockRejectedValueOnce(failure);

    await expect(
      useCase.execute(
        8,
        { decision: 'ROLE_CHANGED', justification: 'Cambio revisado', roleId: 2 },
        7,
        {},
      ),
    ).rejects.toBe(failure);
  });

  it('propagates a role audit failure so transaction owner can roll back', async () => {
    const failure = new InternalServerErrorException('role audit failed');
    audit.log.mockRejectedValueOnce(failure);
    changeUserRole.executeInTransaction.mockImplementationOnce(
      async (...args: unknown[]) =>
        (args[5] as { record: (event: unknown) => Promise<void> }).record({
          action: 'USER_ROLE_CHANGED',
        }),
    );

    await expect(
      useCase.execute(
        8,
        { decision: 'ROLE_CHANGED', justification: 'Cambio revisado', roleId: 2 },
        7,
        {},
      ),
    ).rejects.toBe(failure);
    expect(audit.recordBoardPrivilegeReviewResolution).not.toHaveBeenCalled();
  });

  it('rejects a previously resolved review', async () => {
    audit.lockBoardPrivilegeReview.mockResolvedValueOnce({
      id: 8,
      account,
      resolution: { id: 9 },
    });

    await expect(
      useCase.execute(8, { decision: 'NO_CHANGE', justification: 'Sin cambio' }, 7, {}),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records NO_CHANGE for a person without an account', async () => {
    audit.lockBoardPrivilegeReview.mockResolvedValueOnce({
      id: 8,
      account: null,
      resolution: null,
    });

    await useCase.execute(8, { decision: 'NO_CHANGE', justification: 'Sin cuenta SGI' }, 7, {});

    expect(changeUserRole.executeInTransaction).not.toHaveBeenCalled();
    expect(audit.recordBoardPrivilegeReviewResolution).toHaveBeenCalledWith(
      8,
      7,
      'NO_CHANGE',
      'Sin cuenta SGI',
      null,
      {},
      transactionClient,
    );
  });
});
