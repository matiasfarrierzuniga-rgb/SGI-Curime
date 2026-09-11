/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { hasCapability } from '../auth';
import { CreateAssemblyDto } from './dto/assembly.dto';
import {
  AssembliesService,
  calculateRequiredCount,
} from './assemblies.service';

const assembly = {
  id: 1,
  title: 'Asamblea general',
  type: null,
  date: new Date('2026-09-20T18:00:00Z'),
  place: 'Salón comunal',
  description: null,
  status: 'SCHEDULED',
  quorumType: 'FIXED',
  quorumValue: 1,
  convocationsLockedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

function prismaMock(overrides: Record<string, unknown> = {}) {
  const tx = {
    assembly: {
      create: jest.fn().mockResolvedValue(assembly),
      update: jest.fn().mockResolvedValue(assembly),
      delete: jest.fn(),
    },
    assemblyConvocation: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    assemblyAttendance: { count: jest.fn().mockResolvedValue(0) },
    absenceJustification: { count: jest.fn().mockResolvedValue(0) },
  };
  const prisma = {
    assembly: {
      findUnique: jest.fn().mockResolvedValue(assembly),
      create: jest.fn(),
      update: jest.fn(),
    },
    affiliate: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn() },
    user: { findUnique: jest.fn() },
    assemblyConvocation: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    assemblyAttendance: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    },
    absenceJustification: { count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn(async (value: unknown) =>
      typeof value === 'function'
        ? (value as (client: typeof tx) => unknown)(tx)
        : Promise.all(value as Promise<unknown>[]),
    ),
    ...overrides,
  };
  return { prisma, tx };
}

const audit = { log: jest.fn().mockResolvedValue(undefined) };
const serviceFor = (prisma: unknown) =>
  new AssembliesService(prisma as never, audit as never);

