import {
  ConflictException,
  Injectable,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import {
  IdentificationType,
  Prisma,
  RequestStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivationTokenDeliveryService } from './activation-token-delivery.service';
import { ActivationTokenService } from './activation-token.service';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { ApproveUserRequestDto } from './dto/review-user-request.dto';
import { QueryUserRequestDto } from './dto/query-user-request.dto';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { RuntimePersonResolverService } from '../identity/runtime-person-resolver.service';
import {
  IDENTITY_NORMALIZATION_VERSION,
  RECONCILIATION_DECISION_VERSION,
  RECONCILIATION_MANIFEST_VERSION,
  normalizeIdentification,
  sourceFingerprint,
} from '../identity-reconciliation/identity-reconciliation';

const requestSelect = {
  id: true,
  fullName: true,
  identification: true,
  identificationType: true,
  email: true,
  phoneCountryCode: true,
  phoneNationalNumber: true,
  phone: true,
  address: true,
  reason: true,
  submittedFullName: true,
  submittedIdentification: true,
  submittedIdentificationType: true,
  submittedEmail: true,
  submittedPhone: true,
  submittedPhoneCountryCode: true,
  submittedPhoneNationalNumber: true,
  submittedAddress: true,
  submittedReason: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  reviewedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserRequestSelect;

type ApprovalPersonResolution =
  | {
      status: 'PERSON_REUSED';
      person: {
        id: number;
        firstName: string | null;
        firstSurname: string | null;
        secondSurname: string | null;
        identification: string | null;
        identificationType: string | null;
      };
    }
  | { status: 'MANUAL_REVIEW_REQUIRED'; reason: string };

type UserRequestManifestSource = {
  sourceModel: 'UserRequest';
  sourceId: number;
  identification: string;
  identificationType: string | null;
  fullName: string;
  email: string;
  phoneCountryCode: string | null;
  phoneNationalNumber: string | null;
  address: string | null;
  birthDate: null;
};

@Injectable()
export class UserRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: ActivationTokenService,
    private readonly tokenDelivery: ActivationTokenDeliveryService,
    private readonly personResolver: RuntimePersonResolverService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async create(dto: CreateUserRequestDto, context: AuditContext = {}) {
    await this.assertNoUserDuplicates(dto.email, dto.identification);
    await this.assertNoPendingDuplicates(dto.email, dto.identification);

    const { firstName, firstSurname, secondSurname, ...requestData } = dto;
    const hasStructuredName = Boolean(
      firstName || firstSurname || secondSurname,
    );
    const created = await this.prisma.$transaction(async (tx) => {
      let personId: number | undefined;
      if (hasStructuredName) {
        const resolution = await this.personResolver.findSafeExisting(
          {
            identificationType: dto.identificationType,
            identification: dto.identification,
            firstName,
            firstSurname,
            secondSurname,
            phoneCountryCode: dto.phoneCountryCode,
            phoneNationalNumber: dto.phoneNationalNumber,
            address: dto.address,
          },
          tx,
        );
        if (resolution?.status === 'PERSON_REUSED') {
          personId = resolution.person.id;
        }
      }
      return tx.userRequest.create({
        data: {
          ...requestData,
          fullName: requestData.fullName,
          submittedFullName: requestData.fullName,
          submittedIdentification: requestData.identification,
          submittedIdentificationType: requestData.identificationType,
          submittedEmail: requestData.email,
          submittedPhone: undefined,
          submittedPhoneCountryCode: requestData.phoneCountryCode,
          submittedPhoneNationalNumber: requestData.phoneNationalNumber,
          submittedAddress: requestData.address,
          submittedReason: requestData.reason,
          personId,
          status: 'PENDING',
        },
        select: requestSelect,
      });
    });
    await this.audit?.log({
      action: AuditAction.USER_REQUEST_CREATED,
      module: 'USER_REQUESTS',
      entityType: 'UserRequest',
      entityId: created.id,
      ...context,
    });
    return toUserRequestSnapshotResponse(created);
  }

  async findAll(query: QueryUserRequestDto) {
    const where: Prisma.UserRequestWhereInput = {
      status: query.status,
      email: query.email,
      identification: query.identification,
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.userRequest.findMany({
        where,
        select: requestSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.userRequest.count({ where }),
    ]);
    return {
      data: data.map(toUserRequestSnapshotResponse),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(id: number) {
    const userRequest = await this.prisma.userRequest.findUnique({
      where: { id },
      select: requestSelect,
    });
    if (!userRequest) throw new NotFoundException('User request not found');
    return toUserRequestSnapshotResponse(userRequest);
  }

  async reject(
    id: number,
    rejectionReason: string,
    reviewedById: number,
    context: AuditContext = {},
  ) {
    await this.requirePending(id);
    const result = await this.prisma.userRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedById,
      },
    });
    if (result.count !== 1) {
      throw new ConflictException('User request has already been resolved');
    }
    const rejected = await this.findOne(id);
    await this.audit?.log({
      userId: reviewedById,
      action: AuditAction.USER_REQUEST_REJECTED,
      module: 'USER_REQUESTS',
      entityType: 'UserRequest',
      entityId: id,
      ...context,
    });
    return toUserRequestSnapshotResponse(rejected);
  }

  async approve(
    id: number,
    dto: ApproveUserRequestDto,
    reviewedById: number,
    context: AuditContext = {},
  ) {
    const userRequest = await this.requirePending(id);
    await this.assertNoUserDuplicates(
      userRequest.email,
      userRequest.identification,
    );
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (!role.isActive) throw new ConflictException('Role is inactive');

    const generated = this.tokenService.generate();
    const reviewedAt = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const resolution = await this.resolvePersonForApproval(tx, userRequest);
      if (resolution.status !== 'PERSON_REUSED') {
        return { reviewOutcome: resolution };
      }
      const person = resolution.person;

      const claimed = await tx.userRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt,
          reviewedById,
          ...(userRequest.personId === null ? { personId: person.id } : {}),
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('User request has already been resolved');
      }
      if (
        (userRequest.personId !== null && person.id !== userRequest.personId) ||
        !person.firstName ||
        !person.firstSurname ||
        !person.identification ||
        !person.identificationType
      ) {
        throw new ConflictException('User request person identity is invalid');
      }
      const existingUser = await tx.user.findUnique({
        where: { personId: person.id },
        select: { id: true },
      });
      if (existingUser) {
        throw new ConflictException('Person identity already has a user');
      }
      const fullName = [
        person.firstName,
        person.firstSurname,
        person.secondSurname,
      ]
        .filter((part): part is string => Boolean(part))
        .join(' ');
      const user = await tx.user.create({
        data: {
          personId: person.id,
          fullName,
          identification: person.identification,
          identificationType: person.identificationType as IdentificationType,
          email: userRequest.email,
          phone: userRequest.phone,
          phoneCountryCode: userRequest.phoneCountryCode,
          phoneNationalNumber: userRequest.phoneNationalNumber,
          address: userRequest.address,
          passwordHash: null,
          status: 'INACTIVE',
          roleId: role.id,
        },
        select: {
          id: true,
          fullName: true,
          identification: true,
          identificationType: true,
          email: true,
          phoneCountryCode: true,
          phoneNationalNumber: true,
          phone: true,
          address: true,
          status: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      await tx.accountActivationToken.create({
        data: {
          userId: user.id,
          tokenHash: generated.tokenHash,
          expiresAt: generated.expiresAt,
        },
      });
      const approvedRequest = await tx.userRequest.findUniqueOrThrow({
        where: { id },
        select: requestSelect,
      });
      return { user, userRequest: approvedRequest };
    });

    if ('reviewOutcome' in result) {
      throw new ConflictException(
        result.reviewOutcome?.reason ??
          'User request requires institutional identity review',
      );
    }

    await this.tokenDelivery.deliver({
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      token: generated.token,
      expiresAt: generated.expiresAt,
    });
    await this.audit?.log({
      userId: reviewedById,
      action: AuditAction.USER_CREATED,
      module: 'USERS',
      entityType: 'User',
      entityId: result.user.id,
      details: { roleId: role.id },
      ...context,
    });
    await this.audit?.log({
      userId: reviewedById,
      action: AuditAction.USER_REQUEST_APPROVED,
      module: 'USER_REQUESTS',
      entityType: 'UserRequest',
      entityId: id,
      details: { createdUserId: result.user.id },
      ...context,
    });
    return {
      ...result,
      userRequest: toUserRequestSnapshotResponse(result.userRequest),
    };
  }

  private async requirePending(id: number) {
    const userRequest = await this.prisma.userRequest.findUnique({
      where: { id },
    });
    if (!userRequest) throw new NotFoundException('User request not found');
    if (userRequest.status !== RequestStatus.PENDING) {
      throw new ConflictException('User request has already been resolved');
    }
    return userRequest;
  }

  private async resolvePersonForApproval(
    tx: Prisma.TransactionClient,
    userRequest: Awaited<ReturnType<UserRequestsService['requirePending']>>,
  ): Promise<ApprovalPersonResolution> {
    if (userRequest.personId !== null) {
      const person = await tx.person.findUnique({
        where: { id: userRequest.personId },
      });
      if (!person) {
        const outcome = {
          status: 'MANUAL_REVIEW_REQUIRED' as const,
          reason: 'User request person identity is missing',
        };
        await this.persistReviewEvidence(tx, userRequest, outcome);
        return outcome;
      }
      const submittedIdentity = normalizeIdentification(
        userRequest.identificationType,
        userRequest.identification,
      );
      if (
        !submittedIdentity ||
        person.identificationType !== submittedIdentity.identificationType ||
        person.normalizedIdentification !==
          submittedIdentity.normalizedIdentification ||
        !person.firstName ||
        !person.firstSurname ||
        !person.identification
      ) {
        const outcome = {
          status: 'MANUAL_REVIEW_REQUIRED' as const,
          reason: 'User request linked Person requires institutional review',
        };
        await this.persistReviewEvidence(tx, userRequest, outcome);
        return outcome;
      }
      const outcome = { status: 'PERSON_REUSED' as const, person };
      await this.persistReviewEvidence(tx, userRequest, outcome);
      return outcome;
    }

    const outcome =
      await this.personResolver.resolveExistingForReviewWithinTransaction(
        userRequest.identificationType,
        userRequest.identification,
        tx,
      );
    await this.persistReviewEvidence(tx, userRequest, outcome);
    if (outcome.status === 'PERSON_REUSED') return outcome;
    return { status: 'MANUAL_REVIEW_REQUIRED', reason: outcome.reason };
  }

  private async persistReviewEvidence(
    tx: Prisma.TransactionClient,
    userRequest: Awaited<ReturnType<UserRequestsService['requirePending']>>,
    outcome: {
      status: string;
      person?: { id: number };
      matchingPersonCount?: number;
      reason?: string;
    },
  ) {
    const source: UserRequestManifestSource = {
      sourceModel: 'UserRequest' as const,
      sourceId: userRequest.id,
      identification: userRequest.identification,
      identificationType: userRequest.identificationType,
      fullName: userRequest.fullName,
      birthDate: null,
      email: userRequest.email,
      phoneCountryCode: userRequest.phoneCountryCode,
      phoneNationalNumber: userRequest.phoneNationalNumber,
      address: userRequest.address,
    };
    const identity = normalizeIdentification(
      source.identificationType,
      source.identification,
    );
    const safe = outcome.status === 'PERSON_REUSED';
    await tx.identityReconciliationManifest.upsert({
      where: {
        normalizationVersion_decisionVersion_sourceModel_sourceId: {
          normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
          decisionVersion: RECONCILIATION_DECISION_VERSION,
          sourceModel: source.sourceModel,
          sourceId: source.sourceId,
        },
      },
      create: this.reviewManifestData(source, identity, outcome, safe),
      update: this.reviewManifestData(source, identity, outcome, safe),
    });
  }

  private reviewManifestData(
    source: UserRequestManifestSource,
    identity: ReturnType<typeof normalizeIdentification>,
    outcome: { status: string; person?: { id: number }; matchingPersonCount?: number; reason?: string },
    safe: boolean,
  ) {
    const conflictCodes = safe
      ? []
      : [outcome.status, outcome.reason, outcome.matchingPersonCount]
          .filter((value): value is string | number => value !== undefined)
          .map(String);
    return {
      manifestVersion: RECONCILIATION_MANIFEST_VERSION,
      normalizationVersion: IDENTITY_NORMALIZATION_VERSION,
      decisionVersion: RECONCILIATION_DECISION_VERSION,
      sourceModel: source.sourceModel,
      sourceId: source.sourceId,
      sourceFingerprint: sourceFingerprint(source),
      rawIdentification: identity?.rawIdentification ?? source.identification,
      identificationType: identity?.identificationType ?? null,
      normalizedIdentification: identity?.normalizedIdentification ?? null,
      identityClusterKey: identity
        ? `${identity.identificationType}:${identity.normalizedIdentification}`
        : null,
      classification: safe ? 'IDENTITY_MATCH' : outcome.status,
      selectedPersonId: safe ? outcome.person?.id ?? null : null,
      personCreationAllowed: false,
      conflictCodes,
      nameReconciliationRequired: !safe,
      reviewRequired: !safe,
      sourceSnapshot: source,
      reviewedAt: null,
      reviewedBy: null,
    };
  }

  private async assertNoUserDuplicates(email: string, identification: string) {
    const [byEmail, byIdentification] = await Promise.all([
      this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { identification },
        select: { id: true },
      }),
    ]);
    if (byEmail) throw new ConflictException('Email is already registered');
    if (byIdentification) {
      throw new ConflictException('Identification is already registered');
    }
  }

  private async assertNoPendingDuplicates(
    email: string,
    identification: string,
  ) {
    const [byEmail, byIdentification] = await Promise.all([
      this.prisma.userRequest.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          status: 'PENDING',
        },
        select: { id: true },
      }),
      this.prisma.userRequest.findFirst({
        where: { identification, status: 'PENDING' },
        select: { id: true },
      }),
    ]);
    if (byEmail)
      throw new ConflictException('A pending request already uses this email');
    if (byIdentification) {
      throw new ConflictException(
        'A pending request already uses this identification',
      );
    }
  }
}

