import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../auth/application/ports/password-hasher.port';
import { PrismaService } from '../prisma/prisma.service';
import { ActivationTokenService } from './activation-token.service';
import { CommunityEmailVerificationDeliveryService } from './community-email-verification-delivery.service';
import { CreateCommunityAccountDto } from './dto/create-community-account.dto';
import { AuditAction } from '../audit/audit-actions';
import { AuditContext, AuditService } from '../audit/audit.service';
import { CorrectCommunityEmailDto } from './dto/correct-community-email.dto';
import {
  COMMUNITY_ACCOUNT_ROLE,
  isCommunityAccountRole,
} from '../auth/domain/policies/internal-access.policy';

const COMMUNITY_ROLE = COMMUNITY_ACCOUNT_ROLE;
const ACKNOWLEDGEMENT = {
  message:
    'Si el correo puede continuar el proceso, recibirá instrucciones de verificación.',
};
const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const COMMUNITY_RECIPIENT_NAME = 'persona de la comunidad';

type PendingDelivery = {
  userId: number;
  email: string;
  fullName: string;
  token: string;
  expiresAt: Date;
};

@Injectable()
export class CommunityAccountsService {
  private readonly logger = new Logger(CommunityAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: ActivationTokenService,
    private readonly delivery: CommunityEmailVerificationDeliveryService,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async correctEmail(
    id: number,
    dto: CorrectCommunityEmailDto,
    actorId: number,
    context: AuditContext = {},
  ) {
    if (
      dto.identityVerified !== true ||
      !['IN_PERSON', 'INSTITUTIONAL'].includes(dto.verificationMethod)
    )
      throw new BadRequestException(
        'Debe constar la verificación institucional de identidad.',
      );
    if (!this.audit)
      throw new ServiceUnavailableException('Auditoría no disponible.');
    const email = dto.email.trim().toLowerCase();
    const generated = this.tokens.generate();
    let pending: PendingDelivery;
    try {
      pending = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              status: true,
              role: { select: { name: true } },
            },
          });
          if (
            !user ||
            user.status !== 'PENDING_EMAIL_VERIFICATION' ||
            !isCommunityAccountRole(user.role.name)
          )
            throw new ConflictException(
              'La cuenta no permite corregir el correo.',
            );
          if (user.email.toLowerCase() === email)
            throw new BadRequestException('Indique un correo diferente.');
          const duplicate = await tx.user.findFirst({
            where: {
              id: { not: id },
              email: { equals: email, mode: 'insensitive' },
            },
            select: { id: true },
          });
          if (duplicate)
            throw new ConflictException('El correo ya pertenece a una cuenta.');
          const changed = await tx.user.updateMany({
            where: {
              id,
              email: user.email,
              status: 'PENDING_EMAIL_VERIFICATION',
              role: { name: COMMUNITY_ROLE },
            },
            data: { email },
          });
          if (changed.count !== 1)
            throw new ConflictException(
              'La cuenta cambió; vuelva a intentarlo.',
            );
          await tx.passwordResetToken.updateMany({
            where: { userId: id, usedAt: null },
            data: { usedAt: new Date() },
          });
          await tx.accountActivationToken.updateMany({
            where: {
              userId: id,
              purpose: 'COMMUNITY_EMAIL_VERIFICATION',
              usedAt: null,
            },
            data: { usedAt: new Date() },
          });
          await tx.accountActivationToken.create({
            data: {
              userId: id,
              tokenHash: generated.tokenHash,
              expiresAt: generated.expiresAt,
              purpose: 'COMMUNITY_EMAIL_VERIFICATION',
            },
          });
          await this.audit!.log(
            {
              userId: actorId,
              action: AuditAction.COMMUNITY_EMAIL_CORRECTED,
              module: 'USERS',
              entityType: 'User',
              entityId: id,
              details: {
                identityVerified: true,
                verificationMethod: dto.verificationMethod,
              },
              ...context,
            },
            tx,
          );
          return {
            userId: id,
            email,
            fullName: COMMUNITY_RECIPIENT_NAME,
            token: generated.token,
            expiresAt: generated.expiresAt,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        isUniqueViolation(error) ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034')
      )
        throw new ConflictException(
          'La cuenta o el correo cambió; vuelva a intentarlo.',
        );
      throw error;
    }
    if (!(await this.delivery.deliver(pending)))
      throw new ServiceUnavailableException(
        'Correo corregido; no se pudo enviar el enlace. Solicite un reenvío.',
      );
    return { message: 'Correo corregido; se solicitó el envío del enlace.' };
  }

  async reverifyHistorical(
    id: number,
    actorId: number,
    context: AuditContext = {},
  ) {
    if (!this.audit)
      throw new ServiceUnavailableException('Auditoría no disponible.');
    const generated = this.tokens.generate();
    const pending = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id },
          select: { id: true, email: true },
        });
        if (!user)
          throw new ConflictException('La cuenta no permite reverificación.');
        const changed = await tx.user.updateMany({
          where: {
            id,
            status: 'INACTIVE',
            communityEmailVerifiedAt: null,
            role: {
              name: COMMUNITY_ROLE,
              isActive: true,
              permissions: { none: {} },
            },
          },
          data: { status: 'PENDING_EMAIL_VERIFICATION' },
        });
        if (changed.count !== 1)
          throw new ConflictException('La cuenta no permite reverificación.');
        const now = new Date();
        await tx.accountActivationToken.updateMany({
          where: {
            userId: id,
            purpose: 'COMMUNITY_EMAIL_VERIFICATION',
            usedAt: null,
          },
          data: { usedAt: now },
        });
        await tx.passwordResetToken.updateMany({
          where: { userId: id, usedAt: null },
          data: { usedAt: now },
        });
        await tx.accountActivationToken.create({
          data: {
            userId: id,
            tokenHash: generated.tokenHash,
            expiresAt: generated.expiresAt,
            purpose: 'COMMUNITY_EMAIL_VERIFICATION',
          },
        });
        await this.audit!.log(
          {
            userId: actorId,
            action: AuditAction.COMMUNITY_EMAIL_REVERIFICATION_STARTED,
            module: 'USERS',
            entityType: 'User',
            entityId: id,
            ...context,
          },
          tx,
        );
        return {
          userId: id,
          email: user.email,
          fullName: COMMUNITY_RECIPIENT_NAME,
          token: generated.token,
          expiresAt: generated.expiresAt,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!(await this.delivery.deliver(pending)))
      throw new ServiceUnavailableException(
        'Reverificación pendiente; solicite un reenvío.',
      );
    return { message: 'Reverificación solicitada.' };
  }

  async register(dto: CreateCommunityAccountDto, context: AuditContext = {}) {
    const generated = this.tokens.generate();
    let pending: PendingDelivery | null = null;

    try {
      pending = await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.user.findUnique({
            where: { email: dto.email },
            select: { id: true },
          });
          if (existing) return null;
          const role = await tx.role.findUnique({
            where: { name: COMMUNITY_ROLE },
            select: {
              id: true,
              isActive: true,
              permissions: { select: { permissionId: true } },
            },
          });
          if (!role || !role.isActive || role.permissions.length > 0) {
            throw new Error('Community account role is not configured.');
          }
          // `fullName` becomes nullable in the pending human-approved migration.
          // Do not synthesize identity data for a community email-only account.
          const communityUserData = {
            email: dto.email,
            passwordHash: null,
            status: 'PENDING_EMAIL_VERIFICATION' as const,
            roleId: role.id,
          } as Prisma.UserUncheckedCreateInput;
          const user = await tx.user.create({
            data: {
              ...communityUserData,
            },
            select: { id: true, email: true },
          });
          await tx.accountActivationToken.create({
            data: {
              userId: user.id,
              tokenHash: generated.tokenHash,
              expiresAt: generated.expiresAt,
              purpose: 'COMMUNITY_EMAIL_VERIFICATION',
            },
          });
          return {
            userId: user.id,
            email: user.email,
            fullName: COMMUNITY_RECIPIENT_NAME,
            token: generated.token,
            expiresAt: generated.expiresAt,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isUniqueViolation(error) || isSerializationConflict(error)) {
        return ACKNOWLEDGEMENT;
      }
      throw error;
    }

    if (pending) {
      const pendingDelivery = pending;
      try {
        void this.delivery
          .deliver(pendingDelivery)
          .then((delivered) => {
            if (!delivered)
              this.logger.warn(
                `Community account pending delivery retry for userId=${pendingDelivery.userId}.`,
              );
          })
          .catch(() => {
            this.logger.warn('Community registration delivery unavailable.');
          });
      } catch {
        this.logger.warn('Community registration delivery unavailable.');
      }
      try {
        await this.audit?.log({
          userId: pending.userId,
          action: AuditAction.COMMUNITY_ACCOUNT_REGISTERED,
          module: 'AUTH',
          entityType: 'User',
          entityId: pending.userId,
          ...context,
        });
      } catch {
        this.logger.warn('Community registration audit unavailable.');
      }
    }
    return ACKNOWLEDGEMENT;
  }

  async validateToken(token: string) {
    await this.findValidToken(token);
    return { message: 'El enlace es válido.' };
  }

  async verify(
    token: string,
    context: AuditContext = {},
    password?: string,
    passwordConfirmation?: string,
  ) {
    const activationToken = await this.findValidToken(token);
    if (!password || !passwordConfirmation)
      throw new BadRequestException('Debe crear y confirmar una contraseña.');
    if (password !== passwordConfirmation) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }
    const passwordHash = await this.hasher.hash(password);
    const now = new Date();
    await this.prisma.$transaction(
      async (tx) => {
        const claimed = await tx.accountActivationToken.updateMany({
          where: {
            id: activationToken.id,
            purpose: 'COMMUNITY_EMAIL_VERIFICATION',
            usedAt: null,
            expiresAt: { gt: now },
          },
          data: { usedAt: now },
        });
        if (claimed.count !== 1)
          throw new ConflictException(
            'El enlace de verificación ya no está disponible.',
          );
        const activated = await tx.user.updateMany({
          where: {
            id: activationToken.userId,
            status: 'PENDING_EMAIL_VERIFICATION',
            role: {
              name: COMMUNITY_ROLE,
              isActive: true,
              permissions: { none: {} },
            },
          },
          data: {
            status: 'ACTIVE',
            passwordHash,
            communityEmailVerifiedAt: now,
          },
        });
        if (activated.count !== 1)
          throw new ConflictException('La cuenta no puede verificarse.');
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.audit?.log({
      userId: activationToken.userId,
      action: AuditAction.COMMUNITY_EMAIL_VERIFIED,
      module: 'AUTH',
      entityType: 'User',
      entityId: activationToken.userId,
      ...context,
    });
    return { message: 'Correo verificado. Ya puede iniciar sesión.' };
  }

  private async findValidToken(token: string) {
    const tokenHash = hashToken(token);
    const activationToken = await this.prisma.accountActivationToken.findUnique(
      {
        where: { tokenHash },
        include: { user: { select: { status: true } } },
      },
    );
    if (
      !activationToken ||
      activationToken.purpose !== 'COMMUNITY_EMAIL_VERIFICATION'
    ) {
      throw new BadRequestException('El enlace de verificación no es válido.');
    }
    if (activationToken.expiresAt <= new Date()) {
      throw new ConflictException('El enlace de verificación venció.');
    }
    if (activationToken.usedAt) {
      throw new ConflictException(
        'El enlace de verificación ya no está disponible.',
      );
    }
    if (activationToken.user.status !== 'PENDING_EMAIL_VERIFICATION') {
      throw new ConflictException('La cuenta no puede verificarse.');
    }
    return activationToken;
  }

  async resend(email: string) {
    const generated = this.tokens.generate();
    let pending: PendingDelivery | null = null;
    try {
      pending = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { email },
            select: { id: true, email: true, status: true },
          });
          if (!user || user.status !== 'PENDING_EMAIL_VERIFICATION')
            return null;
          const since = new Date(Date.now() - RESEND_WINDOW_MS);
          const issued = await tx.accountActivationToken.count({
            where: {
              userId: user.id,
              purpose: 'COMMUNITY_EMAIL_VERIFICATION',
              createdAt: { gte: since },
            },
          });
          if (issued >= RESEND_LIMIT) return null;
          const now = new Date();
          await tx.accountActivationToken.updateMany({
            where: {
              userId: user.id,
              purpose: 'COMMUNITY_EMAIL_VERIFICATION',
              usedAt: null,
              expiresAt: { gt: now },
            },
            data: { usedAt: now },
          });
          await tx.accountActivationToken.create({
            data: {
              userId: user.id,
              tokenHash: generated.tokenHash,
              expiresAt: generated.expiresAt,
              purpose: 'COMMUNITY_EMAIL_VERIFICATION',
            },
          });
          return {
            userId: user.id,
            email: user.email,
            fullName: COMMUNITY_RECIPIENT_NAME,
            token: generated.token,
            expiresAt: generated.expiresAt,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isUniqueViolation(error) && !isSerializationConflict(error))
        throw error;
    }
    if (pending) {
      try {
        void this.delivery.deliver(pending).catch(() => undefined);
      } catch {
        // Keep the public acknowledgement independent of provider latency.
      }
    }
    return ACKNOWLEDGEMENT;
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isUniqueViolation(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}
