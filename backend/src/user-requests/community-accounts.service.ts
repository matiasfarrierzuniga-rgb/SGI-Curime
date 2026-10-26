import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  Optional,
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

const COMMUNITY_ROLE = 'Cuenta comunitaria';
const ACKNOWLEDGEMENT = {
  message:
    'Si el correo puede continuar el proceso, recibirá instrucciones de verificación.',
};
const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000;

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

  async register(dto: CreateCommunityAccountDto, context: AuditContext = {}) {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    const passwordHash = await this.hasher.hash(dto.password);
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
          const user = await tx.user.create({
            data: {
              fullName: dto.fullName,
              email: dto.email,
              passwordHash,
              status: 'PENDING_EMAIL_VERIFICATION',
              roleId: role.id,
            },
            select: { id: true, email: true, fullName: true },
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
            fullName: user.fullName,
            token: generated.token,
            expiresAt: generated.expiresAt,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }

    if (pending) {
      const delivered = await this.delivery.deliver(pending);
      if (!delivered)
        this.logger.warn(
          `Community account pending delivery retry for userId=${pending.userId}.`,
        );
      await this.audit?.log({
        userId: pending.userId,
        action: AuditAction.COMMUNITY_ACCOUNT_REGISTERED,
        module: 'AUTH',
        entityType: 'User',
        entityId: pending.userId,
        ...context,
      });
    }
    return ACKNOWLEDGEMENT;
  }

  async verify(token: string, context: AuditContext = {}) {
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
    if (activationToken.user.status === 'BLOCKED') {
      throw new ConflictException('La cuenta no puede verificarse.');
    }

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
          },
          data: { status: 'ACTIVE' },
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

  async resend(email: string) {
    const generated = this.tokens.generate();
    let pending: PendingDelivery | null = null;
    try {
      pending = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { email },
            select: { id: true, email: true, fullName: true, status: true },
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
            fullName: user.fullName,
            token: generated.token,
            expiresAt: generated.expiresAt,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
    if (pending) await this.delivery.deliver(pending);
    return ACKNOWLEDGEMENT;
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