describe('Assemblies authorization and DTO validation', () => {
  it('grants create/manage only to Administrador', () => {
    expect(hasCapability('Administrador', 'adm.assemblies.manage')).toBe(true);
    expect(hasCapability('Vecino/Afiliado', 'adm.assemblies.manage')).toBe(
      false,
    );
    expect(
      hasCapability('Miembro de Junta Directiva', 'adm.assemblies.manage'),
    ).toBe(false);
  });

  it.each([
    ['FIXED', 0],
    ['FIXED', -1],
    ['PERCENTAGE', 0],
    ['PERCENTAGE', 101],
  ])('rejects invalid %s quorum %s', async (quorumType, quorumValue) => {
    const { prisma } = prismaMock();
    await expect(
      serviceFor(prisma).create(
        {
          title: 'Asamblea',
          date: new Date(),
          place: 'Salón',
          quorumType: quorumType as 'FIXED' | 'PERCENTAGE',
          quorumValue,
        },
        9,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['FIXED', 12],
    ['PERCENTAGE', 50],
  ])('accepts valid %s quorum', async (quorumType, quorumValue) => {
    const dto = plainToInstance(CreateAssemblyDto, {
      title: 'Asamblea',
      date: '2026-09-20T18:00:00Z',
      place: 'Salón',
      quorumType,
      quorumValue,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('creates and audits an assembly transactionally', async () => {
    const { prisma, tx } = prismaMock();
    await serviceFor(prisma).create(
      {
        title: 'Asamblea',
        date: new Date(),
        place: 'Salón',
        quorumType: 'FIXED',
        quorumValue: 1,
      },
      9,
    );
    expect(tx.assembly.create).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 9, action: 'ASSEMBLY_CREATED' }),
      tx,
    );
  });
});

describe('Assembly convocations', () => {
  const eligible = { id: 7, roleId: 3, role: { name: 'Fiscal' } };

  it('accepts an active affiliate with an active role and snapshots its name', async () => {
    const { prisma, tx } = prismaMock();
    prisma.affiliate.findMany.mockResolvedValue([eligible]);
    await serviceFor(prisma).replaceConvocations(1, [7], 9);
    expect(prisma.affiliate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          roleId: { not: null },
          role: { isActive: true },
        }),
      }),
    );
    expect(tx.assemblyConvocation.createMany).toHaveBeenCalledWith({
      data: [
        {
          assemblyId: 1,
          affiliateId: 7,
          roleId: 3,
          roleNameSnapshot: 'Fiscal',
        },
      ],
    });
  });

  it.each(['INACTIVE affiliate', 'null roleId', 'inactive role'])(
    'rejects an ineligible affiliate: %s',
    async () => {
      const { prisma } = prismaMock();
      prisma.affiliate.findMany.mockResolvedValue([]);
      await expect(
        serviceFor(prisma).replaceConvocations(1, [7], 9),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('rejects duplicate affiliate ids', async () => {
    const { prisma } = prismaMock();
    await expect(
      serviceFor(prisma).replaceConvocations(1, [7, 7], 9),
    ).rejects.toThrow('Duplicate affiliates');
  });

  it('is editable while scheduled and unlocked', async () => {
    const { prisma, tx } = prismaMock();
    prisma.affiliate.findMany.mockResolvedValue([eligible]);
    await expect(
      serviceFor(prisma).replaceConvocations(1, [7], 9),
    ).resolves.toEqual([]);
    expect(tx.assemblyConvocation.deleteMany).toHaveBeenCalled();
  });

  it.each([
    [{ convocationsLockedAt: new Date() }, 'explicit lock'],
    [{ status: 'COMPLETED' }, 'completed'],
    [{ status: 'CANCELLED' }, 'cancelled'],
  ])('rejects replacement when %s', async (change) => {
    const { prisma } = prismaMock();
    prisma.assembly.findUnique.mockResolvedValue({ ...assembly, ...change });
    await expect(
      serviceFor(prisma).replaceConvocations(1, [], 9),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps the persisted role snapshot when the current role changes', async () => {
    const { prisma } = prismaMock();
    prisma.assemblyConvocation.findMany.mockResolvedValue([
      {
        id: 1,
        roleNameSnapshot: 'Fiscal',
        roleId: 3,
        affiliate: { id: 7, fullName: 'Ana' },
      },
    ]);
    const result = await serviceFor(prisma).getConvocations(1);
    expect(result[0].roleNameSnapshot).toBe('Fiscal');
  });

  it('locks convocations when status changes to CANCELLED', async () => {
    const { prisma, tx } = prismaMock();
    await serviceFor(prisma).update(1, { status: 'CANCELLED' }, 9);
    expect(tx.assembly.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CANCELLED',
          convocationsLockedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('explicitly locks through the domain service', async () => {
    const { prisma, tx } = prismaMock();
    await serviceFor(prisma).lockConvocations(1, 9);
    expect(tx.assembly.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { convocationsLockedAt: expect.any(Date) },
      }),
    );
  });
});

describe('Assembly lifecycle, deletion and attendance', () => {
  it('starts a scheduled assembly with convocations and freezes it', async () => {
    const { prisma, tx } = prismaMock();
    prisma.assemblyConvocation.count.mockResolvedValue(2);
    await serviceFor(prisma).start(1, 9);
    expect(tx.assembly.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'IN_PROGRESS', convocationsLockedAt: expect.any(Date) },
      }),
    );
  });

  it('requires convocations and rejects double start', async () => {
    const { prisma } = prismaMock();
    await expect(serviceFor(prisma).start(1, 9)).rejects.toThrow(
      'At least one',
    );
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      status: 'IN_PROGRESS',
      convocationsLockedAt: new Date(),
    });
    await expect(serviceFor(prisma).start(1, 9)).rejects.toThrow(
      'Only a scheduled',
    );
  });

  it('deletes an eligible scheduled assembly and its convocations transactionally', async () => {
    const { prisma, tx } = prismaMock();
    tx.assemblyConvocation.count.mockResolvedValue(2);
    await expect(serviceFor(prisma).remove(1, 9)).resolves.toEqual({
      id: 1,
      deleted: true,
    });
    expect(tx.assemblyConvocation.deleteMany).toHaveBeenCalledWith({
      where: { assemblyId: 1 },
    });
    expect(tx.assembly.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it.each([
    ['attendance', { attendance: 1 }],
    ['justification', { justification: 1 }],
    ['completed', { status: 'COMPLETED' }],
    ['started', { locked: true }],
  ])('rejects deletion with %s history', async (_label, state) => {
    const { prisma, tx } = prismaMock();
    if (state.attendance) tx.assemblyAttendance.count.mockResolvedValue(1);
    if (state.justification) tx.absenceJustification.count.mockResolvedValue(1);
    if (state.status)
      prisma.assembly.findUnique.mockResolvedValue({
        ...assembly,
        status: state.status,
      });
    if (state.locked)
      prisma.assembly.findUnique.mockResolvedValue({
        ...assembly,
        convocationsLockedAt: new Date(),
      });
    await expect(serviceFor(prisma).remove(1, 9)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('records PRESENT or ABSENT only for convocations while in progress', async () => {
    const { prisma } = prismaMock();
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      status: 'IN_PROGRESS',
      convocationsLockedAt: new Date(),
    });
    prisma.assemblyConvocation.count.mockResolvedValue(1);
    await serviceFor(prisma).recordAttendance(
      1,
      { entries: [{ affiliateId: 7, status: 'PRESENT' }] },
      9,
    );
    expect(prisma.assemblyAttendance.upsert).toHaveBeenCalled();
  });

  it('rejects attendance before start, after completion, for non-convoked people and manual JUSTIFIED', async () => {
    const { prisma } = prismaMock();
    const service = serviceFor(prisma);
    await expect(
      service.recordAttendance(
        1,
        { entries: [{ affiliateId: 7, status: 'PRESENT' }] },
        9,
      ),
    ).rejects.toThrow('in progress');
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      status: 'IN_PROGRESS',
      convocationsLockedAt: new Date(),
    });
    await expect(
      service.recordAttendance(
        1,
        { entries: [{ affiliateId: 7, status: 'PRESENT' }] },
        9,
      ),
    ).rejects.toThrow('convoked');
    await expect(
      service.recordAttendance(
        1,
        { entries: [{ affiliateId: 7, status: 'JUSTIFIED' }] },
        9,
      ),
    ).rejects.toThrow('PRESENT or ABSENT');
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      status: 'COMPLETED',
      convocationsLockedAt: new Date(),
    });
    await expect(
      service.recordAttendance(
        1,
        { entries: [{ affiliateId: 7, status: 'ABSENT' }] },
        9,
      ),
    ).rejects.toThrow('in progress');
  });

  it('allows correction during IN_PROGRESS through upsert', async () => {
    const { prisma } = prismaMock();
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      status: 'IN_PROGRESS',
      convocationsLockedAt: new Date(),
    });
    prisma.assemblyConvocation.count.mockResolvedValue(1);
    await serviceFor(prisma).recordAttendance(
      1,
      { entries: [{ affiliateId: 7, status: 'ABSENT' }] },
      9,
    );
    expect(prisma.assemblyAttendance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: 'ABSENT' }),
      }),
    );
  });

  it('requires every convocation before completing', async () => {
    const { prisma } = prismaMock();
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      status: 'IN_PROGRESS',
      convocationsLockedAt: new Date(),
    });
    prisma.assemblyConvocation.count.mockResolvedValue(3);
    prisma.assemblyAttendance.count.mockResolvedValue(2);
    await expect(serviceFor(prisma).complete(1, 9)).rejects.toThrow(
      '1 attendance',
    );
  });

  it('completes when all convocations have PRESENT or ABSENT attendance', async () => {
    const { prisma, tx } = prismaMock();
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      status: 'IN_PROGRESS',
      convocationsLockedAt: new Date(),
    });
    prisma.assemblyConvocation.count.mockResolvedValue(3);
    prisma.assemblyAttendance.count.mockResolvedValue(3);
    await serviceFor(prisma).complete(1, 9);
    expect(tx.assembly.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'COMPLETED' } }),
    );
  });
});

