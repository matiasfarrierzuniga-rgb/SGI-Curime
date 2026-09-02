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

@Injectable()
export class RuntimePersonResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    input: RuntimePersonIdentityInput,
    database: RuntimePersonDatabase = this.prisma,
  ): Promise<RuntimePersonResolutionResult> {
    const validation = prepareRuntimePersonIdentity(input);
    if (validation.status !== 'VALID') return validation;

    const existing = await this.findByIdentityKey(
      database,
      validation.identity,
    );
    if (existing.length > 1) {
      return {
        status: 'IDENTITY_DUPLICATE_CORRUPTION',
        matchingPersonCount: existing.length,
      };
    }
    if (existing.length === 1) {
      return this.reuse(existing[0], validation.identity);
    }

    try {
      const person = await database.person.create({
        data: {
          firstName: validation.identity.firstName,
          firstSurname: validation.identity.firstSurname,
          secondSurname: validation.identity.secondSurname,
          identification: validation.identity.identification,
          identificationType: validation.identity.identificationType,
          normalizedIdentification:
            validation.identity.normalizedIdentification,
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
    }

    // Exactly one bounded re-read converts a normal unique-key race to reuse.
    const raced = await this.findByIdentityKey(database, validation.identity);
    if (raced.length > 1) {
      return {
        status: 'IDENTITY_DUPLICATE_CORRUPTION',
        matchingPersonCount: raced.length,
      };
    }
    if (raced.length === 1) return this.reuse(raced[0], validation.identity);
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
