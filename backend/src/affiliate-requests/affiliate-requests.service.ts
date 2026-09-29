import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAffiliateRequestDto } from './dto/create-affiliate-request.dto';
import { QueryAffiliateRequestsDto } from './dto/query-affiliate-requests.dto';

const select = {
  id: true,
  fullName: true,
  identification: true,
  identificationType: true,
  birthDate: true,
  gender: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
  phone: true,
  email: true,
  address: true,
  occupation: true,
  workplace: true,
  affiliationReason: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  reviewedById: true,
  reviewedBy: { select: { id: true, fullName: true, email: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AffiliateRequestSelect;

export const FUNCTIONAL_AFFILIATE_ROLES = new Set([
  'Administrador',
  'Tesorero',
  'Gestor de Inventario',
  'Vecino/Afiliado',
  'Miembro de Junta Directiva',
]);

@Injectable()
export class AffiliateRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}
  async create(
    dto: CreateAffiliateRequestDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    const created = await this.withSerializableTransaction(async (tx) => {
      const account = await tx.user.findUnique({
        where: { id: actorId },
        select: {
          id: true,
          fullName: true,
          identification: true,
          identificationType: true,
          email: true,
          phoneCountryCode: true,
          phoneNationalNumber: true,
          address: true,
          personId: true,
          person: {
            select: {
              id: true,
              firstName: true,
              firstSurname: true,
              secondSurname: true,
              identification: true,
              identificationType: true,
              phoneCountryCode: true,
              phoneNationalNumber: true,
              address: true,
            },
          },
        },
      });
      if (!account?.personId || !account.person) {
        throw new ConflictException(
          'The authenticated account has no linked person identity.',
        );
      }

      const personId = account.personId;
      const person = account.person;
      if (
        !person.firstName ||
        !person.firstSurname ||
        !person.identification ||
        !person.identificationType
      ) {
        throw new ConflictException(
          'The linked person identity is incomplete.',
        );
      }
      const fullName = personFullName(person);
      await this.assertNoAffiliateByPerson(tx, personId);
      await this.assertNoPendingRequest(tx, personId);
      const authoritativePerson = await tx.person.update({
        where: { id: personId },
        data: {
          birthDate: dto.birthDate,
          address: dto.address,
        },
        select: {
          id: true,
          birthDate: true,
          address: true,
        },
      });
      await tx.user.update({
        where: { id: account.id },
        data: {
          fullName,
          identification: person.identification,
          identificationType: person.identificationType,
          phoneCountryCode: person.phoneCountryCode,
          phoneNationalNumber: person.phoneNationalNumber,
          address: authoritativePerson.address,
        },
      });
      return tx.affiliateRequest.create({
        data: {
          fullName,
          identification: person.identification,
          identificationType: person.identificationType,
          birthDate: authoritativePerson.birthDate!,
          gender: dto.gender,
          phoneCountryCode: person.phoneCountryCode,
          phoneNationalNumber: person.phoneNationalNumber,
          email: account.email,
          address: authoritativePerson.address || '',
          occupation: dto.occupation,
          workplace: dto.workplace,
          affiliationReason: dto.affiliationReason,
          personId,
          status: 'PENDING',
        },
        select,
      });
    });
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.AFFILIATE_REQUEST_CREATED,
      module: 'AFFILIATE_REQUESTS',
      entityType: 'AffiliateRequest',
      entityId: created.id,
      ...context,
    });
    return created;
  }
  async findAll(query: QueryAffiliateRequestsDto) {
    const where: Prisma.AffiliateRequestWhereInput = {
      status: query.status,
      email: query.email,
      identification: query.identification,
      OR: query.search
        ? [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { identification: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.affiliateRequest.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.affiliateRequest.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }
  async findOne(id: number) {
    const item = await this.prisma.affiliateRequest.findUnique({
      where: { id },
      select,
    });
    if (!item) throw new NotFoundException('Affiliate request not found');
    return item;
  }
  async approve(
    id: number,
    roleId: number,
    actorId: number,
    context: AuditContext = {},
  ) {
    let result: {
      affiliate: { id: number };
      affiliateRequest: Prisma.AffiliateRequestGetPayload<{
        select: typeof select;
      }>;
    };
    try {
      result = await this.prisma.$transaction(
        async (tx) => {
          const request = await tx.affiliateRequest.findUnique({
            where: { id },
          });
          if (!request)
            throw new NotFoundException('Affiliate request not found');
          if (request.status !== RequestStatus.PENDING)
            throw new ConflictException(
              'Affiliate request has already been resolved',
            );
          if (request.personId === null)
            throw new ConflictException(
              'Unable to process affiliation request',
            );

          const [role, person] = await Promise.all([
            tx.role.findUnique({ where: { id: roleId } }),
            tx.person.findUnique({
              where: { id: request.personId },
              select: {
                id: true,
                firstName: true,
                firstSurname: true,
                secondSurname: true,
                identification: true,
                identificationType: true,
                birthDate: true,
                phoneCountryCode: true,
                phoneNationalNumber: true,
                address: true,
                user: {
                  select: {
                    id: true,
                    personId: true,
                  },
                },
              },
            }),
          ]);
          if (!role) throw new NotFoundException('Role not found');
          if (!role.isActive) throw new BadRequestException('Role is inactive');
          if (!FUNCTIONAL_AFFILIATE_ROLES.has(role.name))
            throw new BadRequestException(
              'Role is not valid for an affiliation',
            );
          const user = person?.user;
          if (!user || user.personId !== request.personId)
            throw new ConflictException(
              'The affiliation request is not linked to a user account.',
            );
          if (
            !person.firstName ||
            !person.firstSurname ||
            !person.identification ||
            !person.identificationType ||
            !person.birthDate ||
            personFullName(person) !== request.fullName ||
            person.identification !== request.identification ||
            person.identificationType !== request.identificationType ||
            person.birthDate.getTime() !== request.birthDate.getTime()
          ) {
            throw new ConflictException(
              'Affiliation identity is inconsistent.',
            );
          }
          await this.assertNoAffiliateForApproval(
            tx,
            request.personId,
            person.identification,
          );
          const affiliate = await tx.affiliate.create({
            data: {
              personId: request.personId,
              fullName: personFullName(person),
              identification: person.identification,
              identificationType: person.identificationType,
              birthDate: person.birthDate,
              gender: request.gender,
              phoneCountryCode: person.phoneCountryCode,
              phoneNationalNumber: person.phoneNationalNumber,
              email: null,
              address: person.address || request.address,
              occupation: request.occupation,
              workplace: request.workplace,
              legacyRoleId: roleId,
            },
          });
          await tx.user.update({
            where: { id: user.id },
            data: { roleId },
          });
          const claimed = await tx.affiliateRequest.updateMany({
            where: { id, status: 'PENDING' },
            data: {
              status: 'APPROVED',
              rejectionReason: null,
              reviewedAt: new Date(),
              reviewedById: actorId,
            },
          });
          if (claimed.count !== 1)
            throw new ConflictException(
              'Affiliate request has already been resolved',
            );
          await this.audit?.log(
            {
              userId: actorId,
              action: AuditAction.AFFILIATE_CREATED,
              module: 'AFFILIATES',
              entityType: 'Affiliate',
              entityId: affiliate.id,
              details: { roleId },
              ...context,
            },
            tx,
          );
          await this.audit?.log(
            {
              userId: actorId,
              action: AuditAction.AFFILIATE_REQUEST_APPROVED,
              module: 'AFFILIATE_REQUESTS',
              entityType: 'AffiliateRequest',
              entityId: id,
              details: { affiliateId: affiliate.id, roleId },
              ...context,
            },
            tx,
          );
          return {
            affiliate,
            affiliateRequest: await tx.affiliateRequest.findUniqueOrThrow({
              where: { id },
              select,
            }),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isAffiliateUniqueConflict(error)) {
        throw new ConflictException('Unable to process affiliation request');
      }
      throw error;
    }
    return result;
  }
  async reject(
    id: number,
    rejectionReason: string,
    actorId: number,
    context: AuditContext = {},
  ) {
    await this.requirePending(id);
    const result = await this.prisma.affiliateRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedById: actorId,
      },
    });
    if (result.count !== 1)
      throw new ConflictException(
        'Affiliate request has already been resolved',
      );
    const rejected = await this.findOne(id);
    await this.audit?.log({
      userId: actorId,
      action: AuditAction.AFFILIATE_REQUEST_REJECTED,
      module: 'AFFILIATE_REQUESTS',
      entityType: 'AffiliateRequest',
      entityId: id,
      ...context,
    });
    return rejected;
  }
  private async requirePending(id: number) {
    const item = await this.prisma.affiliateRequest.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Affiliate request not found');
    if (item.status !== RequestStatus.PENDING)
      throw new ConflictException(
        'Affiliate request has already been resolved',
      );
    return item;
  }
  private async withSerializableTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (!isRetriableConflict(error)) throw error;
        if (attempt === maxAttempts) {
          throw new ConflictException('Unable to process affiliation request');
        }
      }
    }
    throw new Error('Affiliate request transaction retry exhausted.');
  }
  private async assertNoPendingRequest(
    tx: Prisma.TransactionClient,
    personId: number,
  ) {
    const duplicate = await tx.affiliateRequest.findFirst({
      where: {
        status: 'PENDING',
        personId,
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('Unable to process affiliation request');
  }
  private async assertNoAffiliateByPerson(
    tx: Prisma.TransactionClient,
    personId: number,
  ) {
    const duplicate = await tx.affiliate.findFirst({
      where: {
        personId,
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('Unable to process affiliation request');
  }
  private async assertNoAffiliateForApproval(
    tx: Prisma.TransactionClient,
    personId: number,
    identification: string,
  ) {
    const duplicate = await tx.affiliate.findFirst({
      where: {
        OR: [
          { personId },
          { identification },
        ],
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('Affiliate is already registered');
  }
}

function isRetriableConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

function isAffiliateUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function personFullName(person: {
  firstName: string | null;
  firstSurname: string | null;
  secondSurname: string | null;
}): string {
  return [person.firstName, person.firstSurname, person.secondSurname]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}