describe('Assembly quorum', () => {
  it.each([
    [10, 'PERCENTAGE', 50, 5],
    [11, 'PERCENTAGE', 50, 6],
    [20, 'FIXED', 12, 12],
  ] as const)('calculates required count', (count, type, value, expected) => {
    expect(calculateRequiredCount(count, type, value)).toBe(expected);
  });

  it.each([
    [6, true],
    [5, false],
  ] as const)(
    'reports reached=%s from present count %s',
    async (presentCount, reached) => {
      const { prisma } = prismaMock();
      prisma.assembly.findUnique.mockResolvedValue({
        ...assembly,
        quorumType: 'PERCENTAGE',
        quorumValue: 50,
      });
      prisma.assemblyConvocation.count.mockResolvedValue(11);
      prisma.assemblyAttendance.count.mockResolvedValue(presentCount);
      await expect(serviceFor(prisma).getQuorum(1)).resolves.toMatchObject({
        convokedCount: 11,
        presentCount,
        requiredCount: 6,
        quorumReached: reached,
      });
      expect(prisma.affiliate.count).not.toHaveBeenCalled();
    },
  );

  it('returns unavailable and invents no convocation for historical data', async () => {
    const { prisma } = prismaMock();
    prisma.assembly.findUnique.mockResolvedValue({
      ...assembly,
      quorumType: null,
      quorumValue: null,
    });
    prisma.assemblyConvocation.count.mockResolvedValue(0);
    prisma.assemblyAttendance.count.mockResolvedValue(3);
    await expect(serviceFor(prisma).getQuorum(1)).resolves.toMatchObject({
      available: false,
      convokedCount: 0,
      requiredCount: null,
      quorumReached: null,
    });
    expect(prisma.assemblyConvocation.findMany).not.toHaveBeenCalled();
  });
});

