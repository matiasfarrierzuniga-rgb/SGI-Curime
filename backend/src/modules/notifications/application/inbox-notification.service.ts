import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationResourceType,
  NotificationType,
  Prisma,
  UserStatus,
} from '../../../../generated/prisma/client';
import type { AuthenticatedUser } from '../../../auth';
import { hasPersistedCapability } from '../../../auth';
import { AuditAction } from '../../../audit/audit-actions';
import { AuditService } from '../../../audit/audit.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { QueryNotificationsDto } from '../presentation/dto/query-notifications.dto';

const RETENTION_DAYS = 365;
const activeNotificationWhere = () => ({ expiresAt: { gt: new Date() } });

type NotificationTransaction = Pick<
  Prisma.TransactionClient,
  'notification' | 'user'
>;
type NotificationRecord = {
  id: number;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  resourceType: NotificationResourceType;
  resourceId: string;
  readAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
};

type NotificationInput = {
  recipientUserIds: readonly number[];
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  resourceType: NotificationResourceType;
  resourceId: number;
};

@Injectable()
export class InboxNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly audit?: AuditService,
  ) {}

  async list(actor: AuthenticatedUser, query: QueryNotificationsDto) {
    const where: Prisma.NotificationWhereInput = {
      recipientUserId: actor.id,
      ...activeNotificationWhere(),
      ...(query.filter === 'UNREAD' ? { readAt: null } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return {
      data: data.map((item) => this.toResponse(item, actor)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  unreadCount(actorId: number) {
    return this.prisma.notification
      .count({
        where: {
          recipientUserId: actorId,
          readAt: null,
          ...activeNotificationWhere(),
        },
      })
      .then((unread) => ({ unread }));
  }

  async markRead(actor: AuthenticatedUser, id: number) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, recipientUserId: actor.id, ...activeNotificationWhere() },
    });
    if (!existing) throw new NotFoundException('Notification not found');
    if (existing.readAt) return this.toResponse(existing, actor);

    const readAt = new Date();
    const result = await this.prisma.notification.updateMany({
      where: {
        id,
        recipientUserId: actor.id,
        readAt: null,
        ...activeNotificationWhere(),
      },
      data: { readAt },
    });
    const notification =
      result.count === 1
        ? { ...existing, readAt }
        : await this.prisma.notification.findFirstOrThrow({
            where: {
              id,
              recipientUserId: actor.id,
              ...activeNotificationWhere(),
            },
          });
    if (result.count === 1)
      await this.audit?.log({
        userId: actor.id,
        action: AuditAction.NOTIFICATION_READ,
        module: 'NOTIFICATIONS',
        entityType: 'Notification',
        entityId: id,
      });
    return this.toResponse(notification, actor);
  }

  async markAllRead(actorId: number) {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientUserId: actorId,
        readAt: null,
        ...activeNotificationWhere(),
      },
      data: { readAt: new Date() },
    });
    if (result.count > 0)
      await this.audit?.log({
        userId: actorId,
        action: AuditAction.NOTIFICATIONS_MARKED_READ,
        module: 'NOTIFICATIONS',
        details: { count: result.count },
      });
    return { updated: result.count };
  }

  async notifyUserRequestSubmitted(
    tx: NotificationTransaction,
    requestId: number,
  ) {
    const recipientUserIds = await this.findActiveRecipients(tx, [
      'usr.user-requests.read',
      'usr.user-requests.review',
    ]);
    return this.create(tx, {
      recipientUserIds,
      type: NotificationType.USER_REQUEST_SUBMITTED,
      category: NotificationCategory.OPERATIONAL,
      title: 'Nueva solicitud de cuenta',
      body: 'Hay una solicitud de cuenta pendiente de revisión.',
      resourceType: NotificationResourceType.USER_REQUEST,
      resourceId: requestId,
    });
  }

  async notifyAffiliateRequestSubmitted(
    tx: NotificationTransaction,
    requestId: number,
  ) {
    const users = await tx.user.findMany({
      where: { status: UserStatus.ACTIVE, role: { name: 'Administrador' } },
      select: { id: true },
    });
    return this.create(tx, {
      recipientUserIds: users.map((user) => user.id),
      type: NotificationType.AFFILIATE_REQUEST_SUBMITTED,
      category: NotificationCategory.OPERATIONAL,
      title: 'Nueva solicitud de afiliación',
      body: 'Hay una solicitud de afiliación pendiente de revisión.',
      resourceType: NotificationResourceType.AFFILIATE_REQUEST,
      resourceId: requestId,
    });
  }

  async notifyReservationSubmitted(
    tx: NotificationTransaction,
    reservationId: number,
  ) {
    const recipientUserIds = await this.findActiveRecipients(tx, [
      'res.reservations.read',
      'res.reservations.approve',
    ]);
    return this.create(tx, {
      recipientUserIds,
      type: NotificationType.RESERVATION_SUBMITTED,
      category: NotificationCategory.OPERATIONAL,
      title: 'Nueva solicitud de reserva',
      body: 'Hay una reserva pendiente de aprobación.',
      resourceType: NotificationResourceType.RESERVATION,
      resourceId: reservationId,
    });
  }

  notifyReservationResolved(
    tx: NotificationTransaction,
    reservationId: number,
    requesterUserId: number,
    approved: boolean,
  ) {
    return this.create(tx, {
      recipientUserIds: [requesterUserId],
      type: approved
        ? NotificationType.RESERVATION_APPROVED
        : NotificationType.RESERVATION_REJECTED,
      category: NotificationCategory.INFORMATIONAL,
      title: approved ? 'Reserva aprobada' : 'Reserva rechazada',
      body: approved
        ? 'Su solicitud de reserva fue aprobada.'
        : 'Su solicitud de reserva fue rechazada.',
      resourceType: NotificationResourceType.RESERVATION,
      resourceId: reservationId,
    });
  }

  private async findActiveRecipients(
    tx: NotificationTransaction,
    capabilityCodes: readonly string[],
  ) {
    const users = await tx.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        AND: capabilityCodes.map((code) => ({
          role: { permissions: { some: { permission: { code } } } },
        })),
      },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  private create(tx: NotificationTransaction, input: NotificationInput) {
    const expiresAt = notificationExpiresAt();
    return tx.notification.createMany({
      data: input.recipientUserIds.map((recipientUserId) => ({
        recipientUserId,
        type: input.type,
        category: input.category,
        priority: NotificationPriority.NORMAL,
        title: input.title,
        body: input.body,
        resourceType: input.resourceType,
        resourceId: String(input.resourceId),
        deduplicationKey: notificationDeduplicationKey(
          recipientUserId,
          input.type,
          input.resourceType,
          input.resourceId,
        ),
        expiresAt,
      })),
      skipDuplicates: true,
    });
  }

  private toResponse(
    notification: NotificationRecord,
    actor: AuthenticatedUser,
  ) {
    return {
      ...notification,
      action: notificationAction(notification.resourceType, actor),
    };
  }
}

