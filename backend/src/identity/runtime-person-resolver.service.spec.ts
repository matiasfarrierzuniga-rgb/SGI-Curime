import { Prisma } from '../../generated/prisma/client';
import {
  RuntimePersonResolverService,
  personSelect,
} from './runtime-person-resolver.service';

const input = {
  identificationType: 'NATIONAL',
  identification: '123456789',
  firstName: 'Ana',
  firstSurname: 'Rodríguez',
  secondSurname: 'Mora',
};

const person = {
  id: 1,
  firstName: 'Ana',
  firstSurname: 'Rodríguez',
  secondSurname: 'Mora',
  identification: '123456789',
  identificationType: 'NATIONAL',
  normalizedIdentification: '123456789',
};

describe('RuntimePersonResolverService', () => {
  const database = {
    person: { findMany: jest.fn(), create: jest.fn() },
  };
  const resolver = new RuntimePersonResolverService(database as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a new Person using only canonical identity fields', async () => {
    database.person.findMany.mockResolvedValue([]);
    database.person.create.mockResolvedValue(person);

    await expect(resolver.resolve(input, database as never)).resolves.toEqual({
      status: 'PERSON_CREATED',
      person,
      profileEnrichmentRequired: false,
    });
    expect(database.person.create).toHaveBeenCalledWith({
      data: {
        firstName: 'Ana',
        firstSurname: 'Rodríguez',
        secondSurname: 'Mora',
        identification: '123456789',
        identificationType: 'NATIONAL',
        normalizedIdentification: '123456789',
      },
      select: personSelect,
    });
  });

  it('reuses one compatible Person without mutation', async () => {
    database.person.findMany.mockResolvedValue([person]);

    await expect(resolver.resolve(input, database as never)).resolves.toEqual({
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: false,
    });
    expect(database.person.create).not.toHaveBeenCalled();
  });

  it('returns identity conflict without mutation', async () => {
    database.person.findMany.mockResolvedValue([
      { ...person, firstName: 'Different' },
    ]);

    await expect(resolver.resolve(input, database as never)).resolves.toEqual({
      status: 'IDENTITY_CONFLICT',
      conflictFields: ['firstName'],
    });
    expect(database.person.create).not.toHaveBeenCalled();
  });

  it('returns corruption when multiple rows match the logical key', async () => {
    database.person.findMany.mockResolvedValue([person, { ...person, id: 2 }]);

    await expect(resolver.resolve(input, database as never)).resolves.toEqual({
      status: 'IDENTITY_DUPLICATE_CORRUPTION',
      matchingPersonCount: 2,
    });
  });

  it('converts one P2002 create race into compatible reuse', async () => {
    database.person.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([person]);
    database.person.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique race', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    await expect(resolver.resolve(input, database as never)).resolves.toEqual({
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: false,
    });
    expect(database.person.findMany).toHaveBeenCalledTimes(2);
  });

  it('does not query Person or any manifest for invalid input', async () => {
    await expect(
      resolver.resolve({ ...input, identification: '' }, database as never),
    ).resolves.toEqual({
      status: 'IDENTITY_INCOMPLETE',
      missingFields: ['identification'],
    });
    expect(database.person.findMany).not.toHaveBeenCalled();
    expect(Object.keys(database)).toEqual(['person']);
  });

  it('does not use email as identity input', async () => {
    database.person.findMany.mockResolvedValue([person]);
    await resolver.resolve(
      { ...input, email: 'other@example.test' } as typeof input,
      database as never,
    );

    expect(database.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          identificationType: 'NATIONAL',
          normalizedIdentification: '123456789',
        },
      }),
    );
  });
});