/**
 * New writes populate submitted* fields. Reads tolerate pre-expand rows by
 * projecting the retained generic snapshot columns as equal compatibility
 * aliases; neither branch reads current Person data.
 */
function toUserRequestSnapshotResponse<
  T extends {
    fullName: string;
    identification: string;
    identificationType: unknown;
    email: string;
    phone: string | null;
    phoneCountryCode: string | null;
    phoneNationalNumber: string | null;
    address: string | null;
    reason: string;
    submittedFullName: string | null;
    submittedIdentification: string | null;
    submittedIdentificationType: unknown;
    submittedEmail: string | null;
    submittedPhone: string | null;
    submittedPhoneCountryCode: string | null;
    submittedPhoneNationalNumber: string | null;
    submittedAddress: string | null;
    submittedReason: string | null;
  },
>(request: T) {
  return {
    ...request,
    submittedFullName: request.submittedFullName ?? request.fullName,
    submittedIdentification:
      request.submittedIdentification ?? request.identification,
    submittedIdentificationType:
      request.submittedIdentificationType ?? request.identificationType,
    submittedEmail: request.submittedEmail ?? request.email,
    submittedPhone: request.submittedPhone ?? request.phone,
    submittedPhoneCountryCode:
      request.submittedPhoneCountryCode ?? request.phoneCountryCode,
    submittedPhoneNationalNumber:
      request.submittedPhoneNationalNumber ?? request.phoneNationalNumber,
    submittedAddress: request.submittedAddress ?? request.address,
    submittedReason: request.submittedReason ?? request.reason,
  };
}
