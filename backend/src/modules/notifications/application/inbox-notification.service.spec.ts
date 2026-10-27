import { NotFoundException } from '@nestjs/common';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationResourceType,
  NotificationType,
} from '../../../../generated/prisma/client';
import type { AuthenticatedUser } from '../../../auth';
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers are intentionally untyped. */
import { AuditAction } from '../../../audit/audit-actions';
import {
  InboxNotificationService,
  notificationDeduplicationKey,
  notificationExpiresAt,
} from './inbox-notification.service';

const actor: AuthenticatedUser = {
  id: 7,
  fullName: 'Ana Pérez',
  email: 'ana@example.test',
  status: 'ACTIVE',
  role: 'Administrador',
  permissionCodes: ['usr.user-requests.read'],
  canAccessErp: true,
};

const notification = {
  id: 18,
  recipientUserId: actor.id,
  type: NotificationType.USER_REQUEST_SUBMITTED,
  category: NotificationCategory.OPERATIONAL,
  priority: NotificationPriority.NORMAL,
  title: 'Nueva solicitud de cuenta',
  body: 'Hay una solicitud de cuenta pendiente de revisión.',
  resourceType: NotificationResourceType.USER_REQUEST,
  resourceId: '42',
  deduplicationKey: 'v1:7:USER_REQUEST_SUBMITTED:USER_REQUEST:42',
  readAt: null,
  createdAt: new Date('2030-01-01T12:00:00.000Z'),
  expiresAt: new Date('2031-01-01T12:00:00.000Z'),
};

describe('InboxNotificationService', () => {
  const prisma = {
    $transaction: jest.fn(),
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
  };
  const audit = { log: jest.fn() };
  const service = new InboxNotificationService(prisma as never, audit as never);

  beforeEach(() => jest.clearAllMocks());

  it('scopes paged unread listings to active notifications owned by current user', async () => {
    prisma.notification.findMany.mockResolvedValue([notification]);
    prisma.notification.count.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(
      async (operations: readonly Promise<unknown>[]) =>
        Promise.all(operations),
    );

    await expect(
      service.list(actor, { page: 2, limit: 10, filter: 'UNREAD' }),
    ).resolves.toMatchObject({
      total: 1,
      page: 2,
      limit: 10,
      data: [{ id: notification.id, action: { href: '/admin/user-requests' } }],
    });
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipientUserId: actor.id,
          readAt: null,
          expiresAt: { gt: expect.any(Date) },
        }),
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('returns an empty page when no active notifications match current user filter', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValue(0);
    prisma.$transaction.mockImplementation(
      async (operations: readonly Promise<unknown>[]) =>
        Promise.all(operations),
    );
    await expect(
      service.list(actor, { page: 1, limit: 20, filter: 'ALL' }),
    ).resolves.toEqual({ data: [], total: 0, page: 1, limit: 20 });
  });

  it('counts only active unread notifications belonging to current user', async () => {
    prisma.notification.count.mockResolvedValue(3);
    await expect(service.unreadCount(actor.id)).resolves.toEqual({ unread: 3 });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        recipientUserId: actor.id,
        readAt: null,
        expiresAt: { gt: expect.any(Date) },
      }),
    });
  });

  it('returns zero when current user has no active unread notifications', async () => {
    prisma.notification.count.mockResolvedValue(0);
    await expect(service.unreadCount(actor.id)).resolves.toEqual({ unread: 0 });
  });

  it('rejects marking another user notification as read', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);
    await expect(service.markRead(actor, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it('marks own unread notification once and audits no notification content', async () => {
    prisma.notification.findFirst.mockResolvedValue(notification);
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    audit.log.mockResolvedValue(undefined);

    await expect(
      service.markRead(actor, notification.id),
    ).resolves.toMatchObject({ id: notification.id, readAt: expect.any(Date) });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: notification.id,
          recipientUserId: actor.id,
          readAt: null,
          expiresAt: { gt: expect.any(Date) },
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith({
      userId: actor.id,
      action: AuditAction.NOTIFICATION_READ,
      module: 'NOTIFICATIONS',
      entityType: 'Notification',
      entityId: notification.id,
    });
  });

  it('keeps an already read notification idempotent without a second audit event', async () => {
    prisma.notification.findFirst.mockResolvedValue({
      ...notification,
      readAt: new Date('2030-01-01T12:30:00.000Z'),
    });
    await expect(
      service.markRead(actor, notification.id),
    ).resolves.toMatchObject({ id: notification.id, readAt: expect.any(Date) });
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('marks only current user active unread notifications read in bulk', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 2 });
    audit.log.mockResolvedValue(undefined);
    await expect(service.markAllRead(actor.id)).resolves.toEqual({
      updated: 2,
    });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recipientUserId: actor.id,
          readAt: null,
          expiresAt: { gt: expect.any(Date) },
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith({
      userId: actor.id,
      action: AuditAction.NOTIFICATIONS_MARKED_READ,
      module: 'NOTIFICATIONS',
      details: { count: 2 },
    });
  });

  it('omits resource actions when current session no longer has ERP access', async () => {
    prisma.notification.findMany.mockResolvedValue([notification]);
    prisma.notification.count.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(
      async (operations: readonly Promise<unknown>[]) =>
        Promise.all(operations),
    );
    const restrictedActor = {
      ...actor,
      canAccessErp: false,
      permissionCodes: [],
    };

    await expect(
      service.list(restrictedActor, { page: 1, limit: 20, filter: 'ALL' }),
    ).resolves.toMatchObject({ data: [{ id: notification.id, action: null }] });
  });

  it('creates recipient-specific deduplicated producer records with retention', async () => {
    const tx = {
      user: { findMany: jest.fn().mockResolvedValue([{ id: 4 }, { id: 9 }]) },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    await service.notifyUserRequestSubmitted(tx as never, 42);

    expect(tx.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            recipientUserId: 4,
            deduplicationKey: 'v1:4:USER_REQUEST_SUBMITTED:USER_REQUEST:42',
            expiresAt: expect.any(Date),
          }),
          expect.objectContaining({
            recipientUserId: 9,
            deduplicationKey: 'v1:9:USER_REQUEST_SUBMITTED:USER_REQUEST:42',
            expiresAt: expect.any(Date),
          }),
        ]),
      }),
    );
  });
});

describe('notification policy helpers', () => {
  it('uses stable per-recipient deduplication keys', () => {
    expect(
      notificationDeduplicationKey(
        7,
        NotificationType.RESERVATION_APPROVED,
        NotificationResourceType.RESERVATION,
        15,
      ),
    ).toBe('v1:7:RESERVATION_APPROVED:RESERVATION:15');
  });

  it('expires notifications after 365 UTC days', () => {
    expect(
      notificationExpiresAt(new Date('2028-02-29T00:00:00.000Z')).toISOString(),
    ).toBe('2029-02-28T00:00:00.000Z');
  });
});