describe('My assemblies privacy', () => {
  it('resolves User -> Person -> Affiliate and filters only that affiliate', async () => {
    const { prisma } = prismaMock();
    prisma.user.findUnique.mockResolvedValue({
      person: { affiliate: { id: 7 } },
    });
    await serviceFor(prisma).findMine(42);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
    expect(prisma.assemblyConvocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { affiliateId: 7 } }),
    );
  });

  it('accepts no frontend affiliate id and returns empty without a linked affiliate', async () => {
    const { prisma } = prismaMock();
    prisma.user.findUnique.mockResolvedValue({ person: null });
    await expect(serviceFor(prisma).findMine(42)).resolves.toEqual([]);
    expect(prisma.assemblyConvocation.findMany).not.toHaveBeenCalled();
  });

  it('rejects an assembly id not convoked for the authenticated affiliate', async () => {
    const { prisma } = prismaMock();
    prisma.user.findUnique.mockResolvedValue({
      person: { affiliate: { id: 7 } },
    });
    prisma.assemblyConvocation.findUnique.mockResolvedValue(null);
    await expect(
      serviceFor(prisma).findOneAllowed(99, 42, 'Vecino/Afiliado'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns permitted detail without exposing other convocations', async () => {
    const { prisma } = prismaMock();
    prisma.user.findUnique.mockResolvedValue({
      person: { affiliate: { id: 7 } },
    });
    prisma.assemblyConvocation.findUnique.mockResolvedValue({
      roleNameSnapshot: 'Fiscal',
    });
    const result = await serviceFor(prisma).findOneAllowed(
      1,
      42,
      'Vecino/Afiliado',
    );
    expect(result).toMatchObject({ id: 1, roleNameSnapshot: 'Fiscal' });
    expect(result).not.toHaveProperty('convocations');
  });
});
