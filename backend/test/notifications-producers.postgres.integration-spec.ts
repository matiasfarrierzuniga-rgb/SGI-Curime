import {
  NotificationResourceType,
  NotificationType,
  ReservationStatus,
  ResourcePricingType,
  UserStatus,
} from '../generated/prisma/client';
import { RuntimePersonResolverService } from '../src/identity/runtime-person-resolver.service';
import { InboxNotificationService } from '../src/modules/notifications/application/inbox-notification.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AffiliateRequestsService } from '../src/affiliate-requests/affiliate-requests.service';
import { ReservationsService } from '../src/reservations/reservations.service';
import { UserRequestsService } from '../src/user-requests/user-requests.service';

describe('Notifications transactional producers PostgreSQL integration', () => {
  const prisma = new PrismaService();
  const inbox = new InboxNotificationService(prisma);
  const resolver = new RuntimePersonResolverService(prisma);
  const userRequests = new UserRequestsService(
    prisma,
    {} as never,
    {} as never,
    resolver,
    undefined,
    inbox,
  );
  const affiliateRequests = new AffiliateRequestsService(
    prisma,
    undefined,
    resolver,
    inbox,
  );
  const reservations = new ReservationsService(prisma, inbox);
  let marker: string;
  let reviewerId: number;
  let adminId: number;
  let reservationManagerId: number;
  let requesterId: number;

  beforeAll(async () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.ALLOW_TEST_DATABASE_RESET).toBe('true');
    expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL);
    await prisma.$connect();
  });

  beforeEach(async () => {
    marker = `notifications-producers-${process.pid}-${Date.now()}`;
    const permissions = await Promise.all(
      [
        'usr.user-requests.read',
        'usr.user-requests.review',
        'res.reservations.read',
        'res.reservations.approve',
      ].map((code) =>
        prisma.permission.create({ data: { code, name: `${marker}-${code}` } }),
      ),
    );
    const reviewerRole = await prisma.role.create({
      data: {
        name: `${marker}-reviewer`,
        permissions: {
          create: permissions
            .slice(0, 2)
            .map((permission) => ({ permissionId: permission.id })),
        },
      },
    });
    const partialReviewerRole = await prisma.role.create({
      data: {
        name: `${marker}-partial-reviewer`,
        permissions: { create: [{ permissionId: permissions[0].id }] },
      },
    });
    const reservationRole = await prisma.role.create({
      data: {
        name: `${marker}-reservation-manager`,
        permissions: {
          create: permissions
            .slice(2)
            .map((permission) => ({ permissionId: permission.id })),
        },
      },
    });
    const adminRole = await prisma.role.create({
      data: { name: 'Administrador' },
    });
    const requesterRole = await prisma.role.create({
      data: { name: `${marker}-requester` },
    });
    const users = await Promise.all(
      [
        [reviewerRole.id, 'reviewer', UserStatus.ACTIVE],
        [partialReviewerRole.id, 'partial', UserStatus.ACTIVE],
        [reviewerRole.id, 'inactive-reviewer', UserStatus.INACTIVE],
        [adminRole.id, 'admin', UserStatus.ACTIVE],
        [adminRole.id, 'inactive-admin', UserStatus.INACTIVE],
        [reservationRole.id, 'reservation-manager', UserStatus.ACTIVE],
        [reservationRole.id, 'inactive-manager', UserStatus.INACTIVE],
        [requesterRole.id, 'requester', UserStatus.ACTIVE],
      ].map(([roleId, suffix, status]) =>
        prisma.user.create({
          data: {
            roleId: roleId as number,
            fullName: `Synthetic ${suffix}`,
            identification: `${marker}-${suffix}`,
            email: `${marker}-${suffix}@example.test`,
            status: status as UserStatus,
          },
        }),
      ),
    );
    reviewerId = users[0].id;
    adminId = users[3].id;
    reservationManagerId = users[5].id;
    requesterId = users[7].id;
  });

  afterEach(async () => {
    await prisma.notification.deleteMany({
      where: { recipient: { email: { startsWith: marker } } },
    });
    await prisma.financialCharge.deleteMany({
      where: { reservation: { requester: { email: { startsWith: marker } } } },
    });
    await prisma.reservation.deleteMany({
      where: { requester: { email: { startsWith: marker } } },
    });
    await prisma.reservableResource.deleteMany({
      where: { name: { startsWith: marker } },
    });
    await prisma.affiliateRequest.deleteMany({
      where: { email: { startsWith: marker } },
    });
    await prisma.userRequest.deleteMany({
      where: { email: { startsWith: marker } },
    });
    await prisma.person.deleteMany({
      where: { identification: { startsWith: marker } },
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: marker } } });
    await prisma.rolePermission.deleteMany({
      where: { role: { name: { startsWith: marker } } },
    });
    await prisma.role.deleteMany({
      where: {
        OR: [{ name: { startsWith: marker } }, { name: 'Administrador' }],
      },
    });
    await prisma.permission.deleteMany({
      where: {
        code: {
          in: [
            'usr.user-requests.read',
            'usr.user-requests.review',
            'res.reservations.read',
            'res.reservations.approve',
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('notifies only active fully authorized reviewers, deduplicates same event, and retains later events', async () => {
    const first = await userRequests.create({
      fullName: 'Cuenta Sintética',
      identificationType: 'NATIONAL',
      identification: '101110111',
      email: `${marker}-account-one@example.test`,
      reason: 'Solicitud sintética',
    });
    await inbox.notifyUserRequestSubmitted(prisma, first.id);
    const second = await userRequests.create({
      fullName: 'Cuenta Posterior',
      identificationType: 'NATIONAL',
      identification: '101110112',
      email: `${marker}-account-two@example.test`,
      reason: 'Solicitud sintética posterior',
    });
    const notifications = await prisma.notification.findMany({
      where: {
        recipientUserId: reviewerId,
        resourceType: NotificationResourceType.USER_REQUEST,
      },
      orderBy: { resourceId: 'asc' },
    });
    expect(notifications).toHaveLength(2);
    expect(notifications.map((item) => item.resourceId)).toEqual([
      String(first.id),
      String(second.id),
    ]);
    expect(
      await prisma.notification.count({
        where: {
          type: NotificationType.USER_REQUEST_SUBMITTED,
          recipientUserId: { not: reviewerId },
        },
      }),
    ).toBe(0);
    await expect(
      userRequests.create({
        fullName: 'Cuenta Duplicada',
        identificationType: 'NATIONAL',
        identification: '101110111',
        email: `${marker}-account-one@example.test`,
        reason: 'Solicitud que debe fallar',
      }),
    ).rejects.toThrow();
    expect(
      await prisma.notification.count({
        where: {
          recipientUserId: reviewerId,
          resourceType: NotificationResourceType.USER_REQUEST,
        },
      }),
    ).toBe(2);
  });

  it('notifies only active Administrador users with generic affiliate-request content persisted and returned by inbox', async () => {
    const sensitiveValues = [
      'Ariadna Privada Rojas',
      '101110113',
      `${marker}-affiliate@example.test`,
      '+50688887777',
      'Dirección privada distintiva',
      'Ocupación privada distintiva',
      'Lugar privado distintivo',
      'Motivo privado distintivo',
    ];
    const request = await affiliateRequests.create({
      identificationType: 'NATIONAL',
      identification: '101110113',
      firstName: 'Ariadna',
      firstSurname: 'Privada',
      secondSurname: 'Rojas',
      birthDate: new Date('1990-01-01'),
      phoneCountryCode: '+506',
      phoneNationalNumber: '88887777',
      address: 'Dirección privada distintiva',
      email: `${marker}-affiliate@example.test`,
      occupation: 'Ocupación privada distintiva',
      workplace: 'Lugar privado distintivo',
      affiliationReason: 'Motivo privado distintivo',
    });
    const notification = await prisma.notification.findFirstOrThrow({
      where: {
        resourceType: NotificationResourceType.AFFILIATE_REQUEST,
        resourceId: String(request.id),
      },
    });
    expect(notification.recipientUserId).toBe(adminId);
    expect(notification).toMatchObject({
      title: 'Nueva solicitud de afiliación',
      body: 'Hay una solicitud de afiliación pendiente de revisión.',
    });
    const response = await inbox.list(
      {
        id: adminId,
        fullName: 'Synthetic admin',
        email: `${marker}-admin@example.test`,
        status: UserStatus.ACTIVE,
        role: 'Administrador',
        canAccessErp: true,
        permissionCodes: [],
      },
      { filter: 'ALL', page: 1, limit: 20 },
    );
    const inboxNotification = response.data.find(
      (item) => item.id === notification.id,
    );
    expect(inboxNotification).toMatchObject({
      title: notification.title,
      body: notification.body,
    });
    const exposedContent = `${notification.title}\n${notification.body}\n${inboxNotification?.title}\n${inboxNotification?.body}`;
    sensitiveValues.forEach((value) =>
      expect(exposedContent).not.toContain(value),
    );
  });

  it('notifies authorized reservation managers, then requester on approval and rejection', async () => {
    const resource = await prisma.reservableResource.create({
      data: {
        name: `${marker}-resource`,
        pricingType: ResourcePricingType.FREE,
      },
    });
    const start = new Date(Date.now() + 86_400_000);
    const approved = await reservations.create(
      {
        resourceId: resource.id,
        startAt: start,
        endAt: new Date(start.getTime() + 3_600_000),
        purpose: 'Reserva sintética',
      },
      requesterId,
    );
    expect(
      (
        await prisma.notification.findFirstOrThrow({
          where: {
            resourceId: String(approved.id),
            type: NotificationType.RESERVATION_SUBMITTED,
          },
        })
      ).recipientUserId,
    ).toBe(reservationManagerId);
    await inbox.notifyReservationSubmitted(prisma, approved.id);
    expect(
      await prisma.notification.count({
        where: {
          recipientUserId: reservationManagerId,
          type: NotificationType.RESERVATION_SUBMITTED,
          resourceId: String(approved.id),
        },
      }),
    ).toBe(1);
    await reservations.approve(approved.id, reservationManagerId);
    const rejected = await reservations.create(
      {
        resourceId: resource.id,
        startAt: new Date(start.getTime() + 7_200_000),
        endAt: new Date(start.getTime() + 10_800_000),
        purpose: 'Reserva sintética rechazada',
      },
      requesterId,
    );
    await reservations.reject(
      rejected.id,
      'Motivo sintético',
      reservationManagerId,
    );
    expect(
      await prisma.notification.count({
        where: {
          recipientUserId: requesterId,
          type: {
            in: [
              NotificationType.RESERVATION_APPROVED,
              NotificationType.RESERVATION_REJECTED,
            ],
          },
        },
      }),
    ).toBe(2);
    const requester = await prisma.user.findUniqueOrThrow({
      where: { id: requesterId },
    });
    const resolvedNotification = await prisma.notification.findFirstOrThrow({
      where: {
        recipientUserId: requesterId,
        type: NotificationType.RESERVATION_APPROVED,
      },
    });
    await expect(
      inbox.markRead(
        {
          id: requester.id,
          fullName: requester.fullName,
          email: requester.email,
          status: requester.status,
          role: `${marker}-requester`,
          canAccessErp: true,
          permissionCodes: [],
        },
        resolvedNotification.id,
      ),
    ).resolves.toMatchObject({ action: null });
  });

  it('keeps concurrent overlapping reservation creation atomic and emits one notification', async () => {
    const resource = await prisma.reservableResource.create({
      data: {
        name: `${marker}-concurrent-resource`,
        pricingType: ResourcePricingType.FREE,
      },
    });
    const start = new Date(Date.now() + 259_200_000);
    const attempt = () =>
      reservations.create(
        {
          resourceId: resource.id,
          startAt: start,
          endAt: new Date(start.getTime() + 3_600_000),
          purpose: 'Reserva concurrente sintética',
        },
        requesterId,
      );
    const results = await Promise.allSettled([attempt(), attempt()]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const reservationsInSlot = await prisma.reservation.findMany({
      where: { resourceId: resource.id, status: ReservationStatus.PENDING },
    });
    expect(reservationsInSlot).toHaveLength(1);
    expect(
      await prisma.notification.count({
        where: {
          recipientUserId: reservationManagerId,
          type: NotificationType.RESERVATION_SUBMITTED,
          resourceId: String(reservationsInSlot[0].id),
        },
      }),
    ).toBe(1);
  });

  it('rolls back failed approval without a resolution notification', async () => {
    const resource = await prisma.reservableResource.create({
      data: {
        name: `${marker}-rollback-resource`,
        pricingType: ResourcePricingType.FIXED,
        price: 1,
      },
    });
    const reservation = await prisma.reservation.create({
      data: {
        resourceId: resource.id,
        requesterUserId: requesterId,
        startAt: new Date(Date.now() + 172_800_000),
        endAt: new Date(Date.now() + 176_400_000),
        purpose: 'Rollback sintético',
        status: ReservationStatus.PENDING,
      },
    });
    await prisma.financialCharge.create({
      data: { reservationId: reservation.id, amount: 1 },
    });
    await expect(
      reservations.approve(reservation.id, reservationManagerId),
    ).rejects.toThrow();
    expect(
      (
        await prisma.reservation.findUniqueOrThrow({
          where: { id: reservation.id },
        })
      ).status,
    ).toBe(ReservationStatus.PENDING);
    expect(
      await prisma.notification.count({
        where: {
          resourceId: String(reservation.id),
          type: NotificationType.RESERVATION_APPROVED,
        },
      }),
    ).toBe(0);
  });
});
