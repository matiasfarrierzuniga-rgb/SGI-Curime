import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  evaluatePersonCompatibility,
  prepareRuntimePersonIdentity,
  type PreparedRuntimePersonIdentity,
  type RuntimePersonIdentityInput,
  type RuntimePersonRecord,
  type RuntimePersonResolutionResult,
} from './runtime-person-resolution';

export const personSelect = {
  id: true,
  firstName: true,
  firstSurname: true,
  secondSurname: true,
  identification: true,
  identificationType: true,
  normalizedIdentification: true,
} satisfies Prisma.PersonSelect;

export type RuntimePersonDatabase = Pick<Prisma.TransactionClient, 'person'>;
export type RuntimePersonTransactionDatabase = Pick<
  Prisma.TransactionClient,
  'person' | '$queryRaw'
>;

export class PersonLogicalIdentityRaceError extends Error {
  constructor() {
    super('Person logical identity race');
    this.name = 'PersonLogicalIdentityRaceError';
  }
}

@Injectable()
export class RuntimePersonResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    input: RuntimePersonIdentityInput,
    database: RuntimePersonDatabase = this.prisma,
  ): Promise<RuntimePersonResolutionResult> {
    const validation = prepareRuntimePersonIdentity(input);
    if (validation.status !== 'VALID') return validation;

    return this.resolvePrepared(validation.identity, database, true);
  }

  async resolveWithinTransaction(
    input: RuntimePersonIdentityInput,
    database: RuntimePersonTransactionDatabase,
  ): Promise<RuntimePersonResolutionResult> {
    const validation = prepareRuntimePersonIdentity(input);
    if (validation.status !== 'VALID') return validation;

    const logicalKey = `${validation.identity.identificationType}:${validation.identity.normalizedIdentification}`;
    await database.$queryRaw(
      Prisma.sql`SELECT 1::integer AS locked FROM (SELECT pg_advisory_xact_lock(hashtextextended(${logicalKey}, 0))) identity_lock`,
    );
    return this.resolvePrepared(validation.identity, database, false);
  }

  private async resolvePrepared(
    identity: PreparedRuntimePersonIdentity,
    database: RuntimePersonDatabase,
    canRereadAfterUniqueRace: boolean,
  ): Promise<RuntimePersonResolutionResult> {
    const existing = await this.findByIdentityKey(database, identity);
    if (existing.length > 1) {
      return {
        status: 'IDENTITY_DUPLICATE_CORRUPTION',
        matchingPersonCount: existing.length,
      };
    }
    if (existing.length === 1) {
      return this.reuse(existing[0], identity);
    }

    try {
      const person = await database.person.create({
        data: {
          firstName: identity.firstName,
          firstSurname: identity.firstSurname,
          secondSurname: identity.secondSurname,
          identification: identity.identification,
          identificationType: identity.identificationType,
          normalizedIdentification: identity.normalizedIdentification,
          phoneCountryCode: identity.phoneCountryCode,
          phoneNationalNumber: identity.phoneNationalNumber,
          address: identity.address,
        },
        select: personSelect,
      });
      return {
        status: 'PERSON_CREATED',
        person,
        profileEnrichmentRequired: false,
      };
    } catch (error) {
      if (!isUniqueConstraintRace(error)) throw error;
      if (!canRereadAfterUniqueRace) {
        throw new PersonLogicalIdentityRaceError();
      }
    }

    // Exactly one bounded re-read converts a normal unique-key race to reuse.
    const raced = await this.findByIdentityKey(database, identity);
    if (raced.length > 1) {
      return {
        status: 'IDENTITY_DUPLICATE_CORRUPTION',
        matchingPersonCount: raced.length,
      };
    }
    if (raced.length === 1) return this.reuse(raced[0], identity);
    throw new Error('Person unique-key race could not be resolved.');
  }

  private findByIdentityKey(
    database: RuntimePersonDatabase,
    identity: PreparedRuntimePersonIdentity,
  ): Promise<RuntimePersonRecord[]> {
    return database.person.findMany({
      where: {
        identificationType: identity.identificationType,
        normalizedIdentification: identity.normalizedIdentification,
      },
      select: personSelect,
    });
  }

  private reuse(
    person: RuntimePersonRecord,
    identity: PreparedRuntimePersonIdentity,
  ): RuntimePersonResolutionResult {
    const compatibility = evaluatePersonCompatibility(person, identity);
    if (compatibility.status === 'IDENTITY_CONFLICT') return compatibility;
    return {
      status: 'PERSON_REUSED',
      person,
      profileEnrichmentRequired: compatibility.profileEnrichmentRequired,
    };
  }
}

function isUniqueConstraintRace(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
