import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVolunteerApplicationDto } from './dto/volunteer-application.dto';
import { VolunteeringApplicationsService } from './volunteering-applications.service';

const baseOpportunity = {
  id: 4,
  status: 'PUBLISHED',
  applicationDeadline: null,
  capacity: 2,
};
const application = {
  id: 8,
  opportunityId: 4,
  status: 'PENDING',
  submittedFullName: 'Ana Pérez',
  submittedEmail: 'ana@example.test',
  submittedPhone: null,
  motivation: null,
};

describe('VolunteeringApplicationsService', () => {
  const tx = {
    $queryRaw: jest.fn(),
    volunteerOpportunity: { findUnique: jest.fn() },
    volunteerApplication: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    volunteerParticipation: {
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    volunteerSession: { count: jest.fn() },
    person: { findUnique: jest.fn(), create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(),
    volunteerOpportunity: { findUnique: jest.fn() },
    volunteerApplication: { findMany: jest.fn() },
  };
  const audit = { log: jest.fn() };
  const service = new VolunteeringApplicationsService(
    prisma as never,
    audit as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    );
    tx.volunteerOpportunity.findUnique.mockResolvedValue(baseOpportunity);
    tx.volunteerParticipation.count.mockResolvedValue(0);
    tx.volunteerSession.count.mockResolvedValue(1);
    tx.volunteerApplication.findFirst.mockResolvedValue(null);
    tx.volunteerApplication.create.mockResolvedValue({ id: 8 });
    tx.volunteerApplication.findUnique.mockResolvedValue(application);
    tx.volunteerApplication.findUniqueOrThrow.mockResolvedValue({
      ...application,
      status: 'APPROVED',
    });
    tx.volunteerApplication.updateMany.mockResolvedValue({ count: 1 });
    tx.person.create.mockResolvedValue({ id: 10 });
    tx.person.findUnique.mockResolvedValue({ id: 10 });
    tx.volunteerParticipation.findUnique.mockResolvedValue(null);
  });

  it('validates name, contact alternatives, email, and Costa Rican phone', async () => {
    const validEmail = plainToInstance(CreateVolunteerApplicationDto, {
      fullName: 'Ana Pérez',
      email: '  ANA@EXAMPLE.TEST ',
    });
    expect(await validate(validEmail)).toEqual([]);
    expect(validEmail.email).toBe('ana@example.test');
    expect(
      await validate(
        plainToInstance(CreateVolunteerApplicationDto, {
          fullName: 'Ana Pérez',
          phoneCountryCode: '+506',
          phoneNationalNumber: '88888888',
        }),
      ),
    ).toEqual([]);
    for (const invalid of [
      { email: 'ana@example.test' },
      { fullName: 'Ana Pérez' },
      { fullName: 'Ana Pérez', email: 'bad' },
      {
        fullName: 'Ana Pérez',
        phoneCountryCode: '+506',
        phoneNationalNumber: '123',
      },
    ])
      expect(
        await validate(plainToInstance(CreateVolunteerApplicationDto, invalid)),
      ).not.toEqual([]);
  });

  it('accepts anonymous or authenticated submissions with the same pending contract and no personal response', async () => {
    const dto = {
      fullName: 'Ana Pérez',
      email: 'ana@example.test',
      phoneCountryCode: '+506',
      phoneNationalNumber: '88888888',
    };
    await expect(service.submit(4, dto)).resolves.toEqual({ received: true });
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.volunteerApplication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        opportunityId: 4,
        submittedFullName: 'Ana Pérez',
        submittedEmail: 'ana@example.test',
        submittedPhone: '+50688888888',
        status: 'PENDING',
      }) as unknown,
      select: { id: true },
    });
    expect(tx.volunteerParticipation.create).not.toHaveBeenCalled();
  });

  it('refuses applications when no future scheduled session remains', async () => {
    tx.volunteerSession.count.mockResolvedValueOnce(0);
    await expect(
      service.submit(4, { fullName: 'Ana Pérez', email: 'ana@example.test' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.volunteerApplication.create).not.toHaveBeenCalled();
  });

  it('rejects missing, unpublished, closed, expired, full, and duplicate opportunities', async () => {
    tx.volunteerOpportunity.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.submit(4, { fullName: 'Ana Pérez', email: 'ana@example.test' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    for (const opportunity of [
      { ...baseOpportunity, status: 'DRAFT' },
      { ...baseOpportunity, status: 'CLOSED' },
      { ...baseOpportunity, applicationDeadline: new Date('2020-01-01') },
    ]) {
      tx.volunteerOpportunity.findUnique.mockResolvedValueOnce(opportunity);
      await expect(
        service.submit(4, { fullName: 'Ana Pérez', email: 'ana@example.test' }),
      ).rejects.toBeInstanceOf(ConflictException);
    }
    tx.volunteerParticipation.count.mockResolvedValueOnce(2);
    await expect(
      service.submit(4, { fullName: 'Ana Pérez', email: 'ana@example.test' }),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.volunteerApplication.findFirst.mockResolvedValueOnce({ id: 2 });
    await expect(
      service.submit(4, { fullName: 'Ana Pérez', email: 'ana@example.test' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.volunteerApplication.create).not.toHaveBeenCalled();
  });

  it('approves atomically with an explicit new Person and confirmed participation', async () => {
    await service.approve(8, { createPerson: true }, 3);
    expect(tx.person.create).toHaveBeenCalledWith({
      data: { legacyFullName: 'Ana Pérez', email: 'ana@example.test' },
      select: { id: true },
    });
    expect(tx.volunteerApplication.updateMany).toHaveBeenCalledWith({
      where: { id: 8, status: 'PENDING' },
      data: expect.objectContaining({
        status: 'APPROVED',
        personId: 10,
        reviewedByUserId: 3,
      }) as unknown,
    });
    expect(tx.volunteerParticipation.create).toHaveBeenCalledWith({
      data: {
        applicationId: 8,
        opportunityId: 4,
        personId: 10,
        status: 'CONFIRMED',
      },
    });
    expect(tx.$queryRaw).toHaveBeenCalled();
  });

  it('blocks approval without a Person decision, full capacity, or resolved state', async () => {
    await expect(service.approve(8, {}, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    tx.volunteerParticipation.count.mockResolvedValueOnce(2);
    await expect(
      service.approve(8, { personId: 10 }, 3),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.volunteerApplication.findUnique
      .mockResolvedValueOnce({ opportunityId: 4 })
      .mockResolvedValueOnce({ ...application, status: 'APPROVED' });
    await expect(
      service.approve(8, { personId: 10 }, 3),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects pending applications with audit and prevents repeated review', async () => {
    await service.reject(8, { rejectionReason: 'Cupo no disponible' }, 3);
    expect(tx.volunteerApplication.updateMany).toHaveBeenCalledWith({
      where: { id: 8, status: 'PENDING' },
      data: expect.objectContaining({
        status: 'REJECTED',
        reviewedByUserId: 3,
      }) as unknown,
    });
    tx.volunteerApplication.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.reject(8, { rejectionReason: 'Repetido' }, 3),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