export function notificationExpiresAt(now = new Date()) {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + RETENTION_DAYS);
  return expiresAt;
}

export function notificationDeduplicationKey(
  recipientUserId: number,
  type: NotificationType,
  resourceType: NotificationResourceType,
  resourceId: number,
) {
  return `v1:${recipientUserId}:${type}:${resourceType}:${resourceId}`;
}

function notificationAction(
  resourceType: NotificationResourceType,
  actor: AuthenticatedUser,
) {
  if (!actor.canAccessErp) return null;
  if (
    resourceType === NotificationResourceType.USER_REQUEST &&
    hasPersistedCapability(actor.permissionCodes, 'usr.user-requests.read')
  )
    return { label: 'Ver solicitudes de cuenta', href: '/admin/user-requests' };
  if (
    resourceType === NotificationResourceType.AFFILIATE_REQUEST &&
    actor.role === 'Administrador' &&
    hasPersistedCapability(actor.permissionCodes, 'adm.requests.read')
  )
    return {
      label: 'Ver solicitudes de afiliación',
      href: '/app/admin/requests',
    };
  if (
    resourceType === NotificationResourceType.RESERVATION &&
    hasPersistedCapability(actor.permissionCodes, 'res.reservations.read')
  )
    return { label: 'Ver reservas', href: '/app/reservations' };
  return null;
}
