import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  DonationMethod,
  DonationStatus,
  FinancialMovementSource,
  FinancialMovementType,
  Prisma,
} from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { DonationsService } from './donations.service';

describe('DonationsService', () => {
  const actorId = 17;
  const context = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };
  const dto = {
    donorName: '  Persona donante  ',
    donorIdentification: '  1-2345-6789  ',
    amount: '25000.00',
    method: DonationMethod.SINPE_MOVIL,
    reference: '  SINPE-100  ',
    description: '  Aporte mensual  ',
    receivedAt: '2026-09-09T16:00:00.000Z',
  };
  const receivedAt = new Date(dto.receivedAt);
  const createdDonation = {
    id: 41,
    donorName: 'Persona donante',
    donorIdentification: '1-2345-6789',
    amount: new Prisma.Decimal(dto.amount),
    currency: 'CRC',
    method: dto.method,
    reference: 'SINPE-100',
    description: 'Aporte mensual',
    receivedAt,
    status: DonationStatus.CONFIRMED,
    recordedById: actorId,
    originalMovementId: null,
    createdAt: receivedAt,
    updatedAt: receivedAt,
  };
  const movement = { id: 84 };
  const originalMovement = {
    id: movement.id,
    type: FinancialMovementType.INCOME,
    source: FinancialMovementSource.DONATION,
    sourceId: createdDonation.id,
    amount: new Prisma.Decimal(dto.amount),
    currency: 'CRC',
  };
  const reversalMovement = { id: 85 };
  const linkedDonation = {
    ...createdDonation,
    originalMovementId: movement.id,
  };
  const donationWithRelations = {
    ...linkedDonation,
    cancelledById: null,
    cancelledAt: null,
    cancellationReason: null,
    reversalMovementId: null,
    recordedBy: { id: actorId, fullName: 'Tesorero' },
    cancelledBy: null,
  };
  const donationDetail = {
    ...donationWithRelations,
    originalMovement: movement,
  };
  const cancelledDonation = {
    ...linkedDonation,
    status: DonationStatus.CANCELLED,
    cancelledAt: new Date('2026-09-10T10:00:00.000Z'),
    cancelledById: actorId,
    cancellationReason: 'Registro duplicado',
    reversalMovementId: reversalMovement.id,
  };
  const tx = {
    donation: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    financialMovement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(),
    donation: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const audit = { log: jest.fn() };
  let service: DonationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((work) =>
      Array.isArray(work) ? Promise.all(work) : work(tx),
    );
    tx.donation.create.mockResolvedValue(createdDonation);
    tx.financialMovement.create.mockResolvedValue(movement);
    tx.donation.update.mockResolvedValue(linkedDonation);
    tx.donation.findUnique.mockResolvedValue(linkedDonation);
    audit.log.mockResolvedValue({ id: 1 });
    tx.financialMovement.findUnique.mockResolvedValue(originalMovement);
    tx.financialMovement.findMany.mockResolvedValue([{ id: movement.id }]);
    tx.financialMovement.update.mockResolvedValue(movement);
    tx.donation.delete.mockResolvedValue(linkedDonation);
    tx.financialMovement.delete.mockResolvedValue(originalMovement);
    prisma.donation.findMany.mockResolvedValue([donationWithRelations]);
    prisma.donation.count.mockResolvedValue(1);
    prisma.donation.findUnique.mockResolvedValue(donationDetail);
    service = new DonationsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  it('creates a confirmed donation and linked income movement atomically', async () => {
    await expect(service.create(dto, actorId, context)).resolves.toMatchObject({
      id: createdDonation.id,
      amount: '25000.00',
      originalMovementId: movement.id,
      recordedById: actorId,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.donation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: expect.any(Prisma.Decimal),
          currency: 'CRC',
          status: DonationStatus.CONFIRMED,
          recordedById: actorId,
          originalMovementId: null,
        }),
      }),
    );
    expect(tx.financialMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: FinancialMovementType.INCOME,
          source: FinancialMovementSource.DONATION,
          sourceId: createdDonation.id,
          amount: expect.any(Prisma.Decimal),
          currency: 'CRC',
          occurredAt: receivedAt,
          recordedById: actorId,
        }),
      }),
    );
    expect(tx.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: createdDonation.id },
        data: { originalMovementId: movement.id },
      }),
    );
  });

  it.each(['0', '-1.00'])('rejects invalid donation amount %s', async (amount) => {
    await expect(service.create({ ...dto, amount }, actorId)).rejects.toEqual(
      new BadRequestException('INVALID_DONATION_AMOUNT'),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('normalizes empty optional strings to null', async () => {
    await service.create(
      {
        ...dto,
        donorName: '  ',
        donorIdentification: ' ',
        reference: '',
        description: '   ',
      },
      actorId,
    );

    expect(tx.donation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          donorName: null,
          donorIdentification: null,
          reference: null,
          description: null,
        }),
      }),
    );
  });

  it('does not update or audit when movement creation fails', async () => {
    tx.financialMovement.create.mockRejectedValueOnce(
      new Error('movement creation failed'),
    );

    await expect(service.create(dto, actorId)).rejects.toThrow(
      'movement creation failed',
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.donation.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('writes DONATION_CREATED audit event through transaction client', async () => {
    await service.create(dto, actorId, context);

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: actorId,
        action: AuditAction.DONATION_CREATED,
        module: 'DONATIONS',
        entityType: 'Donation',
        entityId: createdDonation.id,
        details: {
          amount: '25000.00',
          method: DonationMethod.SINPE_MOVIL,
          originalMovementId: movement.id,
        },
        ...context,
      }),
      tx,
    );
  });

  it('returns a paginated donation list with deterministic ordering', async () => {
    await expect(
      service.findAll({ page: 2, limit: 10 }),
    ).resolves.toMatchObject({
      data: [expect.objectContaining({ amount: '25000.00' })],
      total: 1,
      page: 2,
      limit: 10,
    });

    expect(prisma.donation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
        skip: 10,
        take: 10,
      }),
    );
  });

  it('filters list results by status, method, and date range', async () => {
    await service.findAll({
      status: DonationStatus.CONFIRMED,
      method: DonationMethod.CASH,
      dateFrom: '2026-09-01T00:00:00.000Z',
      dateTo: '2026-09-30T23:59:59.999Z',
      page: 1,
      limit: 20,
    });

    expect(prisma.donation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: DonationStatus.CONFIRMED,
          method: DonationMethod.CASH,
          receivedAt: {
            gte: new Date('2026-09-01T00:00:00.000Z'),
            lte: new Date('2026-09-30T23:59:59.999Z'),
          },
        }),
      }),
    );
  });

  it.each(['donorName', 'donorIdentification', 'reference'] as const)(
    'searches by %s',
    async (field) => {
      await service.findAll({ search: '  sinpe-100  ', page: 1, limit: 20 });

      expect(prisma.donation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                [field]: { contains: 'sinpe-100', mode: 'insensitive' },
              }),
            ]),
          }),
        }),
      );
    },
  );

  it('treats blank search as absent', async () => {
    await service.findAll({ search: '  ', page: 1, limit: 20 });

    expect(prisma.donation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: undefined }),
      }),
    );
  });

  it('rejects an invalid date range before querying', async () => {
    await expect(
      service.findAll({
        dateFrom: '2026-09-10T00:00:00.000Z',
        dateTo: '2026-09-09T00:00:00.000Z',
        page: 1,
        limit: 20,
      }),
    ).rejects.toEqual(new BadRequestException('INVALID_DONATION_DATE_RANGE'));
    expect(prisma.donation.findMany).not.toHaveBeenCalled();
  });

  it('returns donation detail with cancellation fields and serialized amount', async () => {
    const cancelledDetail = {
      ...donationDetail,
      status: DonationStatus.CANCELLED,
      cancelledById: 18,
      cancelledAt: new Date('2026-09-10T10:00:00.000Z'),
      cancellationReason: 'Duplicate record',
      reversalMovementId: 85,
      cancelledBy: { id: 18, fullName: 'Administrador' },
    };
    prisma.donation.findUnique.mockResolvedValueOnce(cancelledDetail);

    await expect(service.findOne(linkedDonation.id)).resolves.toMatchObject({
      id: linkedDonation.id,
      amount: '25000.00',
      status: DonationStatus.CANCELLED,
      cancelledBy: { id: 18, fullName: 'Administrador' },
      cancellationReason: 'Duplicate record',
      reversalMovementId: 85,
    });
  });

  it('returns DONATION_NOT_FOUND when detail does not exist', async () => {
    prisma.donation.findUnique.mockResolvedValueOnce(null);

    await expect(service.findOne(999)).rejects.toEqual(
      new NotFoundException('DONATION_NOT_FOUND'),
    );
  });

  it('detects a persisted donation without original movement', async () => {
    prisma.donation.findUnique.mockResolvedValueOnce({
      ...donationDetail,
      originalMovementId: null,
      originalMovement: null,
    });

    await expect(service.findOne(linkedDonation.id)).rejects.toEqual(
      new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_MISSING'),
    );
  });

  it.each([
    ['donorName', '  Nuevo donante  ', 'Nuevo donante'],
    ['donorIdentification', '  9-9999-9999  ', '9-9999-9999'],
    ['method', DonationMethod.CASH, DonationMethod.CASH],
  ] as const)('edits %s', async (field, value, expected) => {
    await service.update(linkedDonation.id, { [field]: value }, actorId, context);

    expect(tx.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ [field]: expected }) }),
    );
  });

  it.each([
    ['reference', '  ', null],
    ['description', '  Nota actualizada  ', 'Nota actualizada'],
  ] as const)('normalizes %s', async (field, value, expected) => {
    await service.update(linkedDonation.id, { [field]: value }, actorId);

    expect(tx.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ [field]: expected }) }),
    );
  });

  it('edits amount and synchronizes original movement amount', async () => {
    tx.donation.update.mockResolvedValueOnce({
      ...linkedDonation,
      amount: new Prisma.Decimal('30000.50'),
    });

    await expect(
      service.update(linkedDonation.id, { amount: '30000.50' }, actorId),
    ).resolves.toMatchObject({ amount: '30000.50' });

    expect(tx.financialMovement.update).toHaveBeenCalledWith({
      where: { id: movement.id },
      data: { amount: new Prisma.Decimal('30000.50'), occurredAt: undefined },
    });
  });

  it('edits receivedAt and synchronizes original movement occurredAt', async () => {
    const updatedAt = '2026-09-11T16:00:00.000Z';
    await service.update(linkedDonation.id, { receivedAt: updatedAt }, actorId);

    expect(tx.financialMovement.update).toHaveBeenCalledWith({
      where: { id: movement.id },
      data: { amount: undefined, occurredAt: new Date(updatedAt) },
    });
  });

  it('updates amount and receivedAt in one transaction', async () => {
    await service.update(
      linkedDonation.id,
      { amount: '30000.50', receivedAt: '2026-09-11T16:00:00.000Z' },
      actorId,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.financialMovement.update).toHaveBeenCalledTimes(1);
  });

  it.each(['0', '-1', '12.345'])('rejects invalid update amount %s', async (amount) => {
    await expect(service.update(linkedDonation.id, { amount }, actorId)).rejects.toEqual(
      new BadRequestException('INVALID_DONATION_AMOUNT'),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns DONATION_NOT_FOUND when updating a missing donation', async () => {
    tx.donation.findUnique.mockResolvedValueOnce(null);

    await expect(service.update(999, { reference: 'R' }, actorId)).rejects.toEqual(
      new NotFoundException('DONATION_NOT_FOUND'),
    );
  });

  it('rejects updates to cancelled donations', async () => {
    tx.donation.findUnique.mockResolvedValueOnce({
      ...linkedDonation,
      status: DonationStatus.CANCELLED,
    });

    await expect(service.update(linkedDonation.id, { reference: 'R' }, actorId)).rejects.toEqual(
      new ConflictException('CANCELLED_DONATION_CANNOT_BE_EDITED'),
    );
  });

  it.each([
    ['without originalMovementId', { ...linkedDonation, originalMovementId: null }, undefined],
    [
      'with original movement source other than DONATION',
      linkedDonation,
      { id: movement.id, type: FinancialMovementType.INCOME, source: FinancialMovementSource.MANUAL, sourceId: linkedDonation.id },
    ],
    [
      'with original movement sourceId for another donation',
      linkedDonation,
      { id: movement.id, type: FinancialMovementType.INCOME, source: FinancialMovementSource.DONATION, sourceId: 999 },
    ],
    [
      'with original movement type other than INCOME',
      linkedDonation,
      { id: movement.id, type: FinancialMovementType.EXPENSE, source: FinancialMovementSource.DONATION, sourceId: linkedDonation.id },
    ],
  ])('rejects donation %s', async (_description, donation, originalMovement) => {
    tx.donation.findUnique.mockResolvedValueOnce(donation);
    if (originalMovement) tx.financialMovement.findUnique.mockResolvedValueOnce(originalMovement);

    await expect(service.update(linkedDonation.id, { amount: '1.00' }, actorId)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(tx.donation.update).not.toHaveBeenCalled();
  });

  it('writes a privacy-safe DONATION_UPDATED audit event', async () => {
    await service.update(
      linkedDonation.id,
      { donorName: 'Nombre privado', donorIdentification: '1-2345-6789', amount: '1.00' },
      actorId,
      context,
    );

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.DONATION_UPDATED,
        module: 'DONATIONS',
        entityType: 'Donation',
        entityId: linkedDonation.id,
        details: { changedFields: ['donorName', 'amount'] },
        ...context,
      }),
      tx,
    );
  });

  it('does not audit a financial update when original movement update fails', async () => {
    tx.financialMovement.update.mockRejectedValueOnce(new Error('movement update failed'));

    await expect(service.update(linkedDonation.id, { amount: '1.00' }, actorId)).rejects.toThrow(
      'movement update failed',
    );
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('cancels a confirmed donation and creates its linked reversal', async () => {
    tx.financialMovement.create.mockResolvedValueOnce(reversalMovement);
    tx.donation.update.mockResolvedValueOnce(cancelledDonation);

    await expect(
      service.cancel(linkedDonation.id, { cancellationReason: '  Registro duplicado  ' }, actorId, context),
    ).resolves.toMatchObject({
      status: DonationStatus.CANCELLED,
      amount: '25000.00',
      cancelledById: actorId,
      cancellationReason: 'Registro duplicado',
      originalMovementId: movement.id,
      reversalMovementId: reversalMovement.id,
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.financialMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: FinancialMovementType.EXPENSE,
          source: FinancialMovementSource.DONATION,
          sourceId: linkedDonation.id,
          amount: originalMovement.amount,
          currency: originalMovement.currency,
          description: `Reversión de donación #${linkedDonation.id}`,
          occurredAt: expect.any(Date),
          recordedById: actorId,
        }),
      }),
    );
    expect(tx.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: DonationStatus.CANCELLED,
          cancelledAt: expect.any(Date),
          cancelledById: actorId,
          cancellationReason: 'Registro duplicado',
          reversalMovementId: reversalMovement.id,
        }),
      }),
    );
  });

  it('does not alter original income movement when cancelling', async () => {
    tx.financialMovement.create.mockResolvedValueOnce(reversalMovement);
    tx.donation.update.mockResolvedValueOnce(cancelledDonation);

    await service.cancel(linkedDonation.id, { cancellationReason: 'Duplicado' }, actorId);

    expect(tx.financialMovement.update).not.toHaveBeenCalled();
  });

  it('writes DONATION_CANCELLED audit event through transaction client', async () => {
    tx.financialMovement.create.mockResolvedValueOnce(reversalMovement);
    tx.donation.update.mockResolvedValueOnce(cancelledDonation);

    await service.cancel(linkedDonation.id, { cancellationReason: 'Duplicado' }, actorId, context);

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: actorId,
        action: AuditAction.DONATION_CANCELLED,
        module: 'DONATIONS',
        entityType: 'Donation',
        entityId: linkedDonation.id,
        details: {
          amount: '25000.00',
          originalMovementId: movement.id,
          reversalMovementId: reversalMovement.id,
        },
        ...context,
      }),
      tx,
    );
  });

  it('rejects cancellation of a missing donation', async () => {
    tx.donation.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.cancel(999, { cancellationReason: 'Duplicado' }, actorId),
    ).rejects.toEqual(new NotFoundException('DONATION_NOT_FOUND'));
  });

  it('rejects a second cancellation without creating another reversal', async () => {
    tx.donation.findUnique.mockResolvedValueOnce(cancelledDonation);

    await expect(
      service.cancel(linkedDonation.id, { cancellationReason: 'Duplicado' }, actorId),
    ).rejects.toEqual(new ConflictException('DONATION_ALREADY_CANCELLED'));
    expect(tx.financialMovement.create).not.toHaveBeenCalled();
  });

  it.each([
    ['without originalMovementId', { ...linkedDonation, originalMovementId: null }, undefined],
    ['with source other than DONATION', linkedDonation, { ...originalMovement, source: FinancialMovementSource.MANUAL }],
    ['with sourceId for another donation', linkedDonation, { ...originalMovement, sourceId: 999 }],
    ['with type other than INCOME', linkedDonation, { ...originalMovement, type: FinancialMovementType.EXPENSE }],
    ['with inconsistent amount', linkedDonation, { ...originalMovement, amount: new Prisma.Decimal('1.00') }],
    ['with inconsistent currency', linkedDonation, { ...originalMovement, currency: 'USD' }],
  ])('rejects cancellation %s', async (_description, donation, invalidMovement) => {
    tx.donation.findUnique.mockResolvedValueOnce(donation);
    if (invalidMovement) tx.financialMovement.findUnique.mockResolvedValueOnce(invalidMovement);

    await expect(
      service.cancel(linkedDonation.id, { cancellationReason: 'Duplicado' }, actorId),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(tx.financialMovement.create).not.toHaveBeenCalled();
  });

  it('does not audit when donation update fails after reversal creation', async () => {
    tx.financialMovement.create.mockResolvedValueOnce(reversalMovement);
    tx.donation.update.mockRejectedValueOnce(new Error('donation update failed'));

    await expect(
      service.cancel(linkedDonation.id, { cancellationReason: 'Duplicado' }, actorId),
    ).rejects.toThrow('donation update failed');
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('retries serialization conflicts so only successful transaction creates a reversal', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Serialization failure', {
      code: 'P2034',
      clientVersion: '7.9.1',
    });
    tx.financialMovement.create.mockResolvedValueOnce(reversalMovement);
    tx.donation.update.mockResolvedValueOnce(cancelledDonation);
    prisma.$transaction
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockImplementation((work) => work(tx));

    await service.cancel(linkedDonation.id, { cancellationReason: 'Duplicado' }, actorId);

    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(tx.financialMovement.create).toHaveBeenCalledTimes(1);
  });

  it('deletes an eligible confirmed donation and its original movement atomically', async () => {
    await expect(service.remove(linkedDonation.id, actorId, context)).resolves.toEqual({
      deleted: true,
      id: linkedDonation.id,
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.donation.delete).toHaveBeenCalledWith({ where: { id: linkedDonation.id } });
    expect(tx.financialMovement.delete).toHaveBeenCalledWith({ where: { id: movement.id } });
    expect(tx.donation.delete.mock.invocationCallOrder[0]).toBeLessThan(
      tx.financialMovement.delete.mock.invocationCallOrder[0],
    );
  });

  it('writes a privacy-safe DONATION_DELETED audit event for current actor', async () => {
    await service.remove(linkedDonation.id, actorId, context);

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: actorId,
        action: AuditAction.DONATION_DELETED,
        module: 'DONATIONS',
        entityType: 'Donation',
        entityId: linkedDonation.id,
        details: {
          amount: '25000.00',
          method: DonationMethod.SINPE_MOVIL,
          originalMovementId: movement.id,
        },
        ...context,
      }),
      tx,
    );
  });

  it('returns DONATION_NOT_FOUND when deleting a missing donation', async () => {
    tx.donation.findUnique.mockResolvedValueOnce(null);

    await expect(service.remove(999, actorId)).rejects.toEqual(
      new NotFoundException('DONATION_NOT_FOUND'),
    );
    expect(audit.log).not.toHaveBeenCalled();
  });

  it.each([
    [
      'cancelled',
      { ...linkedDonation, status: DonationStatus.CANCELLED },
      new ConflictException('CANCELLED_DONATION_CANNOT_BE_DELETED'),
    ],
    [
      'with a reversal movement',
      { ...linkedDonation, reversalMovementId: reversalMovement.id },
      new ConflictException('DONATION_HAS_FINANCIAL_EFFECTS'),
    ],
    [
      'without originalMovementId',
      { ...linkedDonation, originalMovementId: null },
      new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_MISSING'),
    ],
  ])('rejects deletion of donation %s', async (_description, donation, error) => {
    tx.donation.findUnique.mockResolvedValueOnce(donation);

    await expect(service.remove(linkedDonation.id, actorId)).rejects.toEqual(error);
    expect(tx.donation.delete).not.toHaveBeenCalled();
    expect(tx.financialMovement.delete).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it.each([
    ['without original movement', null],
    ['with source other than DONATION', { ...originalMovement, source: FinancialMovementSource.MANUAL }],
    ['with sourceId for another donation', { ...originalMovement, sourceId: 999 }],
    ['with type other than INCOME', { ...originalMovement, type: FinancialMovementType.EXPENSE }],
    ['with inconsistent amount', { ...originalMovement, amount: new Prisma.Decimal('1.00') }],
    ['with inconsistent currency', { ...originalMovement, currency: 'USD' }],
  ])('rejects deletion %s', async (_description, invalidMovement) => {
    tx.financialMovement.findUnique.mockResolvedValueOnce(invalidMovement);

    await expect(service.remove(linkedDonation.id, actorId)).rejects.toEqual(
      new InternalServerErrorException('DONATION_ORIGINAL_MOVEMENT_INVALID'),
    );
    expect(tx.financialMovement.findMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
    expect(tx.donation.delete).not.toHaveBeenCalled();
  });

  it.each([
    ['no associated donation movement', []],
    ['additional financial effects', [{ id: movement.id }, { id: reversalMovement.id }]],
    ['one associated movement different from original', [{ id: reversalMovement.id }]],
  ])('rejects deletion with %s', async (_description, movements) => {
    tx.financialMovement.findMany.mockResolvedValueOnce(movements);

    await expect(service.remove(linkedDonation.id, actorId)).rejects.toEqual(
      new ConflictException('DONATION_HAS_FINANCIAL_EFFECTS'),
    );
    expect(audit.log).not.toHaveBeenCalled();
    expect(tx.donation.delete).not.toHaveBeenCalled();
    expect(tx.financialMovement.delete).not.toHaveBeenCalled();
  });

  it('relies on transaction rollback when donation deletion fails', async () => {
    tx.donation.delete.mockRejectedValueOnce(new Error('donation delete failed'));

    await expect(service.remove(linkedDonation.id, actorId)).rejects.toThrow('donation delete failed');
    expect(tx.financialMovement.delete).not.toHaveBeenCalled();
  });

  it('relies on transaction rollback when original movement deletion fails', async () => {
    tx.financialMovement.delete.mockRejectedValueOnce(new Error('movement delete failed'));

    await expect(service.remove(linkedDonation.id, actorId)).rejects.toThrow('movement delete failed');
  });

  it('retries serialization conflicts and deletes only in successful transaction', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Serialization failure', {
      code: 'P2034',
      clientVersion: '7.9.1',
    });
    prisma.$transaction
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockImplementation((work) => work(tx));

    await service.remove(linkedDonation.id, actorId);

    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(tx.donation.delete).toHaveBeenCalledTimes(1);
    expect(tx.financialMovement.delete).toHaveBeenCalledTimes(1);
  });

  it('rejects deletion after a concurrent cancellation wins its serializable retry', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Serialization failure', {
      code: 'P2034',
      clientVersion: '7.9.1',
    });
    prisma.$transaction
      .mockRejectedValueOnce(error)
      .mockImplementation((work) => work(tx));
    tx.donation.findUnique.mockResolvedValueOnce(cancelledDonation);

    await expect(service.remove(linkedDonation.id, actorId)).rejects.toEqual(
      new ConflictException('CANCELLED_DONATION_CANNOT_BE_DELETED'),
    );
    expect(tx.donation.delete).not.toHaveBeenCalled();
    expect(tx.financialMovement.delete).not.toHaveBeenCalled();
  });
});
